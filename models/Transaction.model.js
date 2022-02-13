const { Schema, model } = require("mongoose");

const transactionSchema = new Schema({
  payer: {
    type: String,
    required: true,
  },
  points: {
    type: Number,
    required: true,
  },
  timestamp: {
    type: Date,
    required: true,
  },
});

const Transaction = model("Transaction", transactionSchema);

module.exports = Transaction;
