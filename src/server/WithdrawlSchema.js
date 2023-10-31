const mongoose = require("mongoose");

// Create a schema for the withdrawal transaction
const withdrawalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  State: { type: String, default: "Pending" },
  PhoneNumber: {
    type: String,
    required: true,
  },
  PaymentOption: {
    type: String,
    required: true,
  },
  Amount: {
    type: Number,
    required: true,
  },
  // Add other withdrawal-related fields as needed
});

// Create models for both the User and WithdrawalTransaction schemas

const withdrawals = mongoose.model("withdrawals", withdrawalSchema);

module.exports = {
  withdrawals,
};
