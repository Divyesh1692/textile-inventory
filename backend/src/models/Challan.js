const mongoose = require("mongoose");

const challanItemSchema = new mongoose.Schema({
  stockId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Stock",
    required: true,
  },
  designId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Design",
    required: true,
  },
  qty: {
    type: Number,
    required: true,
    min: 0.1,
  },
  rate: {
    type: Number,
    required: true,
    min: 0,
  },
});

const challanSchema = new mongoose.Schema(
  {
    challanNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    partyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Party",
    },
    tempPartyName: {
      type: String,
      default: "",
    },
    firmId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Firm",
      required: true,
    },
    deliveryDate: {
      type: Date,
      default: Date.now,
    },
    items: [challanItemSchema],
    totalQty: {
      type: Number,
      required: true,
      min: 0,
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["Delivered", "Billed", "Printed"],
      default: "Delivered",
    },
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Challan", challanSchema);
