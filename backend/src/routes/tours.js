
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { validateTour, validateMongoId } = require("../middleware/validate");
const Tour = require("../models/Tour");
const Hotspot = require("../models/Hotspot");
const { createTour, getMyTours, getTourById, updateTour, deleteTour } = require("../controllers/tours");

router.use(auth);

router.post("/", validateTour, createTour);
router.get("/", getMyTours);
router.get("/:id", validateMongoId, getTourById);
router.put("/:id", validateMongoId, validateTour, updateTour);
router.delete("/:id", validateMongoId, deleteTour);

router.delete("/:id/images/:imageId", validateMongoId, async (req, res) => {
  try {
    const tour = await Tour.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!tour) return res.status(404).json({ error: "Tour not found" });

    const imageExists = tour.images.some(img => img._id.toString() === req.params.imageId);
    if (!imageExists) return res.status(404).json({ error: "Image not found" });

    tour.images = tour.images.filter(img => img._id.toString() !== req.params.imageId);
    await tour.save();

    await Hotspot.deleteMany({ tourId: req.params.id, imageId: req.params.imageId });
    res.json({ message: "Image and its hotspots deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;