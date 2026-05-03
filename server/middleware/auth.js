const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Protect middleware — verifies JWT from Authorization header.
 * Attaches decoded user to req.user.
 */
const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Not authorized — no token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Attach lean user object (no password) to request
    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user) {
      return res.status(401).json({ error: "User not found" });
    }
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token invalid or expired" });
  }
};

/**
 * Admin-only gate — must be used after protect.
 */
const adminOnly = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Forbidden — admin role required" });
  }
  next();
};

module.exports = { protect, adminOnly };
