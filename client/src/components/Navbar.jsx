import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/", label: "Dashboard", icon: "bi-speedometer2" },
  { to: "/customers", label: "Customers", icon: "bi-people" },
  { to: "/predict", label: "Predict", icon: "bi-cpu" },
  { to: "/predictions", label: "History", icon: "bi-clock-history" },
  { to: "/whatif", label: "What-If", icon: "bi-shuffle" },
  { to: "/analytics", label: "Analytics", icon: "bi-graph-up" },
  { to: "/drift", label: "Drift", icon: "bi-shield-exclamation" },
  { to: "/about", label: "About", icon: "bi-info-circle" },
];

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark border-bottom border-secondary fixed-top">
      <div className="container-fluid">
        <NavLink className="navbar-brand d-flex align-items-center gap-2 fw-bold" to="/">
          <i className="bi bi-activity text-info fs-4"></i>
          <span className="text-info">Churn</span>
          <span className="text-white">Metrics</span>
        </NavLink>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            {navItems.map((item) => (
              <li className="nav-item" key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `nav-link px-3 ${isActive ? "active text-info" : ""}`
                  }
                  end={item.to === "/"}
                >
                  <i className={`bi ${item.icon} me-1`}></i>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* User info + logout */}
          {user && (
            <div className="d-flex align-items-center gap-2 ms-3">
              <span className="text-secondary small d-none d-lg-inline">
                <i className="bi bi-person-circle me-1"></i>
                {user.name}
                {isAdmin && (
                  <span className="badge bg-info ms-1" style={{ fontSize: "0.6rem" }}>Admin</span>
                )}
              </span>
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={handleLogout}
                title="Sign out"
              >
                <i className="bi bi-box-arrow-right me-1"></i>
                <span className="d-none d-lg-inline">Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
