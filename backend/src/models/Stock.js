const mongoose = require("mongoose");

const stockSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },

    challanNo: {
      type: String,
      required: true,
    },

    designId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Design",
      required: true,
    },

    chartNo: {
      type: String,
      required: true,
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

    qty: {
      type: Number,
      required: true,
    },

    deliveryChallanNo: {
      type: String,
      // required:true,
    },

    deliveryDate: {
      type: Date,
      // required:true,
    },

    rate: {
      type: Number,
      required: true,
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
  },
  { timestamps: true },
);

module.exports = mongoose.model("Stock", stockSchema);
