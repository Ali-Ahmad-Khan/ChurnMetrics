import { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "./ThemeToggle";
import "./Navbar.css";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: "bi-speedometer2" },
  { to: "/customers", label: "Customers", icon: "bi-people" },
  { to: "/predict", label: "Predict", icon: "bi-cpu" },
  { to: "/predictions", label: "History", icon: "bi-clock-history" },
  { to: "/whatif", label: "What-If", icon: "bi-shuffle" },
  { to: "/analytics", label: "Analytics", icon: "bi-graph-up" },
  { to: "/drift", label: "Drift", icon: "bi-shield-exclamation" },
  { to: "/about", label: "About", icon: "bi-info-circle" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isLanding = location.pathname === "/";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  return (
    <nav className={`navbar-custom ${isOpen ? "menu-open" : ""}`}>
      <div className="navbar-container">
        <NavLink className="navbar-brand-custom" to="/" onClick={closeMenu}>
          <i className="bi bi-activity brand-icon"></i>
          <span>Churn<span style={{ color: 'var(--text-secondary)' }}>Metrics</span></span>
        </NavLink>

        {/* Hamburger Toggle */}
        <button className="menu-toggle d-lg-none" onClick={toggleMenu} aria-label="Toggle navigation">
          <i className={`bi ${isOpen ? "bi-x-lg" : "bi-list"}`}></i>
        </button>

        <div className={`navbar-menu ${isOpen ? "active" : ""}`}>
          <div className="navbar-links">
            {!isLanding && navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={closeMenu}
                className={({ isActive }) =>
                  `nav-link-custom ${isActive ? "active" : ""}`
                }
              >
                <i className={`bi ${item.icon}`}></i>
                <span className="ms-1">{item.label}</span>
              </NavLink>
            ))}
            {isLanding && (
              <>
                <a href="#features" className="nav-link-custom" onClick={closeMenu}>Features</a>
                <a href="#how-it-works" className="nav-link-custom" onClick={closeMenu}>How It Works</a>
                <a href="#faq" className="nav-link-custom" onClick={closeMenu}>FAQ</a>
              </>
            )}
          </div>

          <div className="navbar-actions">
            <ThemeToggle />
            
            {user ? (
              <div className="user-info">
                <span className="user-name">
                  <i className="bi bi-person-circle me-1"></i>
                  {user.name}
                </span>
                <div className="vr d-none d-lg-block mx-2" style={{ height: '1.25rem', opacity: 0.2 }}></div>
                <button className="btn-signout" onClick={() => { handleLogout(); closeMenu(); }}>
                  <i className="bi bi-box-arrow-right me-1 d-lg-none"></i>
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="auth-buttons">
                <NavLink to="/login" className="btn-ghost-custom" onClick={closeMenu}>
                  Login
                </NavLink>
                <NavLink to="/login" className="btn-primary-custom" onClick={closeMenu}>
                  Get Started
                </NavLink>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
