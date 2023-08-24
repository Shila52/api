const express = require("express");
const bodyParser = require("body-parser");
const auth = require("./auth");
const tilesMap = require("./TilesMap.js");
const { GetGames, setData, GetGame } = require("./firebase");
const io = require("../socket");
const gamesdb = require("./GamesSchema");

const NUM_TILES = 28;
const NUM_STACK = 7;
const BOARD_SIZE = 784;
const MIDDLE_TILE = 406;

const router = express.Router();

router.use(bodyParser.json());

router.get("/all", auth.userAuthentication, async (req, res) => {
  try {
    const data = await gamesdb.find({ active: false });

    res.json(data);
  } catch (error) {
    res.status(500).json({ msg: error });
  }
});

router.post("/new", auth.userAuthentication, async (req, res) => {
  const createdBy = req.body.body.id;

  const game = new gamesdb({
    active: false,
    numPlayers: 2,
    createdBy,
    players: [],
    playing: false,
    currentPlayer: 0,
    gameTiles: new Array(NUM_TILES).fill(0).map((_, index) => index),
    boardTiles: generateBoardTiles(),
  });
  try {
    await game.save();
    res.sendStatus(200);
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: error });
  }
});

router.get(
  "/:id/join",
  [auth.getgamemiddleware, auth.userAuthentication],
  async (req, res) => {
    try {
      const userName = req.user.name;
      const id = req.user.user_id;

      const playerTiles = await generatePlayerTiles(res.game);
      const playersData = {
        userName,
        playerTiles,
        id,
        stats: {
          score: playerTiles.reduce(
            (sum, value) => sum + tilesMap[value].a + tilesMap[value].b,
            0
          ),
        },
      };

      res.game.players = [...res.game.players, playersData];
      res.game.currentPlayer = res.game.players[0].id;
      if (res.game.players.length === res.game.numPlayers) {
        res.game.active = true;
        res.game.playing = true;
      } else {
        res.game.active = false;
        res.game.playing = false;
      }

      await res.game.save();
      console.log("join");
      console.log(res.game);
      res.sendStatus(200);
    } catch (error) {
      console.log(error);
      res.status(500).json({ msg: error });
    }
  }
);

router.get(
  "/:id/leave",
  [auth.getgamemiddleware, auth.userAuthentication],
  async (req, res) => {
    try {
      const user = req.user;

      const indextoremove = res.game.players.forEach((player, index) => {
        if (player.id == user.user_id) {
          return index;
        }
      });
      res.game.players.splice(indextoremove, 1);
      await res.game.save();
      res.sendStatus(200);
    } catch (error) {
      res.status(500).json({ msg: error });
    }
  }
);

router.patch(
  "/:id/update",
  [auth.getgamemiddleware, auth.userAuthentication],
  async (req, res) => {
    try {
      const user = req.user;

      const data = req.body.body;

      // console.log(player);
      if (data.isChangePlayer) {
        res.game.currentPlayer = res.game.players.find(
          (player) => player.id != user.user_id
        ).id;
      }
      res.game.players.find((player) => player.id == user.user_id).playerTiles =
        data.playerTiles;
      res.game.boardTiles = data.boardTiles;
      const { stats } = res.game.players.find(
        (player) => player.id == user.user_id
      );
      res.game.stats = stats;
      res.game.gameTiles = data.gameTiles;

      res.game.save().then(() => {
      
        res.status(200).json({ gameData: res.game });
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ msg: error });
    }
  }
);

router.appendUserLogoutMessage = function (userInfo) {
  games.push({ user: userInfo, text: `user had logout` });
};

const generatePlayerTiles = async (currentGame) => {
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
router.get(
  "/:id",
  [auth.getgamemiddleware, auth.userAuthentication],
  async (req, res) => {
    const user = req.user;

    const currentGame = await res.game;

    const { playerTiles, stats } = currentGame.players.find(
      (player) => player.id == user.user_id
    );

    const gameObj = currentGame;
    const gameData = {
      ...gameObj,
      playerTiles,
      boardTiles: currentGame.boardTiles,
      stats,
      active: gameObj.players.length === gameObj.numPlayers,
      playing: gameObj.players.length === gameObj.numPlayers,
    };

    res.json(gameData);
  }
);
io.on("connection", (socket) => {
  socket.on("getgamelist", async (data) => {
    if (data.get == true) {
      const data = await gamesdb.find({ active: false });

      io.emit("gamelist", { data: data });
    }
  });
  socket.on("jointoroom", async (requestData) => {
    if (requestData?.id != undefined && requestData?.user_id != undefined) {
      console.log(
        "USer : " + socket.id + " has join : " + String(requestData.id)
      );
      await socket.join(String(requestData.id));
    }
  });
  socket.on("notifyuser", async (requestData) => {
    if (requestData?.id != undefined && requestData?.user_id != undefined) {
      let gameData = await gamesdb.findById(requestData.id);

      if (gameData?.$isNew == false) {
        gameData = gameData._doc;
      }

      const { playerTiles, stats } = gameData.players.find(
        (player) => player.id == requestData.user_id
      );

      const gameObj = gameData;
      gameData = {
        ...gameObj,
        playerTiles,
        boardTiles: gameData.boardTiles,
        stats,
        active: gameObj.players.length === gameObj.numPlayers,
        playing: gameObj.players.length === gameObj.numPlayers,
      };
      console.log("notify triged ");
      socket.broadcast
        .to(String(requestData.id))
        .emit("game", { gameData: gameData });
    }
  });
  socket.on("sendupdate", async (requestData) => {
    console.log("update triged");
    if (requestData?.id != undefined && requestData?.user_id != undefined) {
      let gameData = requestData.gameData;

      const { stats } = gameData.players.find(
        (player) => player.id != requestData.user_id
      );

      const gameObj = gameData;
      gameData = {
        ...gameObj,

        boardTiles: gameData.boardTiles,
        stats,
        active: gameObj.players.length === gameObj.numPlayers,
        playing: gameObj.players.length === gameObj.numPlayers,
      };

      socket.broadcast
        .to(String(requestData.id))
        .emit("game", { gameData: gameData });
    }
  });
});

module.exports = router;
