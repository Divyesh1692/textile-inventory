const mongoose = require("mongoose");

const stockSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
    },
    challanNo: {
      type: String,
    },
    designId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Design",
      required: true,
    },
    chartNo: {
      type: String,
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
    },
    qty: {
      type: Number,
      required: true,
    },
    deliveryChallanNo: {
      type: String,
    },
    deliveryDate: {
      type: Date,
    },
    rate: {
      type: Number,
      required: true,
    },
    costing: {
      type: Number,
      default: 0,
    },
    Amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Delivered"],
      default: "Pending",
    },
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Stock", stockSchema);
