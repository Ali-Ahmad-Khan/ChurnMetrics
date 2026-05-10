// Global error handler middleware
const errorHandler = (err, req, res, next) => {
  console.error(`[Error Handler] ${req.method} ${req.url}`);
  console.error(err);

  // Mongoose Validation Error
  if (err.name === "ValidationError") {
    return res.status(400).json({
      error: "Validation Error",
      details: Object.values(err.errors).map(e => e.message),
    });
  }

  // Axios errors from FastAPI (AI Engine)
  if (err.response) {
    const status = err.response.status || 502;
    return res.status(status).json({
      error: "AI Engine Error",
      status,
      detail: err.response.data?.detail || err.message,
    });
  }

  // Connection errors to FastAPI
  if (err.code === "ECONNREFUSED") {
    return res.status(503).json({
      error: "AI Engine Unavailable",
      detail: "The FastAPI service is not responding. Ensure it is running on port 8000.",
    });
  }

  // JWT Errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ error: "Invalid session token" });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({ error: "Session token expired" });
  }

  // Default Internal Error
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    error: err.message || "Internal server error",
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};

module.exports = errorHandler;
