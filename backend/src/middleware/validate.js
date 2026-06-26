/**
 * Lightweight manual validation — avoids adding express-validator as a dep
 * for a project this size. Same defensive principle: reject bad input early,
 * return a clear error message, never let garbage reach the database.
 */

const isValidMongoId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

const sanitizeString = (val, maxLen = 200) =>
  typeof val === "string"
    ? val.replace(/<[^>]*>/g, "").trim().slice(0, maxLen)
    : "";

/**
 * Validate tour creation/update body.
 */
const validateTour = (req, res, next) => {
  const { title, niche } = req.body;

  if (!title || typeof title !== "string" || !title.trim()) {
    return res.status(400).json({ error: "Title is required" });
  }

  const allowedNiches = ["real-estate", "architecture", "interior-design", "art-gallery", "other"];
  if (niche && !allowedNiches.includes(niche)) {
    return res.status(400).json({ error: `niche must be one of: ${allowedNiches.join(", ")}` });
  }

  // Sanitize in place before it reaches the controller
  req.body.title = sanitizeString(title, 120);
  req.body.description = sanitizeString(req.body.description || "", 500);

  next();
};

/**
 * Validate hotspot creation body.
 */
const validateHotspot = (req, res, next) => {
  const { tourId, imageId, x, y, label, userContext } = req.body;

  if (!tourId || !isValidMongoId(tourId)) {
    return res.status(400).json({ error: "Valid tourId is required" });
  }
  if (!imageId) {
    return res.status(400).json({ error: "imageId is required" });
  }

  const xNum = parseFloat(x);
  const yNum = parseFloat(y);

  if (isNaN(xNum) || isNaN(yNum)) {
    return res.status(400).json({ error: "x and y must be numbers" });
  }
  if (xNum < 0 || xNum > 100 || yNum < 0 || yNum > 100) {
    return res.status(400).json({ error: "x and y must be between 0 and 100" });
  }

  // Sanitize strings
  req.body.label = sanitizeString(label || "Hotspot", 80);
  req.body.userContext = sanitizeString(userContext || "", 300);
  req.body.x = xNum;
  req.body.y = yNum;

  next();
};

/**
 * Validate :id param is a valid MongoDB ObjectId.
 * Prevents Mongoose CastError from reaching error handler.
 */
const validateMongoId = (req, res, next) => {
  if (!isValidMongoId(req.params.id)) {
    return res.status(400).json({ error: "Invalid ID format" });
  }
  next();
};

module.exports = { validateTour, validateHotspot, validateMongoId };
