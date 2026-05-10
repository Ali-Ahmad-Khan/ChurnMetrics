import { Component } from "react";
import { Link } from "react-router-dom";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary] Caught:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container py-5 text-center">
          <div className="card-custom py-5" style={{ maxWidth: 500, margin: "0 auto" }}>
            <i className="bi bi-exclamation-triangle text-danger fs-1 mb-3 d-block"></i>
            <h2 className="panel-title mb-2">Something went wrong</h2>
            <p className="text-secondary small mb-4">
              {this.state.error?.message || "An unexpected error occurred rendering this page."}
            </p>
            <div className="d-flex gap-3 justify-content-center">
              <button
                className="btn-ghost-custom"
                onClick={() => this.setState({ hasError: false, error: null })}
              >
                Try Again
              </button>
              <Link to="/dashboard" className="btn-primary-custom text-decoration-none">
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
