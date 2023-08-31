const { default: mongoose } = require("mongoose");

const gamesSchema = new mongoose.Schema({
  active: Boolean,
  boardTiles: Array,
  createdBy: String,
  currentPlayer: { type: String, default: "" },
  gameTiles: Array,
  numPlayers: Number,
  dealedcoin: {
    type: Number,
  },
  players: [
    {
      id: String,
      playerTiles: Array,
      stats: { score: String },
      userName: String,
      point: { type: Number, default: 0 },
      elapsedTime: { type: Number, default: 0 },
    },
  ],
  playing: Boolean,
  stats: Object,
  gameStats: {
    isGameover: { type: Object, default: { result: false, id: "" } },
  },
});
module.exports = mongoose.model("games", gamesSchema);
