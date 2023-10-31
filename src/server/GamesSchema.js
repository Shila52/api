const { default: mongoose } = require("mongoose");
const RightPosition = require("../RightPosition");
const LeftPosition = require("../LeftPosition");

const gamesSchema = new mongoose.Schema({
  active: Boolean,
  boardTiles: Array,
  createdBy: String,
  currentPlayer: { type: String, default: "" },
  gameTiles: Array,
  OrderedPlacedTiles: Array,
  numPlayers: Number,
  RightPosition: { type: Array, default: RightPosition },
  LeftPosition: { type: Array, default: LeftPosition },
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
