const mongoose = require("mongoose");

// Hotspot status mirrors a real production job lifecycle
const STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
};

const hotspotSchema = new mongoose.Schema(
  {
    tourId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tour",
      required: true,
      index: true,
    },
    imageId: { type: String, required: true }, // References image._id in Tour
    label: { type: String, default: "Hotspot" },

    // Position as percentage (0-100) of image dimensions — responsive to any screen size
    x: { type: Number, required: true, min: 0, max: 100 },
    y: { type: Number, required: true, min: 0, max: 100 },

    // AI-generated content
    description: { type: String, default: "" },
    accessibilityNotes: { type: String, default: "" },
    salesCopy: { type: String, default: "" },

    // Job tracking
    status: {
      type: String,
      enum: Object.values(STATUS),
      default: STATUS.PENDING,
    },
    retryCount: { type: Number, default: 0 },
    lastError: { type: String, default: "" },

    // Context the user provides to guide AI generation
    userContext: { type: String, default: "" },
  },
  { timestamps: true }
);

hotspotSchema.statics.STATUS = STATUS;

module.exports = mongoose.model("Hotspot", hotspotSchema);
