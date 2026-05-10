import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Wraps any route that requires authentication.
 * Redirects to /login if user is not logged in.
 * Optionally require admin role with requireAdmin prop.
 */
export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100" style={{ background: 'var(--bg-base)' }}>
        <div className="spinner-border text-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="login-container">
        <div className="card-custom text-center" style={{ maxWidth: 400 }}>
          <i className="bi bi-shield-lock text-danger display-4 mb-3 d-block"></i>
          <h2 className="panel-title mb-2">Access Denied</h2>
          <p className="text-secondary small">Administrator privileges are required to view this section.</p>
          <button className="btn-primary-custom w-100 mt-4" onClick={() => window.history.back()}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return children;
}
