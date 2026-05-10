import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "/api";

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

// ── Normalization Helpers ───────────────────────────────────────────────────
/**
 * Normalizes an object by converting snake_case keys to camelCase.
 * Handles nested objects and arrays.
 */
const normalize = (data) => {
  if (Array.isArray(data)) return data.map(normalize);
  if (data !== null && typeof data === "object") {
    return Object.keys(data).reduce((acc, key) => {
      // Preserve _id as it is a special MongoDB field that the frontend often relies on
      if (key === "_id") {
        acc[key] = normalize(data[key]);
        return acc;
      }
      
      const camelKey = key.replace(/([-_][a-z])/g, (group) =>
        group.toUpperCase().replace("-", "").replace("_", "")
      );
      acc[camelKey] = normalize(data[key]);
      return acc;
    }, {});
  }
  return data;
};

// ── Auth token injection interceptor ─────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("cm_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response Interceptors ───────────────────────────────────────────────────
api.interceptors.response.use(
  (res) => {
    // Automatically normalize all successful responses
    if (res.data) {
      res.data = normalize(res.data);
    }
    return res;
  },
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("cm_token");
      localStorage.removeItem("cm_user");
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

// ── Auth ─────────────────────────────────────────────────────────────────────
export const loginUser = (data) => api.post("/auth/login", data);
export const registerUser = (data) => api.post("/auth/register", data);
export const getMe = () => api.get("/auth/me");

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const getDashboardStats = () => api.get("/dashboard/summary");
export const getAnalytics = () => api.get("/dashboard/analytics");

// ── Customers ─────────────────────────────────────────────────────────────────
export const getCustomers = (page = 1, limit = 20, search = "") =>
  api.get(`/customers?page=${page}&limit=${limit}&search=${search}`);
export const getCustomerById = (id) => api.get(`/customers/${id}`);
export const getCustomerStats = () => api.get("/customers/stats/summary");

// ── Predictions ───────────────────────────────────────────────────────────────
export const runPrediction = (data) => api.post("/predictions/single", data);
export const predictBatch = (customers) =>
  api.post("/predictions/batch", { customers });
export const getPredictions = (page = 1, limit = 20, filters = {}) => {
  const params = new URLSearchParams({ page, limit, ...filters });
  return api.get(`/predictions?${params}`);
};
export const getPredictionById = (id) => api.get(`/predictions/${id}`);
export const getPredictionForCustomer = (customerID) => 
  api.get(`/predictions?customerID=${customerID}&limit=1`);
export const submitFeedback = (id, data) =>
  api.patch(`/predictions/${id}/feedback`, data);
export const getPredictionStats = () => api.get("/predictions/stats/summary");

// ── What-If ───────────────────────────────────────────────────────────────────
export const simulateWhatIf = (original, modified) =>
  api.post("/whatif", { original, modified });
export const runSimulation = (data) => api.post("/whatif/global", data);

// ── Admin ─────────────────────────────────────────────────────────────────────
export const checkDrift = (sampleSize = 100) =>
  api.post(`/admin/drift?sampleSize=${sampleSize}`);
export const getDriftStatus = (sampleSize = 100) => checkDrift(sampleSize);
export const getSystemLogs = (page = 1, limit = 20, type = "") =>
  api.get(`/admin/logs?page=${page}&limit=${limit}${type ? `&type=${type}` : ""}`);
export const getSystemInfo = () => api.get("/admin/system-info");
export const triggerRetrain = () => api.post("/admin/retrain");
export const deployCampaign = (data) => api.post("/admin/campaign/deploy", data);

// ── Health ────────────────────────────────────────────────────────────────────
export const healthCheck = () => api.get("/health");

export default api;
