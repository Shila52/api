const express = require("express");
const bodyParser = require("body-parser");
const auth = require("./auth");
const tilesMap = require("./TilesMap.js");
const { setData, searchForGames, GetGame } = require("./firebase");

const NUM_TILES = 28;
const NUM_STACK = 5;
const BOARD_SIZE = 784;
const MIDDLE_TILE = 406;
const games = [];

const router = express.Router();

router.use(bodyParser.json());

router.post("/new", auth.userAuthentication, async (req, res) => {
  //search for games if we have else create games
  const id = req.body.user_id;
  let Data = await searchForGames(id);

  if (Data.length == 1) {
    const playerTiles = generatePlayerTiles(Data[0]);
    const players = {
      id: id,
      playerTiles,
      stats: {
        score: playerTiles.reduce(
          (sum, value) => sum + tilesMap[value].a + tilesMap[value].b,
          0
        ),
      },
    };

    const addplayers = [{ players }];
    Data = Data[0];
    Data.active = true;
    Data.playing = true;
    Data.players = [...Data.players, ...addplayers];
    await setData("games/" + Data.id, Data);
  } else {
    const createdBy = req.body.user_id;
    let game = {
      id: Math.random().toString(36).substr(2, 9),
      numPlayers: 2,
      active: false,
      createdBy,
      players: null,
      playing: false,
      currentPlayer: 0,
      gameTiles: new Array(NUM_TILES).fill(0).map((_, index) => index),
      boardTiles: generateBoardTiles(),
    };

    const playerTiles = generatePlayerTiles(game);
    const players = {
      id: createdBy,
      playerTiles,
      stats: {
        score: playerTiles.reduce(
          (sum, value) => sum + tilesMap[value].a + tilesMap[value].b,
          0
        ),
      },
    };
    game.players = [players];

    await setData("games/" + game.id, game)
    res.status(200).json(game)

   
  }
});

router.get("/:id", auth.userAuthentication, async (req, res) => {
  const token = req.headers.authorization.split(" ");

  const user = token[1];

  const currentGame = await GetGame(req.params.id);

  const { playerTiles, stats } = currentGame.players.find(
    (player) => player.id === parseInt(user)
  );

  const gameObj = currentGame;
  const gameData = {
    ...gameObj,
    playerTiles,
    boardTiles: currentGame.boardTiles,
    stats,
    active: gameObj.players.length === gameObj.numPlayers,
    playing: gameObj.players[gameObj.currentPlayer].id === parseInt(user),
  };


  res.status(200).json(gameData);
});

router.get("/:id/join", auth.userAuthentication, (req, res) => {
  const userName = auth.getUserInfo(req.session.id).name;
  const currentGame = games.find((game) => game.id === req.params.id);

  const playerTiles = generatePlayerTiles(req.params.id);

  currentGame.players.push({
    userName,
    playerTiles,
    stats: {
      score: playerTiles.reduce(
        (sum, value) => sum + tilesMap[value].a + tilesMap[value].b,
        0
      ),
    },
  });

  if (currentGame.players.length === currentGame.numPlayers) {
    currentGame.active = true;
  } else {
    currentGame.active = false;
  }

  res.sendStatus(200);
});

router.get("/:id/leave", auth.userAuthentication, (req, res) => {
  const userName = auth.getUserInfo(req.session.id).name;
  const currentGame = games.find((game) => game.id === req.params.id);

  const playerIndex = currentGame.players.forEach((player, index) => {
    if (player.userName === userName) return index;
  });
  currentGame.players.splice(playerIndex, 1);
  res.sendStatus(200);
});

router.post("/:id/update", auth.userAuthentication, (req, res) => {
  let currentGame = games.find((game) => game.id === req.params.id);
  const userName = auth.getUserInfo(req.session.id).name;
  const data = JSON.parse(req.body);

  currentGame.players.find(
    (player) => player.userName === userName
  ).playerTiles = data.playerTiles;

  currentGame.boardTiles = data.boardTiles;
  currentGame.currentPlayer =
    (currentGame.currentPlayer + 1) % currentGame.numPlayers;

  res.sendStatus(200);
});

router.appendUserLogoutMessage = function (userInfo) {
  games.push({ user: userInfo, text: `user had logout` });
};

const generatePlayerTiles = (game) => {
  const currentGame = game;

  const gameTiles = currentGame.gameTiles;
  const playerTiles = [];

  Array(NUM_STACK)
    .fill("")
    .map(() => {
      const randomIndex = Math.floor(
        Math.random() * Math.floor(gameTiles.length)
      );

      playerTiles.push(gameTiles[randomIndex]);
      gameTiles.splice(randomIndex, 1);
    });

  return playerTiles;
};

const generateBoardTiles = () => {
  const boardTiles = new Array(BOARD_SIZE).fill({}).map((_, index) => {
    return {
      id: index,
      tile: 0,
      placed: false,
      placeholder: true,
      rotated: true,
      rendered: false,
    };
  });

  boardTiles[MIDDLE_TILE].rendered = true;
  boardTiles[MIDDLE_TILE].isFirst = true;

  return boardTiles;
};

module.exports = router;
