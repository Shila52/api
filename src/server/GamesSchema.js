const { default: mongoose } = require("mongoose");

const gamesSchema = new mongoose.Schema({
  active: Boolean,
  boardTiles: Array,
  createdBy: String,
  currentPlayer: { type: String, default: "" },
  gameTiles: Array,
  numPlayers: Number,
  players: [
    {
      id: String,
      playerTiles: Array,
      stats: { score: String },
      userName: String,
    },
  ],
  playing: Boolean,
  stats: Object,
});
module.exports = mongoose.model("games", gamesSchema);
