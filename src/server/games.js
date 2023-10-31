const express = require("express");
const bodyParser = require("body-parser");
const auth = require("./auth");
const tilesMap = require("./TilesMap.js");
const io = require("../socket");
const gamesdb = require("./GamesSchema");
const userDb = require("./userSchema");
const hsDb = require("./histroySchema");
const BoardTiles = require("../BoardTiles");
const RightPosition = require("../RightPosition");
const LeftPosition = require("../LeftPosition");
const NUM_TILES = 28;
const NUM_STACK = 7;
const BOARD_SIZE = 784;
const MIDDLE_TILE = 406;

const router = express.Router();

router.use(bodyParser.json());

router.get("/lastmatch", [auth.userAuthentication], async (req, res) => {
  try {
    const user = req.user;

    console.log(user.gameid);

    if (user.gameid != "") {
      try {
        const game = await gamesdb.findById(user.gameid);

        if (game.gameStats.isGameover.result == false) {
          res.status(200).json({ gameid: game._id });
        } else {
          //we can notfiy user match has finish

          res.status(200).json({ gameid: null });
        }
      } catch (error) {
        console.log("games Not Found ");
        res.status(200).json({ gameid: null });
      }
    } else {
      res.status(200).json({ gameid: null });
    }

    // console.log(game)
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: error });
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

      if (res.game.players.find((p) => p.id == id)) {
        if (res.game.players.length == 2) {
          res.sendStatus(200);
        } else {
          res.sendStatus(201);
        }
      } else {
        res.game.players = [...res.game.players, playersData];
        res.game.currentPlayer = res.game.players[0].id;
        if (res.game.players.length === res.game.numPlayers) {
          res.game.active = true;
          res.game.playing = true;
        } else {
          res.game.active = false;
          res.game.playing = false;
        }
        try {
          await gamesdb
            .findByIdAndUpdate(res.game._id, res.game)
            .then(async () => {
              await userDb
                .findOneAndUpdate({ id: id }, { gameid: res.game._id })
                .then(() => {
                  if (res.game.players.length == 2) {
                    res.sendStatus(200);
                    console.log("join");
                  } else {
                    res.sendStatus(201);
                  }
                });
            });
        } catch (error) {
          console.log(error);
        }
      }
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

      await userDb
        .findOneAndUpdate({ id: user.user_id }, { state: 2, gameid: "" })
        .then(() => {
          res.sendStatus(200);
        });
    } catch (error) {
      res.status(500).json({ msg: error });
    }
  }
);
router.post("/generategame", [auth.userAuthentication], async (req, res) => {
  try {
    const { coins } = req.body;
    const user = req.user;

    const newGame = new gamesdb({
      active: false,
      numPlayers: 2,
      createdBy: user.id,
      dealedcoin: coins,
      players: [],
      playing: false,
      currentPlayer: user.id,
      gameTiles: new Array(NUM_TILES).fill(0).map((_, index) => index),
      boardTiles: generateBoardTiles(),
    });
    //end create game
    //join players
    const Playersget = [
      { id: user.id, name: user.name },
      { id: "cedd0894-6a57-11ee-8c99-0242ac120002", name: "Bot" },
    ]; // second will be bot id its static one
    Playersget.forEach(async (p) => {
      const userName = p.name;
      const id = p.id;
      const playerTiles = await generatePlayerTiles(newGame);
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

      newGame.players = [...newGame.players, playersData];
      newGame.currentPlayer = "cedd0894-6a57-11ee-8c99-0242ac120002";
      newGame.active = true;
      newGame.playing = true;
    });
    await newGame.save().then(async (game) => {
      await userDb
        .findByIdAndUpdate(user._id, { state: 4, gameid: game._id })
        .then(() => {
          return res.status(200).json({ gameid: game._id });
        });
    });
  } catch (error) {
    console.log(error);
  }
});
router.patch(
  "/:id/update",
  [auth.getgamemiddleware, auth.userAuthentication],
  async (req, res) => {
    try {
      const user = req.user;
      const data = req.body.body;
      if (data.gameStats.isGameover.result) {
        console.log(
          "Game Finshied we Set history and Winner if we get a user have more than 50 point "
        );
        let idWinner =
          data.gameStats.isGameover.id != ""
            ? data.gameStats.isGameover.id
            : null;
        console.log("id winner " + idWinner);

        if (idWinner != null) {
          res.game.currentPlayer = idWinner;
          //find playuer id
          
          let sum = 0;
          
            data.players
              .find((p) => p.id != idWinner)
              .playerTiles.forEach((value) => {
                sum = sum + tilesMap[value].a + tilesMap[value].b;
              })
          

          res.game.players.find((p) => p.id == idWinner).point =
            res.game.players.find((p) => p.id == idWinner).point + sum;

          if (res.game.players.find((p) => p.id == idWinner).point >= 50) {
            //return game finished
            const prize = res.game.dealedcoin / 2;
            // const gamehistory = await hsDb.findOne({ gameid: res.game._id });

            console.log("Match Finished we set history and winner ");
            await res.game.players.forEach(async (p) => {
              if (p.id != "cedd0894-6a57-11ee-8c99-0242ac120002") {
                const user = await userDb.findOne({ id: p.id });
                let newPrize = user.coins;
                if (p.id == idWinner) {
                  const WinnerFee = (5 / 100) * prize;
                  newPrize = newPrize + (prize - WinnerFee);
                } else {
                  newPrize = newPrize - prize;
                }
                await userDb.findOneAndUpdate(
                  { id: p.id },
                  { gameid: "", state: 1, coins: newPrize }
                );
              }
            });
            // gamehistory.p1 = res.game.players[0];
            // gamehistory.p2 = res.game.players[1];
            // gamehistory.winner = res.game.players.find((p) => p.id == idWinner);
            res.game.players[0].playerTiles = [];
            res.game.players[1].playerTiles = [];
            res.game.gameStats.isGameover.result = true;
            // try {
            //   await gamehistory.save();
            // } catch (error) {
            //   console.log(error);
            // }

            try {
              res.game.save().then(() => {
                res.status(200).json({ gameData: res.game });
              });
            } catch (error) {
              console.log(error);
            }
          } else {
            console.log(
              "no one get 50 point we reset game and set point to wiiner until get 50 point "
            );
            res.game.gameTiles = new Array(NUM_TILES)
              .fill(0)
              .map((_, index) => index);
            res.game.boardTiles = generateBoardTiles();
            await res.game.players.forEach(async (p, i) => {
              const playerTiles = await generatePlayerTiles(res.game);
              res.game.players[i].playerTiles = playerTiles;
              res.game.players[i].stats.score = playerTiles.reduce(
                (sum, value) => sum + tilesMap[value].a + tilesMap[value].b
              );
            });
            res.game.gameStats.isGameover.result = false;
            res.game.gameStats.isGameover.id = "";
            res.game.OrderedPlacedTiles = [];
            res.game.RightPosition = RightPosition;
            res.game.LeftPosition = LeftPosition;
            try {
              gamesdb.findByIdAndUpdate(res.game._id, res.game).then(() => {
                res.status(200).json({ gameData: res.game });
              });
            } catch (error) {
              console.log(error);
            }
          }
        }
      } else {
        if (data.isChangePlayer) {
          res.game.currentPlayer =
            res.game.players[res.game.currentPlayer === user.id ? 1 : 0].id;
        }

        res.game.players[data.currentPlayer == user.id ? 0 : 1].playerTiles =
          data.playerTiles;
        res.game.boardTiles = data.boardTiles;
        const { stats } = res.game.players.find(
          (player) => player.id == user.id
        );

        res.game.stats = stats;
        res.game.gameTiles = data.gameTiles;
        res.game.OrderedPlacedTiles = data.OrderedPlacedTiles;
        res.game.RightPosition = data.RightPosition;
        res.game.LeftPosition = data.LeftPosition;
        await gamesdb
          .findByIdAndUpdate(res.game._id, res.game, { new: false })
          .then(() => {
            res.status(200).json({ gameData: res.game });
          });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({ msg: error });
    }
  }
);

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
    let currentGame = await res.game;
    // console.log(currentGame.players);
    if (currentGame.$isNew == false) {
      currentGame._doc.playerTiles = currentGame._doc.players.find(
        (p) => p.id == user.id
      ).playerTiles;
      currentGame._doc.stats = currentGame.stats;
      currentGame = currentGame._doc;
    }
    const { playerTiles, stats } = currentGame.players.find(
      (player) => player.id == user.id
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
  console.log("Gamejs connected : " + socket.id);
  socket.on("getgamelist", async (data) => {
    if (data.get == true) {
      const data = await gamesdb.find({ active: false });

      io.emit("gamelist", { data: data });
    }
  });
  socket.on("jointoroom", async (requestData) => {
    if (requestData?.id != undefined && requestData?.user_id != undefined) {
      await userDb.findOneAndUpdate(
        { id: requestData.id },
        { socketid: socket.id }
      );
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
