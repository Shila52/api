const express = require("express");
const bodyParser = require("body-parser");
const auth = require("./auth");
const userDb = require("./userSchema");
const gamesDb = require("./GamesSchema");
const hsDb = require("./histroySchema");
const io = require("../socket");

const router = express.Router();
const Purchase = require("./Purchase");
const Coinbase = require("coinbase-commerce-node");
const { withdrawals } = require("./WithdrawlSchema");
const cb_Client = Coinbase.Client;
const cb_resource = Coinbase.resources;
cb_Client.init("ec4cf5ab-53b0-4a5c-81f3-c1c39e7e68c9");
router.use(bodyParser.json());
const Webhook = Coinbase.Webhook;

// router.post("/callback", async (req, res) => {
//   const { body } = req;
//   const data = JSON.parse(body.data);
//   const TRADE_NO = data.merchantTradeNo;
//   const PRE_PAY_ID = body.bizIdStr;
//   const Get_Purchase = await Purchase.findOne({
//     merchantTradeNo: TRADE_NO,
//     prepay_Id: PRE_PAY_ID,
//   });

//   if (
//     body.bizType == "PAY" &&
//     body.bizStatus == "PAY_SUCCESS" &&
//     Get_Purchase != null
//   ) {
//     // every thing fine lets add balance to user and notify binace to we add all things
//     const User = await Purchase.findById(Get_Purchase.user_id);
//     User.coins = User.coins + Get_Purchase.amount_Coins;
//     Get_Purchase.state = "Success";
//     User.save(() => {
//       Get_Purchase.save(() => {
//         return res
//           .json({
//             returnCode: "SUCCESS",
//             returnMessage: null,
//           })
//           .status(200);
//       });
//     });
//   } else if (
//     body.bizType == "PAY" &&
//     body.bizStatus == "PAY_FAIL" &&
//     Get_Purchase != null
//   ) {
//     // we can set state fail collection in my monngo and notify my user poayment fail think so
//     Get_Purchase.state = "Failed";

//     Get_Purchase.save(() => {
//       return res
//         .json({
//           returnCode: "Fail",
//           returnMessage: "Failed by Binace",
//         })
//         .status(200);
//     });
//   } else if (
//     body.bizType == "PAY" &&
//     body.bizStatus == "PAY_CLOSED" &&
//     Get_Purchase != null
//   ) {
//     //it means expire i think
//     Get_Purchase.state = "Failed";

//     Get_Purchase.save(() => {
//       return res
//         .json({
//           returnCode: "Fail",
//           returnMessage: "Failed Expired i thiml",
//         })
//         .status(200);
//     });
//   } else {
//     return res
//       .json({
//         returnCode: "FAIL",
//         returnMessage: "unKnwon Errors",
//       })
//       .status(200);
//   }
// });
// router.post("/webhooks", async (req, res) => {
//   try {
//     const WEBHOOK_STR = "3fa1b3f5-c0e2-4877-a588-3cff672a52fc";
//     const event = Webhook.verifyEventBody(
//       req.rawBody,
//       req.headers["x-cc-webhook-signature"],
//       WEBHOOK_STR
//     );

//     if (event.type == "charge:confirmed") {
//       const Purchase_id = event.data.id;
//       const User_id = event.data.metadata.customer_id;
//       try {
//         const Get_Purchase = await Purchase.findOne({
//           user_id: User_id,
//           Purchase_id: Purchase_id,
//         });

//         const User = await userDb.findById(User_id);

//         if (User) {
//           User.coins = User.coins + Get_Purchase.amount_Coins;
//           Get_Purchase.state = "Success";
//           await User.save();
//           await Get_Purchase.save();
//           return res
//             .json({
//               returnCode: "SUCCESS",
//               returnMessage: null,
//             })
//             .status(200);
//         } else {
//           console.log("user Not Found");
//         }
//       } catch (error) {
//         console.log(error);
//         console.log("error on webhook create add coin on user account ");
//       }
//     } else if (event.type == "charge:created") {
//       const Purchase_id = event.data.id;
//       const User_id = event.data.metadata.customer_id;
//       try {
//         const Get_Purchase = await Purchase.findOne({
//           user_id: User_id,
//           Purchase_id: Purchase_id,
//         });
//       } catch (error) {
//         console.log(error);
//         console.log("error on webhook create add coin on user account ");
//       }
//     }
//   } catch (error) {
//     res.sendStatus(500);
//     console.log("Failed");
//   }
//   const { body } = req;
//   console.log("test");
// });

router.post("/generatePayments", auth.userAuthentication, async (req, res) => {
  const User = req.user;

  const { data } = req.body;
  const ChngeRate = 0.1; //$
  const orderAmount = data.TotalAmount * ChngeRate;
  const PAYMENTOPTION = data.PaymentOption; //USD $
  try {
    const json_data = {
      user_id: User._id,
      user_name: User.name,
      image: [],
      amount_Coins: parseInt(data.TotalAmount),
      amount_Price: orderAmount,
      method_type: PAYMENTOPTION,
    };

    try {
      await Purchase.create(json_data).then((result) => {
        res.json(result).status(200);
      });
    } catch (error) {
      console.log(error);
      console.log("Error on creating purchase");
    }
    // }
  } catch (error) {
    console.log("failed creating Charge");
  }
});
router.post("/withdrawl", auth.userAuthentication, async (req, res) => {
  const User = req.user;

  const { data } = req.body;
  console.log(data.Amount);

  if (parseInt(data.Amount) < 5000 || parseInt(data.Amount) > User.coins) {
    res.status(422).json({ err: "not allowed coins" });
    return;
  }
  try {
    const json_data = {
      user: User._id,
      Amount: parseInt(data.Amount),
      PhoneNumber: data.PhoneNumber,
      PaymentOption: data.PaymentOption,
    };

    try {
      const check = await withdrawals.findOne({
        user: User._id,
        State: "Pending",
      });
      if (check) {
        check.Amount = json_data.Amount;
        check.PaymentOption = json_data.PaymentOption;
        check.PhoneNumber = json_data.PhoneNumber;
        check.save().then((result) => {
          res.json(result).status(200);
        });
      } else {
        await withdrawals.create(json_data).then((result) => {
          res.json(result).status(200);
        });
      }
    } catch (error) {
      console.log(error);
      console.log("Error on creating purchase");
    }
    // }
  } catch (error) {
    console.log("failed creating Charge");
  }
});
router.patch("/payment/update", auth.userAuthentication, async (req, res) => {
  const { data } = req.body;
  console.log(data.senderAddress.length, "wallet");
  console.log(data.image.length, "image");
  if (data.senderAddress.length == 0 && data.image.length == 0) {
    return res
      .status(422)
      .json({ msg: "you need set Adrdress or upload images" });
  }
  if ((data.senderAddress && data.id, data.image)) {
    Purchase.findByIdAndUpdate(data.id, {
      UserAddress: data.senderAddress,
      image: data.image,
    }).then(() => {
      res.sendStatus(200);
    });
  } else {
    console.log("we doont have ");
  }
});

// const API_KEY =
//   "s4whv5hdexmahi5wk6keo7orlvhm5djkdggiqvwqyalthbrckath7budyncbyg01";
// const API_SECRET =
//   "2rrezw0edjbd1kuw5yszgnrujzw0kvvtaussoypznlza6ry8iydopwhbhwxlsqyi";

// if (data.TotalAmount <= 10) {
//   console.log("u need buy at least 10 coins");
//   return;
// }
// try {
//   // Generate nonce string
//   const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
//   let nonce = "";
//   for (let i = 1; i <= 32; i++) {
//     const pos = Math.floor(Math.random() * chars.length);
//     const char = chars.charAt(pos);
//     nonce += char;
//   }
//   const TRADE_NO = Math.floor(
//     Math.random() * (9825382937292 - 982538) + 982538
//   );

//   // Request body
//   const request = {
//     env: {
//       terminalType: "WEB",
//     },
//     merchantTradeNo: TRADE_NO,
//     orderAmount: orderAmount,
//     currency: PAYMENTOPTION,
//     goods: {
//       goodsType: "02", // virtual goods
//       goodsCategory: "6000", // we tell binace for games & recharge purpose
//       referenceGoodsId: Math.random() * (9825382937292 - 982538) + 982538,
//       goodsName: "Coins",
//       goodsDetail: "Buy Coins",
//     },
//   };

//   const json_request = JSON.stringify(request);

//   const timestamp = Date.now();
//   const payload = `${timestamp}\n${nonce}\n${json_request}\n`;

//   const binance_pay_key = API_KEY;
//   const binance_pay_secret = API_SECRET;
//   const signature = crypto
//     .createHmac("sha512", binance_pay_secret)
//     .update(payload)
//     .digest("hex")
//     .toUpperCase();

//   const headers = {
//     "Content-Type": "application/json",
//     "BinancePay-Timestamp": timestamp.toString(),
//     "BinancePay-Nonce": nonce,
//     "BinancePay-Certificate-SN": binance_pay_key,
//     "BinancePay-Signature": signature,
//   };

//   fetch("https://bpay.binanceapi.com/binancepay/openapi/v2/order", {
//     method: "POST",
//     headers: headers,
//     body: json_request,
//   })
//     .then((response) => response.json())
//     .then(async (result) => {
//       try {
//         if (result.status == "SUCCESS") {
//           console.log(result);

//           await Purchase.create({
//             user_id: User._id,
//             amount_Coins: parseInt(data.TotalAmount),
//             amount_Price: orderAmount,
//             merchantTradeNo: TRADE_NO,
//             prepay_Id: result.data.prepayId,
//           }).then(() => {
//             res.json(result).status(200);
//           });
//         }
//       } catch (error) {
//         console.log(" Error on setTrade No");
//       }
//     })

//     .catch((error) => console.error("Error:", error));
// } catch (error) {
//   res.status(500).json({ msg: error });
// }
// router.get("/getPayments", async (req, res) => {
//   const API_KEY =
//     "s4whv5hdexmahi5wk6keo7orlvhm5djkdggiqvwqyalthbrckath7budyncbyg01";
//   const API_SECRET =
//     "2rrezw0edjbd1kuw5yszgnrujzw0kvvtaussoypznlza6ry8iydopwhbhwxlsqyi";

//   // if (data.TotalAmount <= 10) {
//   //   console.log("u need buy at least 10 coins");
//   //   return;
//   // }
//   try {
//     // Generate nonce string
//     const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
//     let nonce = "";
//     for (let i = 1; i <= 32; i++) {
//       const pos = Math.floor(Math.random() * chars.length);
//       const char = chars.charAt(pos);
//       nonce += char;
//     }
//     const TRADE_NO = Math.floor(
//       Math.random() * (9825382937292 - 982538) + 982538
//     );

//     // Request body
//     const request = {
//       prepayId: "249468277003747328"
//     };

//     const json_request = JSON.stringify(request);

//     const timestamp = Date.now();
//     const payload = `${timestamp}\n${nonce}\n${json_request}\n`;

//     const binance_pay_key = API_KEY;
//     const binance_pay_secret = API_SECRET;
//     const signature = crypto
//       .createHmac("sha512", binance_pay_secret)
//       .update(payload)
//       .digest("hex")
//       .toUpperCase();

//     const headers = {
//       "Content-Type": "application/json",
//       "BinancePay-Timestamp": timestamp.toString(),
//       "BinancePay-Nonce": nonce,
//       "BinancePay-Certificate-SN": binance_pay_key,
//       "BinancePay-Signature": signature,
//     };

//     fetch("https://bpay.binanceapi.com/binancepay/openapi/v2/order/query", {
//       method: "POST",
//       headers: headers,
//       body: json_request,
//     })
//       .then((response) => response.json())
//       .then(async (result) => {
//         console.log(result);
//       })

//       .catch((error) => console.error("Error:", error));
//   } catch (error) {
//     res.status(500).json({ msg: error });
//   }
// });
router.post("/create", async (req, res) => {
  try {
    const data = req.body.data;
    await userDb.findOne({ id: data.id }).then(async (getuser) => {
      if (getuser == null) {
        await userDb
          .create({
            state: 2,
            id: data.id,
            token: data.token,
            name:
              data.name ||
              "player" +
                String(Math.floor(Math.random() * (99999 - 10000 + 1)) + 10000),
            phone: data.phone || null,
            socketid: "",
            email: data.email || null,
          })
          .then((result) => {
            res.json({ user: result }).status(200);
          });
      } else {
        console.log("aleardy loged in ");
        getuser.token = data.token;
        await getuser
          .save()
          .then(() => {
            io.to(getuser.socketid).emit("AnotherLogin", { logedout: true });
            res.json({ user: getuser }).status(200);
          })
          .catch((err) => {
            console.log(err);
            res.sendStatus(500);
          });
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: error });
  }
});

io.on("connect", (socket) => {
  console.log("USerjs connected : " + socket.id);
  socket.on("disconnect", async () => {
    const getUser = await userDb.findOne({ socketid: socket.id });

    //console.log(getUser);

    if (getUser != null) {
      await userDb
        .findByIdAndUpdate(getUser._id, { state: 1 }, { new: true })
        .then(async (res) => {
          if (getUser.state == 2) {
            console.log(" User on looby going Offline we Dont Do any Thing ");
            // it means user left in looby
            const OnlineUser = await userDb.find({ state: 2 });
            io.emit("allUserOnline", { OnlineUser: OnlineUser.length });
          } else {
            const OnlineUser = await userDb.find({ state: 2 });
            io.emit("allUserOnline", { OnlineUser: OnlineUser.length });
            if (getUser != null && getUser.gameid != "") {
              console.log("we set time out in    offline");
              setTimeout(async () => {
                console.log("checking what happen ");

                let currentGame = await gamesDb.findById(getUser.gameid);

                const player = await userDb.findOne({
                  id: currentGame.players[0].id,
                });

                if (player.state == 1) {
                  //bot win the game
                  // let historyGame = await hsDb.findOne({
                  //   gameid: currentGame._id,
                  // });

                  currentGame.players[1].point = 50; // we set 50 point for bot
                  const prize = currentGame.dealedcoin ;
                  const winner = currentGame.players[1];

                  let newPrize = player.coins;

                  newPrize = newPrize - prize;

                  await userDb.findByIdAndUpdate(player._id, {
                    gameid: "",
                    state: 1,
                    coins: newPrize,
                  });

                  // historyGame.p1 = winner;
                  // historyGame.p2 = self;
                  // historyGame.winner = winner;
                  currentGame.players[0].playerTiles = [];
                  currentGame.players[1].playerTiles = [];
                  currentGame.gameStats.isGameover.result = true;

                  try {
                    // await historyGame.save();
                    await gamesDb
                      .findByIdAndUpdate(currentGame._id, currentGame)
                      .then(() => {
                        console.log(
                          winner.userName +
                            ": win the game in checking of Offline "
                        );
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
                }
              }, 12000);
            } else {
              console.log("We dont Find any USer  that before in game  ");
            }
          }
        });
    }
  });

  socket.on("makeUseronline", async (data, callback) => {
    try {
      console.log(data);
      await userDb

        .findOneAndUpdate({ id: data.id }, { state: 2, socketid: socket.id })
        .then(async (res) => {
          // user db  get players state =2
          const OnlineUser = await userDb.find({ state: 2 });
          const LastUpdate = await userDb.findById(res._id);
          console.log("make User Online : " + LastUpdate.state);
          io.emit("allUserOnline", { OnlineUser: OnlineUser.length });
          await callback({
            state: LastUpdate.state,
          });
        });
    } catch (error) {
      console.log(error);
    }
  });
  const SEARCHING_STATE = 3;

  socket.on("makeUserSearching", async (data, callback) => {
    try {
      const UpdatedUser = await userDb.findOneAndUpdate(
        { id: data.id },
        { state: 3, dealingcoin: data.dealingcoin }
      );
      const LastUpdate = await userDb.findById(UpdatedUser._id);
      console.log("make User Searching : " + LastUpdate.state);
      await callback({
        state: LastUpdate.state,
      });
    } catch (error) {
      console.log(error);
    }
  });
  socket.on("playing", async (data) => {
    try {
      await userDb
        .findOneAndUpdate({ id: data.id }, { state: 4 }, { new: true })
        .then((res) => {
          io.to(String(data.gameid)).emit("returned", { name: res.name });
        });
    } catch (error) {
      console.log(error);
    }
  });
});

module.exports = router;
