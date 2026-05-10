import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Login.css";

export default function Login() {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

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
    <div className="login-container" style={{ position: 'relative' }}>
      <Link
        to="/"
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.6rem 1.25rem',
          background: 'var(--bg-surface)',
          color: 'var(--text-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '99px',
          textDecoration: 'none',
          fontSize: '0.85rem',
          fontWeight: 600,
          boxShadow: 'var(--shadow-card)',
          transition: 'all 0.2s ease',
          zIndex: 100,
        }}
        onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.borderColor = 'var(--accent)'; }}
        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
      >
        <i className="bi bi-arrow-left"></i>
        Back to Home
      </Link>
      <div className="login-box">
        {/* Logo / Title */}
        <div className="login-header">
          <div className="login-icon">
            <i className="bi bi-activity"></i>
          </div>
          <h1 className="login-title">ChurnMetrics</h1>
          <p className="login-subtitle">AI-Powered Churn Intelligence</p>
        </div>

        {/* Card */}
        <div className="login-card">
          {/* Mode toggle */}
          <div className="login-mode-toggle">
            <button
              type="button"
              className={`mode-btn ${mode === "login" ? "active" : ""}`}
              onClick={() => { setMode("login"); setError(null); }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`mode-btn ${mode === "register" ? "active" : ""}`}
              onClick={() => { setMode("register"); setError(null); }}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {mode === "register" && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="John Doe"
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="form-input"
                placeholder="you@company.com"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className="form-input"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className="login-error">
                <i className="bi bi-exclamation-triangle me-2"></i>{error}
              </div>
            )}

            <button
              type="submit"
              className="login-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <span className="spinner"></span>
              ) : (
                <i className={`bi bi-${mode === "login" ? "box-arrow-in-right" : "person-plus"} me-2`}></i>
              )}
              {loading
                ? (mode === "login" ? "Signing in..." : "Creating account...")
                : (mode === "login" ? "Sign In" : "Create Account")}
            </button>
          </form>

          {mode === "login" ? (
             <p className="login-footer-text">
               Don't have an account? <span className="link-text" onClick={() => setMode("register")}>Register here</span>
             </p>
          ) : (
            <p className="login-footer-text">
              Already have an account? <span className="link-text" onClick={() => setMode("login")}>Sign in instead</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
