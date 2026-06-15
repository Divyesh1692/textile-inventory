const mongoose = require("mongoose");

const partySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      default: "",
    },
    address: {
      type: String,
      default: "",
    },
    gst: {
      type: String,
      default: "",
    },
    openingBalance: {
      type: Number,
      default: 0,
    },
  
  },
  { timestamps: true }
);

module.exports = mongoose.model("Party", partySchema);
