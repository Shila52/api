const { default: mongoose } = require("mongoose");
// state 1 = user offline
// state 2 = user online
// state 3 = user search for game
// state 4  = user ingame 
const userSchema = new mongoose.Schema({
  id: String,
  name: String,
  state: Number,
});
module.exports = mongoose.model("games", userSchema);
