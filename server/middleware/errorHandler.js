// Global error handler middleware
const errorHandler = (err, req, res, next) => {
  console.error(`[Error] ${err.message}`);

  // Axios errors from FastAPI
  if (err.response) {
    return res.status(err.response.status || 502).json({
      error: "AI Engine error",
      detail: err.response.data?.detail || err.message,
    });
  }

  // Connection errors to FastAPI
  if (err.code === "ECONNREFUSED") {
    return res.status(503).json({
      error: "AI Engine unavailable",
      detail: "FastAPI service is not running. Start it with: uvicorn api.main:app",
    });
  }

  // Default
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  });
};

module.exports = errorHandler;
