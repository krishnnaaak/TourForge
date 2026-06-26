const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema({
  url: { type: String, required: true },       // "/uploads/filename.jpg"
  filename: { type: String, required: true },
  label: { type: String, default: "" },        // e.g. "Living Room"
  order: { type: Number, default: 0 },
});

const tourSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    niche: {
      type: String,
      enum: ["real-estate", "architecture", "interior-design", "art-gallery", "other"],
      default: "real-estate",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    images: [imageSchema],
    isPublished: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Tour", tourSchema);
