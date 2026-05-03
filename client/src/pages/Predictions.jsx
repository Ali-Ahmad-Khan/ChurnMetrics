import { useState } from "react";
import { useFetch } from "../hooks/useFetch";
import { getPredictions, getPredictionStats, submitFeedback } from "../services/api";
import { Link } from "react-router-dom";

function StatPill({ label, value, color }) {
  return (
    <div className="col">
      <div className="card bg-dark border-secondary text-center py-2 px-3 h-100">
        <div className={`fs-4 fw-bold text-${color}`}>{value}</div>
        <div className="text-secondary small">{label}</div>
      </div>
    </div>
  );
}

function RiskBadge({ label }) {
  const map = { High: "danger", Medium: "warning", Low: "success" };
  return <span className={`badge bg-${map[label] || "secondary"}`}>{label}</span>;
}

export default function Predictions() {
  const [page, setPage] = useState(1);
  const [riskFilter, setRiskFilter] = useState("");
  const [feedbackLoading, setFeedbackLoading] = useState(null);

  const { data, loading, error, refetch } = useFetch(
    () => getPredictions(page, 20, riskFilter ? { risk: riskFilter } : {}),
    [page, riskFilter]
  );

  const { data: stats } = useFetch(getPredictionStats, []);

  const handleFeedback = async (id, actualChurn) => {
    setFeedbackLoading(id);
    try {
      await submitFeedback(id, { actualChurn });
      refetch();
    } catch (err) {
      console.error("Feedback failed:", err);
    } finally {
      setFeedbackLoading(null);
    }
  };

  const riskMap = {};
  (stats?.riskDistribution || []).forEach((r) => { riskMap[r._id] = r.count; });

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="text-white fw-bold mb-0">
            <i className="bi bi-clock-history me-2 text-info"></i>Prediction History
          </h2>
          <p className="text-secondary mb-0">View, filter, and provide feedback on past AI predictions</p>
        </div>
        <div className="btn-group">
          {["", "High", "Medium", "Low"].map((r) => (
            <button
              key={r}
              className={`btn btn-sm btn-${riskFilter === r ? "info" : "outline-secondary"}`}
              onClick={() => { setRiskFilter(r); setPage(1); }}
            >
              {r || "All"}
            </button>
          ))}
        </div>
      </div>

      {/* Stats summary bar */}
      {stats && (
        <div className="row row-cols-2 row-cols-md-6 g-3 mb-4">
          <StatPill label="Total Predictions" value={stats.totalPredictions?.toLocaleString()} color="info" />
          <StatPill label="Predicted Churners" value={stats.predictedChurners?.toLocaleString()} color="danger" />
          <StatPill label="High Risk" value={riskMap["High"] || 0} color="danger" />
          <StatPill label="Medium Risk" value={riskMap["Medium"] || 0} color="warning" />
          <StatPill label="Low Risk" value={riskMap["Low"] || 0} color="success" />
          <StatPill
            label="Feedback Accuracy"
            value={
              stats.feedbackLoop?.accuracy != null
                ? `${(stats.feedbackLoop.accuracy * 100).toFixed(1)}%`
                : "—"
            }
            color="info"
          />
        </div>
      )}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-info" style={{ width: "3rem", height: "3rem" }}></div>
        </div>
      ) : error ? (
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-triangle me-2"></i>{error}
        </div>
      ) : (
        <>
          <div className="card bg-dark border-secondary">
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-dark table-hover align-middle mb-0">
                  <thead>
                    <tr className="text-secondary border-bottom border-secondary">
                      <th>Customer ID</th>
                      <th>Probability</th>
                      <th>Risk</th>
                      <th>Stage</th>
                      <th>Review</th>
                      <th>Feedback</th>
                      <th>Date</th>
                      <th className="text-end">Detail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.predictions.map((p) => (
                      <tr key={p._id}>
                        <td className="text-info fw-bold font-monospace small">{p.customerID}</td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div className="progress flex-grow-1" style={{ height: 6, minWidth: 60 }}>
                              <div
                                className={`progress-bar bg-${
                                  p.riskLabel === "High" ? "danger" :
                                  p.riskLabel === "Medium" ? "warning" : "success"
                                }`}
                                style={{ width: `${p.churnProbability * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-white fw-bold small" style={{ minWidth: 40 }}>
                              {(p.churnProbability * 100).toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td><RiskBadge label={p.riskLabel} /></td>
                        <td><span className="badge bg-secondary">{p.stageUsed}</span></td>
                        <td>
                          {p.needsReview && (
                            <span className="badge bg-warning text-dark me-1" title="Needs human review">
                              <i className="bi bi-flag-fill"></i>
                            </span>
                          )}
                          {p.reviewStatus !== "none" && (
                            <span className="badge bg-info">{p.reviewStatus}</span>
                          )}
                          {!p.needsReview && p.reviewStatus === "none" && (
                            <span className="text-secondary small">—</span>
                          )}
                        </td>
                        <td>
                          {p.actualChurn !== null && p.actualChurn !== undefined ? (
                            <span className={`badge bg-${p.predictionCorrect ? "success" : "danger"}`}>
                              <i className={`bi bi-${p.predictionCorrect ? "check-circle" : "x-circle"} me-1`}></i>
                              {p.predictionCorrect ? "Correct" : "Wrong"}
                            </span>
                          ) : feedbackLoading === p._id ? (
                            <span className="spinner-border spinner-border-sm text-info"></span>
                          ) : (
                            <div className="btn-group btn-group-sm">
                              <button
                                className="btn btn-outline-danger btn-sm"
                                onClick={() => handleFeedback(p._id, 1)}
                                title="Churned"
                              >
                                <i className="bi bi-x-circle"></i>
                              </button>
                              <button
                                className="btn btn-outline-success btn-sm"
                                onClick={() => handleFeedback(p._id, 0)}
                                title="Stayed"
                              >
                                <i className="bi bi-check-circle"></i>
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="text-secondary small">
                          {new Date(p.createdAt).toLocaleDateString("en-US", {
                            month: "short", day: "numeric", year: "numeric",
                          })}
                        </td>
                        <td className="text-end">
                          <Link to={`/predictions/${p._id}`} className="btn btn-sm btn-outline-info">
                            <i className="bi bi-eye"></i>
                          </Link>
                        </td>
                      </tr>
                    ))}
                    {data.predictions.length === 0 && (
                      <tr>
                        <td colSpan="8" className="text-center text-secondary py-5">
                          <i className="bi bi-inbox fs-3 d-block mb-2"></i>
                          No predictions found.{" "}
                          <Link to="/predict" className="text-info">Run a prediction</Link> to get started.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Pagination */}
          {data.pagination && data.pagination.totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center mt-3">
              <span className="text-secondary small">
                Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, data.pagination.total)} of {data.pagination.total}
              </span>
              <div className="btn-group">
                <button
                  className="btn btn-sm btn-outline-secondary"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <i className="bi bi-chevron-left"></i> Prev
                </button>
                <button className="btn btn-sm btn-outline-secondary disabled">
                  {page} / {data.pagination.totalPages}
                </button>
                <button
                  className="btn btn-sm btn-outline-secondary"
                  disabled={page >= data.pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next <i className="bi bi-chevron-right"></i>
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
