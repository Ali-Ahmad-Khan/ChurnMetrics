const axios = require("axios");
require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });

const FASTAPI_URL = process.env.FASTAPI_URL || "http://127.0.0.1:8000";

// Axios instance for FastAPI communication
const fastapi = axios.create({
  baseURL: FASTAPI_URL,
  timeout: 30000, // 30s for SHAP computations
  headers: { "Content-Type": "application/json" },
});

// Predict single customer
const predict = async (customerData) => {
  const { data } = await fastapi.post("/predict", customerData);
  return data;
};

// Predict batch
const predictBatch = async (customers) => {
  const { data } = await fastapi.post("/predict/batch", { customers });
  return data;
};

// Predict with SHAP explanation
const predictExplain = async (customerData) => {
  const { data } = await fastapi.post("/predict/explain", customerData);
  return data;
};

// What-if simulation
const predictWhatIf = async (original, modified) => {
  const { data } = await fastapi.post("/predict/whatif", { original, modified });
  return data;
};

// Global simulation
const simulateGlobal = async (shifts) => {
  const { data } = await fastapi.post("/predict/simulate-global", { shifts });
  return data;
};

// Drift detection
const checkDrift = async (customers) => {
  const { data } = await fastapi.post("/drift", { customers });
  return data;
};

// Health check
const healthCheck = async () => {
  const { data } = await fastapi.get("/health");
  return data;
};

// Model info
const modelInfo = async () => {
  const { data } = await fastapi.get("/model-info");
  return data;
};

module.exports = {
  predict,
  predictBatch,
  predictExplain,
  predictWhatIf,
  simulateGlobal,
  checkDrift,
  healthCheck,
  modelInfo,
};
