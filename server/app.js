const express = require("express");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");

// Load env variables from root .env
dotenv.config({ path: path.join(__dirname, "../.env") });

const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");

// Route imports
const customerRoutes = require("./routes/customerRoutes");
const predictionRoutes = require("./routes/predictionRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const whatifRoutes = require("./routes/whatifRoutes");
const adminRoutes = require("./routes/adminRoutes");
const authRoutes = require("./routes/authRoutes");
const { protect } = require("./middleware/auth");

const app = express();
const PORT = process.env.PORT || process.env.EXPRESS_PORT || 5001;

// ── Middleware ──
app.use(cors());
app.use(express.json({ limit: "5mb" }));

// Request logger (dev)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ── API Routes ──
app.use("/api/auth", authRoutes);                          // public
app.use("/api/customers", protect, customerRoutes);        // protected
app.use("/api/predictions", protect, predictionRoutes);    // protected
app.use("/api/dashboard", protect, dashboardRoutes);       // protected
app.use("/api/whatif", protect, whatifRoutes);             // protected
app.use("/api/admin", protect, adminRoutes);               // protected

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "express-backend", timestamp: new Date().toISOString() });
});

// ── Serve React build in production ──
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../client/dist")));
  app.use((req, res) => {
    res.sendFile(path.join(__dirname, "../client/dist/index.html"));
  });
}

// ── Error Handler (must be last) ──
app.use(errorHandler);

// ── Start ──
const start = async () => {
  // Connect to DB first to ensure models are ready, but don't block forever if it's down
  // (Standard practice for local dev; in production you might want to block)
  try {
    await connectDB();
  } catch (err) {
    console.error("[Express] Critical: Database connection failed. System may be unstable.", err);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Express] Server running on http://0.0.0.0:${PORT}`);
    console.log(`[Express] API endpoints available at /api/*`);
  });
};

start();

module.exports = app;
