const { default: mongoose } = require("mongoose");
// state 1 = user offline
// state 2 = user online
// state 3 = user search for game
// state 4  = user ingame
const userSchema = new mongoose.Schema({
  id: String,
  name: String,
  token: String,
  state: { type: Number, default: 1 },
  socketid: { type: String, default: "" },
  gameid: { type: String, default: "" },
  Tradeno: { type: Number, default: 0 },
  phone: String,
  email: String,
  dealingcoin: {
    type: Number,
    default: 0,
  },
  coins: {
    type: Number,
    default: 0,
  },
});
module.exports = mongoose.model("users", userSchema);
