const express = require("express");
const bodyParser = require("body-parser");
const auth = require("./auth");
const userDb = require("./userSchema");
const gamesDb = require("./GamesSchema");
const hsDb = require("./histroySchema");
const io = require("../socket");

const router = express.Router();
// state 1 = user offline
// state 2 = user online
// state 3 = user search for game
// state 4  = user ingame
router.use(bodyParser.json());
router.post("/create", async (req, res) => {
  try {
    const data = req.body.data;
    await userDb.findOne({ id: data.id }).then((getuser) => {
      if (getuser == null) {
        userDb
          .create({
            state: 2,
            id: data.id,
            name: data.name,
            socketid: "",
          })
          .then(() => {
            res.sendStatus(200);
          });
      } else {
        res.sendStatus(200);
      }
    });
  } catch (error) {
    res.status(500).json({ msg: error });
  }
});

io.on("connect", (socket) => {
  socket.on("disconnect", async () => {
    const getUser = await userDb.findOne({ socketid: socket.id });
    console.log(getUser);
    await userDb
      .findOneAndUpdate({ socketid: socket.id }, { state: 1 })
      .then(async (res) => {
        if (getUser != null) {
          await userDb.find({ gameid: getUser.gameid }).then((res) => {
            io.to(
              res.find((p) => p.socketid != getUser.socketid).socketid
            ).emit("userGoingOffline");
          });
          setTimeout(async () => {
            const lastTime = await userDb.findById(getUser._id);
            if (lastTime.state == 1 || lastTime.gameid=="") {
              let currentGame = await gamesDb.findById(lastTime.gameid);
              let historyGame = await hsDb.findOne({ gameid: currentGame._id });
              if (currentGame.players.length == 2) {
                currentGame.players.find((p) => p.id != lastTime.id).point = 51;
                const prize = currentGame.dealedcoin;
                const winner = currentGame.players.find(
                  (p) => p.id != lastTime.id
                );
                const self = currentGame.players.find(
                  (p) => p.id == lastTime.id
                );
                currentGame.players.forEach(async (p) => {
                  const user = await userDb.findOne({ id: p.id });
                  let newPrize = user.coins;
                  if (p.id == winner.id) {
                    newPrize = newPrize + prize;
                  }
                  await userDb.findOneAndUpdate(
                    { id: p.id },
                    { gameid: "", state: 2, coins: newPrize }
                  );
                });
                historyGame.p1 = winner;
                historyGame.p2 = self;
                historyGame.winner = winner;
                currentGame.players[0].playerTiles = [];
                currentGame.players[1].playerTiles = [];
                currentGame.gameStats.isGameover.result = true;

                try {
                  await historyGame.save();
                  currentGame.save().then(() => {
                    io.to(String(currentGame._id)).emit("game", {
                      gameData: currentGame,
                    });

                    socket.broadcast
                      .to(String(currentGame._id))
                      .emit("userNotReturn");
                  });
                } catch (error) {
                  console.log(error);
                }
              } else {
                await userDb.findOneAndUpdate(
                  { id: lastTime.id },
                  { gameid: "", state: 2 }
                );
              }
            }
            console.log(lastTime);
          }, 95000);
        }
      });
  });

  socket.on("makeUseronline", async (data, callback) => {
    try {
      await userDb
        .findOneAndUpdate({ id: data.id }, { state: 2, socketid: socket.id })
        .then((res) => {
          callback({
            state: 2,
          });
        });
    } catch (error) {
      console.log(error);
    }
  });
  socket.on("makeUserSearching", async (data, callback) => {
    try {
      await userDb
        .findOneAndUpdate({ id: data.id }, { state: 3, dealingcoin: data.coin })
        .then(() => {
          callback({
            state: 3,
          });
        });
    } catch (error) {
      console.log(error);
    }
  });
  socket.on("playing", async (data) => {
    try {
      await userDb
        .findOneAndUpdate({ id: data.id }, { state: 4 })
        .then((res) => {
          io.to(String(data.gameid)).emit("returned", { name: res.name });
        });
    } catch (error) {
      console.log(error);
    }
  });
});
module.exports = router;
