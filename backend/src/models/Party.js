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
  
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Party", partySchema);
