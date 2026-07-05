const mongoose = require("mongoose");

const designSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    shortcode: {
      type: String,
      trim: true,
      default: "",
    },
    oldRate: {
      type: Number,
      default: 0,
    },
    rate: {
      type: Number,
      default: 0,
    },
    costing: {
      type: Number,
      default: 0,
    },
    diamonds: {
      type: Number,
      default: 0,
    },
    jarkan: {
      type: Number,
      default: 0,
    },
    panching: {
      type: Number,
      default: 0,
    },
    gala: {
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
