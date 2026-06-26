const Tour = require("../models/Tour");
const Hotspot = require("../models/Hotspot");

const createTour = async (req, res) => {
  const { title, description, niche } = req.body;
  if (!title) return res.status(400).json({ error: "Title is required" });
  try {
    const tour = await Tour.create({ title, description, niche, createdBy: req.user._id });
    res.status(201).json({ tour });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getMyTours = async (req, res) => {
  try {
    const tours = await Tour.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
    res.json({ tours });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getTourById = async (req, res) => {
  try {
    const tour = await Tour.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!tour) return res.status(404).json({ error: "Tour not found" });
    const hotspots = await Hotspot.find({ tourId: tour._id });
    res.json({ tour, hotspots });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateTour = async (req, res) => {
  const { title, description, niche, isPublished } = req.body;
  try {
    const tour = await Tour.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      { title, description, niche, isPublished },
      { new: true, runValidators: true }
    );
    if (!tour) return res.status(404).json({ error: "Tour not found" });
    res.json({ tour });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteTour = async (req, res) => {
  try {
    const tour = await Tour.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
    if (!tour) return res.status(404).json({ error: "Tour not found" });
    await Hotspot.deleteMany({ tourId: req.params.id });
    res.json({ message: "Tour deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { createTour, getMyTours, getTourById, updateTour, deleteTour };