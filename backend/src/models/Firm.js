const mongoose = require("mongoose");

const firmSchema = new mongoose.Schema(
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
    logo: {
      type: String, // Cloudinary URL
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Firm", firmSchema);
