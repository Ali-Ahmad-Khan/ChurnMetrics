import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Wraps any route that requires authentication.
 * Redirects to /login if user is not logged in.
 * Optionally require admin role with requireAdmin prop.
 */
export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, isAdmin } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="alert alert-danger m-4">
        <i className="bi bi-shield-lock me-2"></i>
        Access denied — admin role required.
      </div>
    );
  }

  return children;
}
