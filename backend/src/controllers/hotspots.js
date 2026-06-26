const Hotspot = require("../models/Hotspot");
const Tour = require("../models/Tour");
const { enqueue, getQueueStats } = require("../queue/worker");

const createHotspot = async (req, res) => {
  const { tourId, imageId, x, y, label, userContext } = req.body;

  if (!tourId || !imageId || x == null || y == null)
    return res.status(400).json({ error: "tourId, imageId, x, y are required" });

  // Verify the tour belongs to the requesting user
  const tour = await Tour.findOne({ _id: tourId, createdBy: req.user._id });
  if (!tour) return res.status(403).json({ error: "Tour not found or access denied" });

  try {
    const hotspot = await Hotspot.create({
      tourId,
      imageId,
      x,
      y,
      label: label || "Hotspot",
      userContext: userContext || "",
      status: "pending",
    });

    res.status(201).json({ hotspot });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Trigger AI generation for a hotspot.
 * Enqueues the job and returns immediately — client polls for status.
 */
const generateContent = async (req, res) => {
  const hotspot = await Hotspot.findById(req.params.id);
  if (!hotspot) return res.status(404).json({ error: "Hotspot not found" });

  // Verify ownership via tour
  const tour = await Tour.findOne({ _id: hotspot.tourId, createdBy: req.user._id });
  if (!tour) return res.status(403).json({ error: "Access denied" });

  // Don't re-queue if already processing
  if (hotspot.status === "processing") {
    return res.json({ message: "Already processing", hotspot });
  }

  hotspot.status = "pending";
  hotspot.lastError = "";
  await hotspot.save();

  // Enqueue — returns immediately
  enqueue(hotspot._id.toString(), { niche: tour.niche });

  const stats = getQueueStats();
  res.json({
    message: "Job queued",
    hotspot,
    queuePosition: stats.size,
  });
};

/**
 * Poll endpoint — frontend calls this every 2s to check status.
 */
const getHotspot = async (req, res) => {
  try {
    const hotspot = await Hotspot.findById(req.params.id);
    if (!hotspot) return res.status(404).json({ error: "Hotspot not found" });
    res.set("Cache-Control", "no-store");  // ADD THIS LINE
    res.json({ hotspot });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateHotspot = async (req, res) => {
  const { label, userContext, x, y } = req.body;
  try {
    const hotspot = await Hotspot.findByIdAndUpdate(
      req.params.id,
      { label, userContext, x, y },
      { new: true }
    );
    if (!hotspot) return res.status(404).json({ error: "Hotspot not found" });
    res.json({ hotspot });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteHotspot = async (req, res) => {
  try {
    await Hotspot.findByIdAndDelete(req.params.id);
    res.json({ message: "Hotspot deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createHotspot,
  generateContent,
  getHotspot,
  updateHotspot,
  deleteHotspot,
};
