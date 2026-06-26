const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { validateHotspot, validateMongoId } = require("../middleware/validate");
const { generateLimiter } = require("../middleware/rateLimiter");
const {
  createHotspot,
  generateContent,
  getHotspot,
  updateHotspot,
  deleteHotspot,
} = require("../controllers/hotspots");

router.use(auth);

router.post("/", validateHotspot, createHotspot);
router.get("/:id", validateMongoId, getHotspot);
router.put("/:id", validateMongoId, updateHotspot);
router.delete("/:id", validateMongoId, deleteHotspot);

// Rate-limited AI generation endpoint
router.post("/:id/generate", validateMongoId, generateLimiter, generateContent);

module.exports = router;
