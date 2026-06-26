const express = require("express");
const router = express.Router();
const { register, login, me } = require("../controllers/auth");
const auth = require("../middleware/auth");
const { authLimiter } = require("../middleware/rateLimiter");

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.get("/me", auth, me);

module.exports = router;
