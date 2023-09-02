const express = require("express");
const bodyParser = require("body-parser");
const auth = require("./auth");
const userDb = require("./userSchema");
const gamesDb = require("./GamesSchema");
const hsDb = require("./histroySchema");
const io = require("../socket");
const TilesMap = require("./TilesMap");

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
            token: data.token,
            name: data.name,
            socketid: "",
          })
          .then(() => {
            res.sendStatus(200);
          });
      } else {
        getuser.token = data.token;
        getuser
          .save()
          .then(() => {
            io.to(getuser.socketid).emit("AnotherLogin", { logedout: true });
            res.sendStatus(200);
          })
          .catch((err) => {
            console.log(err);
            res.sendStatus(500);
          });
      }
    });
  } catch (error) {
    res.status(500).json({ msg: error });
  }
});

io.on("connect", (socket) => {
  socket.on("disconnect", async () => {
    console.log(socket.id);
    const getUser = await userDb.findOne({ socketid: String(socket.id) });

    //console.log(getUser);

    if (getUser != null) {
      await userDb
        .findByIdAndUpdate(getUser._id, { state: 1 })
        .then(async (res) => {
          if (getUser.state == 2) {
            console.log("looby");
            // it means user left in looby
            const OnlineUser = await userDb.find({ state: 2 });
            io.emit("allUserOnline", { OnlineUser: OnlineUser.length });
          } else {
            const OnlineUser = await userDb.find({ state: 2 });
            io.emit("allUserOnline", { OnlineUser: OnlineUser.length });
            if (getUser != null && getUser.gameid != "") {
              await userDb.find({ gameid: getUser.gameid }).then((res) => {
                io.to(
                  res.find((p) => p.socketid != getUser.socketid).socketid
                ).emit("userGoingOffline");
              });
              setTimeout(async () => {
                console.log("timeout running");
                const Players = [];
                let currentGame = await gamesDb.findById(getUser.gameid);

                for (const p of currentGame.players) {
                  const player = await userDb.findOne({ id: p.id });
                  Players.push(player);
                }

                if (Players[0].state == 1 && Players[1].state == 4) {
                  let historyGame = await hsDb.findOne({
                    gameid: currentGame._id,
                  });

                  currentGame.players[1].point = 50;
                  const prize = currentGame.dealedcoin;
                  const winner = currentGame.players[1];

                  const self = currentGame.players[0];
                  currentGame.players.forEach(async (p) => {
                    const user = await userDb.findOne({ id: p.id });
                    let newPrize = user.coins;
                    if (p.id == winner.id) {
                      newPrize = newPrize + prize;
                    }
                    await userDb.findOneAndUpdate(
                      { id: p.id },
                      { gameid: "", state: 1, coins: newPrize }
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
                    console.log("err");
                    //console.log(error);
                  }
                } else if (Players[1].state == 1 && Players[0].state == 4) {
                  let historyGame = await hsDb.findOne({
                    gameid: currentGame._id,
                  });

                  currentGame.players[0].point = 50;
                  const prize = currentGame.dealedcoin;
                  const winner = currentGame.players[0];

                  const self = currentGame.players[1];
                  currentGame.players.forEach(async (p) => {
                    const user = await userDb.findOne({ id: p.id });
                    let newPrize = user.coins;
                    if (p.id == winner.id) {
                      newPrize = newPrize + prize;
                    }
                    await userDb.findOneAndUpdate(
                      { id: p.id },
                      { gameid: "", state: 1, coins: newPrize }
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
                    console.log("err");
                    //console.log(error);
                  }
                } else if (Players[1].state == 1 && Players[0].state == 1) {
                  let historyGame = await hsDb.findOne({
                    gameid: currentGame._id,
                  });
                  const prize = currentGame.dealedcoin;

                  const p1 = currentGame.players[0].point;
                  const p2 = currentGame.players[1].point;
                  let winner, self, oppenent;
                  if (p1 > p2) {
                    console.log("p1 win ");
                    currentGame.players[0].point = 50;
                    winner = currentGame.players[0];
                    oppenent = currentGame.players[0];
                    self = currentGame.players[1];
                  } else if (p2 > p1) {
                    currentGame.players[1].point = 50;
                    winner = currentGame.players[1];
                    oppenent = currentGame.players[1];
                    self = currentGame.players[0];
                    console.log("p2 win");
                  } else {
                    oppenent = currentGame.players[1];
                    self = currentGame.players[0];
                    console.log("no one win ");
                  }

                  currentGame.players.forEach(async (p) => {
                    const user = await userDb.findOne({ id: p.id });
                    let newPrize = user.coins;
                    if (p.id == winner?.id) {
                      newPrize = newPrize + prize;
                    }
                    await userDb.findOneAndUpdate(
                      { id: p.id },
                      { gameid: "", state: user.state, coins: newPrize }
                    );
                  });
                  console.log(self);
                  historyGame.p1 = self;
                  historyGame.p2 = oppenent;
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
                    });
                  } catch (error) {
                    console.log("err");
                    //console.log(error);
                  }
                }
              }, 12000);
            } else {
              console.log("he we go ");
            }
          }
        });
    }
  });

  socket.on("makeUseronline", async (data, callback) => {
    try {
      await userDb
        .findOneAndUpdate({ id: data.id }, { state: 2, socketid: socket.id })
        .then(async (res) => {
          // user db  get players state =2
          const OnlineUser = await userDb.find({ state: 2 });

          io.emit("allUserOnline", { OnlineUser: OnlineUser.length });
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
