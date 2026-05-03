import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const [mode, setMode] = useState("login"); // "login" | "register"
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === "login") {
        await login(form.email, form.password);
      } else {
        if (!form.name.trim()) return setError("Name is required");
        await register(form.name, form.email, form.password);
      }
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center"
      style={{ background: "linear-gradient(135deg, #0a0f1e 0%, #0d1b2a 50%, #0a0f1e 100%)" }}
    >
      <div className="w-100" style={{ maxWidth: 420 }}>
        {/* Logo / Title */}
        <div className="text-center mb-4">
          <div className="mb-3">
            <i className="bi bi-graph-up-arrow" style={{ fontSize: "3rem", color: "#0dcaf0" }}></i>
          </div>
          <h1 className="fw-bold text-white" style={{ fontSize: "1.8rem" }}>ChurnMetrics</h1>
          <p className="text-secondary">AI-Powered Churn Intelligence Platform</p>
        </div>

        {/* Card */}
        <div
          className="card border-0 p-4"
          style={{
            background: "rgba(255,255,255,0.04)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.08) !important",
            borderRadius: 16,
            boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
          }}
        >
          {/* Mode toggle */}
          <div className="d-flex mb-4 rounded-2 overflow-hidden border border-secondary">
            <button
              type="button"
              className={`btn flex-grow-1 rounded-0 ${mode === "login" ? "btn-info" : "btn-dark text-secondary"}`}
              onClick={() => { setMode("login"); setError(null); }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`btn flex-grow-1 rounded-0 ${mode === "register" ? "btn-info" : "btn-dark text-secondary"}`}
              onClick={() => { setMode("register"); setError(null); }}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {mode === "register" && (
              <div className="mb-3">
                <label className="form-label text-secondary small">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="form-control bg-dark text-white border-secondary"
                  placeholder="Jane Smith"
                  required
                />
              </div>
            )}

            <div className="mb-3">
              <label className="form-label text-secondary small">Email Address</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="form-control bg-dark text-white border-secondary"
                placeholder="you@company.com"
                required
              />
            </div>

            <div className="mb-4">
              <label className="form-label text-secondary small">Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className="form-control bg-dark text-white border-secondary"
                placeholder={mode === "register" ? "Min. 6 characters" : "••••••••"}
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className="alert alert-danger py-2 mb-3">
                <i className="bi bi-exclamation-triangle me-2"></i>{error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-info w-100 fw-bold"
              style={{ height: 46 }}
              disabled={loading}
            >
              {loading ? (
                <span className="spinner-border spinner-border-sm me-2"></span>
              ) : (
                <i className={`bi bi-${mode === "login" ? "box-arrow-in-right" : "person-plus"} me-2`}></i>
              )}
              {loading
                ? (mode === "login" ? "Signing in..." : "Creating account...")
                : (mode === "login" ? "Sign In" : "Create Account")}
            </button>
          </form>

          {mode === "register" && (
            <p className="text-secondary small text-center mt-3 mb-0">
              <i className="bi bi-info-circle me-1"></i>
              The first account registered becomes the <strong className="text-info">admin</strong>.
            </p>
          )}
        </div>

        <p className="text-center text-secondary small mt-3">
          ChurnMetrics v1.0 · MERN + FastAPI
        </p>
      </div>
    </div>
  );
}
