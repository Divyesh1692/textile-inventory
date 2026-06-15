const mongoose = require("mongoose");

const designSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    oldRate: {
      type: Number,
      default: 0,
    },
    rate: {
      type: Number,
      default: 0,
    },

    photos: [
      {
        type: String, // Cloudinary image URL
      },
    ],
  },
  { timestamps: true },
);

module.exports = mongoose.model("Design", designSchema);
