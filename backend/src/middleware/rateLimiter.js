const rateLimit = require("express-rate-limit");

/**
 * Applied to POST /api/hotspots/:id/generate
 * Prevents a single user from hammering the Gemini API
 * (which has its own rate limits and costs money in prod).
 *
 * 10 generate requests per user per minute is generous for normal use
 * but stops accidental loops or intentional abuse.
 */
const generateLimiter = rateLimit({
  windowMs: 60 * 1000,      // 1 minute window
  max: 10,                   // max 10 requests per IP per window
  standardHeaders: true,     // Return rate limit info in RateLimit-* headers
  legacyHeaders: false,
  message: {
    error: "Too many generation requests. Please wait a moment before trying again.",
  },
  skip: (req) => process.env.NODE_ENV === "test", // Don't rate-limit during tests
});

/**
 * Applied to all auth routes — prevents brute-force login attempts.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minute window
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many attempts. Please try again in 15 minutes.",
  },
});

module.exports = { generateLimiter, authLimiter };
