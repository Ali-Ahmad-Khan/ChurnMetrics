import { useFetch } from "../hooks/useFetch";
import { getDashboardSummary } from "../services/api";

function StatCard({ title, value, subtitle, icon, color }) {
  return (
    <div className="col-md-3">
      <div className="card bg-dark border-secondary h-100">
        <div className="card-body d-flex align-items-center gap-3">
          <div className={`rounded-3 p-3 bg-${color} bg-opacity-25`}>
            <i className={`bi ${icon} fs-3 text-${color}`}></i>
          </div>
          <div>
            <h6 className="text-secondary mb-0 small">{title}</h6>
            <h3 className="text-white mb-0 fw-bold">{value}</h3>
            {subtitle && <small className="text-secondary">{subtitle}</small>}
          </div>
        </div>
      </div>
    </div>
  );
}

function RiskBadge({ label }) {
  const colors = { High: "danger", Medium: "warning", Low: "success" };
  return <span className={`badge bg-${colors[label] || "secondary"}`}>{label}</span>;
}

export default function Dashboard() {
  const { data, loading, error } = useFetch(getDashboardSummary);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
        <div className="spinner-border text-info" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger m-4">
        <i className="bi bi-exclamation-triangle me-2"></i>
        Failed to load dashboard: {error}
      </div>
    );
  }

  const { customers, predictions, recentPredictions, aiEngine } = data;
  const riskMap = {};
  (predictions.riskDistribution || []).forEach((r) => {
    riskMap[r._id] = r.count;
  });

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="text-white fw-bold mb-0">Dashboard</h2>
          <p className="text-secondary mb-0">Overview of ChurnMetrics system</p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <span
            className={`badge bg-${aiEngine?.status === "ok" ? "success" : "danger"} d-flex align-items-center gap-1`}
          >
            <i className={`bi bi-${aiEngine?.status === "ok" ? "check-circle" : "x-circle"}`}></i>
            AI Engine: {aiEngine?.status || "unknown"}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        <StatCard
          title="Total Customers"
          value={customers.total.toLocaleString()}
          subtitle={`${(customers.churnRate * 100).toFixed(1)}% churn rate`}
          icon="bi-people-fill"
          color="info"
        />
        <StatCard
          title="Total Predictions"
          value={predictions.total.toLocaleString()}
          icon="bi-cpu-fill"
          color="primary"
        />
        <StatCard
          title="Predicted Churners"
          value={predictions.predictedChurners.toLocaleString()}
          icon="bi-person-dash-fill"
          color="danger"
        />
        <StatCard
          title="High Risk"
          value={riskMap["High"] || 0}
          subtitle={`Medium: ${riskMap["Medium"] || 0} | Low: ${riskMap["Low"] || 0}`}
          icon="bi-shield-exclamation"
          color="warning"
        />
      </div>

      {/* Risk Distribution */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card bg-dark border-secondary h-100">
            <div className="card-header border-secondary">
              <h6 className="text-white mb-0">
                <i className="bi bi-pie-chart me-2 text-info"></i>Risk Distribution
              </h6>
            </div>
            <div className="card-body">
              {["High", "Medium", "Low"].map((risk) => {
                const count = riskMap[risk] || 0;
                const pct = predictions.total > 0 ? ((count / predictions.total) * 100).toFixed(1) : 0;
                const colors = { High: "danger", Medium: "warning", Low: "success" };
                return (
                  <div key={risk} className="mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <span className="text-white">{risk} Risk</span>
                      <span className="text-secondary">{count} ({pct}%)</span>
                    </div>
                    <div className="progress" style={{ height: "8px" }}>
                      <div
                        className={`progress-bar bg-${colors[risk]}`}
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="col-md-8">
          <div className="card bg-dark border-secondary h-100">
            <div className="card-header border-secondary">
              <h6 className="text-white mb-0">
                <i className="bi bi-clock-history me-2 text-info"></i>Recent Predictions
              </h6>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-dark table-hover mb-0">
                  <thead>
                    <tr className="text-secondary">
                      <th>Customer ID</th>
                      <th>Probability</th>
                      <th>Risk</th>
                      <th>Stage</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(recentPredictions || []).map((pred, i) => (
                      <tr key={pred._id || i}>
                        <td className="text-white">{pred.customerID}</td>
                        <td>
                          <span className="text-info fw-bold">
                            {(pred.churnProbability * 100).toFixed(1)}%
                          </span>
                        </td>
                        <td>
                          <RiskBadge label={pred.riskLabel} />
                        </td>
                        <td>
                          <span className="badge bg-secondary">{pred.stageUsed}</span>
                        </td>
                        <td className="text-secondary">
                          {new Date(pred.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                    {(!recentPredictions || recentPredictions.length === 0) && (
                      <tr>
                        <td colSpan="5" className="text-center text-secondary py-4">
                          No predictions yet. Go to the Predict page to get started.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
