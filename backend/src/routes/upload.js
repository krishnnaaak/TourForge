const express = require("express");
const multer = require("multer");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const Tour = require("../models/Tour");
const auth = require("../middleware/auth");

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../../uploads"));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG, PNG, and WebP images are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024, files: 20 }, // max 20 files at once
});

const uploadTimeout = (req, res, next) => {
  req.setTimeout(60000, () => {
    res.status(408).json({ error: "Upload timed out. Try fewer or smaller images." });
  });
  next();
};

/**
 * POST /api/upload/:tourId
 * Supports BOTH single and bulk upload.
 * Single: FormData with field "image"
 * Bulk:   FormData with multiple fields all named "images"
 */
router.post("/:tourId", auth, uploadTimeout, upload.fields([
  { name: "image", maxCount: 1 },
  { name: "images", maxCount: 20 },
]), async (req, res) => {
  if (!req.params.tourId.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({ error: "Invalid tour ID" });
  }

  // Collect files from either field name
  const files = [
    ...(req.files?.image || []),
    ...(req.files?.images || []),
  ];

  if (files.length === 0) return res.status(400).json({ error: "No images uploaded" });

  try {
    const tour = await Tour.findOne({
      _id: req.params.tourId,
      createdBy: req.user._id,
    });
    if (!tour) return res.status(404).json({ error: "Tour not found" });

    const savedImages = [];
    for (const file of files) {
      const rawLabel = file.originalname.replace(/\.[^/.]+$/, "")
        .replace(/<[^>]*>/g, "").trim().slice(0, 80);

      tour.images.push({
        url: `/uploads/${file.filename}`,
        filename: file.filename,
        label: rawLabel || "",
        order: tour.images.length,
      });

      savedImages.push(tour.images[tour.images.length - 1]);
    }

    await tour.save();

    // Return single image object for backwards compat, or array for bulk
    if (savedImages.length === 1) {
      res.status(201).json({ image: savedImages[0], images: savedImages });
    } else {
      res.status(201).json({ images: savedImages });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ error: "Image too large. Maximum size is 10MB per file." });
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(413).json({ error: "Too many files. Maximum 20 at once." });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err.message) return res.status(400).json({ error: err.message });
  next(err);
});

module.exports = router;
