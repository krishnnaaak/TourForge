require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./utils/db");
const { startWorker } = require("./queue/worker");

const authRoutes = require("./routes/auth");
const tourRoutes = require("./routes/tours");
const hotspotRoutes = require("./routes/hotspots");
const uploadRoutes = require("./routes/upload");

const app = express();
const PORT = process.env.PORT || 5000;

const publicTourRoutes = require("./routes/publicTours");
app.use("/api/tours/public", publicTourRoutes);

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images statically
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/tours", tourRoutes);
app.use("/api/hotspots", hotspotRoutes);
app.use("/api/upload", uploadRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    groqKeySet: !!process.env.GROQ_API_KEY,
  });
});

app.get("/api/test-ai", async (req, res) => {
  try {
    const { generateHotspotContent } = require("./services/gemini");
    const result = await generateHotspotContent({
      label: "Master Bedroom",
      userContext: "spacious room with attached bathroom",
      niche: "real-estate",
    });
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("[ERROR]", err.message);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  });
});

app.listen(PORT, () => {
  console.log(`TourForge backend running on port ${PORT}`);
  startWorker(); // Start background AI job processor
});
