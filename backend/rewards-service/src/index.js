const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config();

// Import routes
const rewardRoutes = require("./routes/reward.routes");
const redemptionRoutes = require("./routes/redemption.routes");
const rewardCategoryRoutes = require("./routes/rewardCategory.routes");

// Environment variables
const NODE_ENV = process.env.NODE_ENV || "development";
const PORT =
  NODE_ENV === "production"
    ? process.env.PRODUCTION_REWARDS_PORT
    : process.env.REWARDS_PORT || 3005;
const HOST =
  NODE_ENV === "production"
    ? process.env.PRODUCTION_REWARDS_HOST
    : process.env.REWARDS_HOST || "0.0.0.0";
const NETWORK_IP = process.env.NETWORK_IP || "192.168.1.23";
const MONGO_URI =
  NODE_ENV === "production"
    ? process.env.PRODUCTION_MONGO_URI
    : process.env.MONGO_URI;

// Initialize express app
const app = express();

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));
app.use(express.json({ limit: "10mb" })); // Increased limit for image uploads
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(morgan("dev"));

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Rewards Service is running",
    environment: NODE_ENV,
  });
});

// Serve uploaded files in development mode
if (process.env.NODE_ENV !== "production") {
  app.use("/uploads", (req, res, next) => {
    // Set CORS headers for image files
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
  }, express.static(path.join(__dirname, "../uploads")));
}

// API route to serve uploaded files (works through API gateway)
app.use("/api/rewards/uploads", (req, res, next) => {
  // Set CORS headers for image files
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, "../uploads")));

// API Routes - include full path prefixes to match gateway routing
app.use("/api/rewards/redemptions", redemptionRoutes);
app.use("/api/rewards/categories", rewardCategoryRoutes);
app.use("/api/rewards", rewardRoutes);

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Rewards Service Error:", err);
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
    error: NODE_ENV === "development" ? err.message : undefined,
  });
});

// Start the server
const startServer = async () => {
  try {
    console.log(`Environment: ${NODE_ENV}`);
    console.log("Attempting to connect to MongoDB...");
    await connectDB();
    console.log("Starting server...");

    app.listen(PORT, HOST, () => {
      console.log(
        `Rewards Service running at http://${
          HOST === "0.0.0.0" ? "localhost" : HOST
        }:${PORT}`
      );
      console.log(`For network access: http://${NETWORK_IP}:${PORT}`);

      if (NODE_ENV === "production" && process.env.RENDER_EXTERNAL_URL) {
        console.log(`Production URL: ${process.env.RENDER_EXTERNAL_URL}`);
      }
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
