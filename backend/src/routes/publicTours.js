const express = require("express");
const router = express.Router();
const Tour = require("../models/Tour");
const Hotspot = require("../models/Hotspot");

// Public route — no auth required
// Only returns completed hotspots (no pending/failed AI jobs shown to viewers)
router.get("/:id", async (req, res) => {
  if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({ error: "Invalid tour ID" });
  }
  try {
    const tour = await Tour.findById(req.params.id);
    if (!tour) return res.status(404).json({ error: "Tour not found" });

    const hotspots = await Hotspot.find({
      tourId: tour._id,
      status: "completed",  // viewers only see completed AI content
    });

    res.set("Cache-Control", "no-store");
    res.json({ tour, hotspots });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;