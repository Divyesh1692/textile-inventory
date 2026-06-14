const mongoose = require("mongoose");

const billSchema = new mongoose.Schema(
  {
    billNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    partyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Party",
      required: true,
    },
    firmId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Firm",
      required: true,
    },
    challanIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Challan",
      },
    ],
    isGst: {
      type: Boolean,
      default: false,
    },
    discountPct: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    grossTotal: {
      type: Number,
      default: 0,
    },
    amountBeforeGst: {
      type: Number,
      default: 0,
    },
    cgst: {
      type: Number,
      default: 0,
    },
    sgst: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["Unpaid", "Paid", "Partial", "Printed"],
      default: "Unpaid",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Bill", billSchema);
