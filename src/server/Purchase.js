const { default: mongoose } = require("mongoose");
const Purchase = new mongoose.Schema({
  user_id: { type: String },
  user_name: { type: String },

  amount_Coins: {
    type: Number,
  },
  amount_Price: {
    type: Number,
  },
  method_type: { type: String },
  image: { type: Array },
  UserAddress: {
    type: String,
    default: "",
  },
  state: {
    type: String,
    default: "Pending",
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});
module.exports = mongoose.model("purchase", Purchase);
