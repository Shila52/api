const { default: mongoose } = require("mongoose");
const historySchema = new mongoose.Schema({
  p1: {
    id: String,
    playerTiles: Array,
    stats: { score: String },
    userName: String,
    point: { type: Number, default: 0 },
  },
  p2: {
    id: String,
    playerTiles: Array,
    stats: { score: String },
    userName: String,
    point: { type: Number, default: 0 },
  },
  winner: {
    id: String,
    playerTiles: Array,
    stats: { score: String },
    userName: String,
    point: { type: Number, default: 0 },
  },
  gameid: { type: String, default: "" },
  dealedcoins: {
    type: Number,
    default: 0,
  },
  created: {
    type: Date,
    default: Date.now(),
  },
});
module.exports = mongoose.model("history", historySchema);
