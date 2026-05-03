import { useState } from "react";
import { checkDrift, getSystemLogs, triggerRetrain } from "../services/api";
import { useFetch } from "../hooks/useFetch";
import { useAuth } from "../context/AuthContext";

// The preprocessor outputs these feature names in this order
// (num features first, then OHE categorical features)
const FEATURE_NAMES = [
  "tenure", "MonthlyCharges", "TotalCharges",
  "gender_Male",
  "SeniorCitizen_1",
  "Partner_Yes", "Dependents_Yes",
  "PhoneService_Yes", "MultipleLines_Yes",
  "InternetService_DSL", "InternetService_Fiber optic", "InternetService_No",
  "OnlineSecurity_Yes", "OnlineBackup_Yes",
  "DeviceProtection_Yes", "TechSupport_Yes",
  "StreamingTV_Yes", "StreamingMovies_Yes",
  "Contract_One year", "Contract_Two year",
  "PaperlessBilling_Yes",
  "PaymentMethod_Credit card (automatic)",
  "PaymentMethod_Electronic check",
  "PaymentMethod_Mailed check",
];

function getFeatureName(idx) {
  return FEATURE_NAMES[idx] ?? `Feature[${idx}]`;
}

export default function Drift() {
  const { isAdmin } = useAuth();
  const [driftResult, setDriftResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retrainResult, setRetrainResult] = useState(null);
  const [retraining, setRetraining] = useState(false);
  const [retrainError, setRetrainError] = useState(null);

  const { data: logsData } = useFetch(() => getSystemLogs(1, 10, "drift_alert"), []);

  const handleCheck = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await checkDrift(100);
      setDriftResult(res.data);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRetrain = async () => {
    setRetraining(true);
    setRetrainError(null);
    setRetrainResult(null);
    try {
      const res = await triggerRetrain();
      setRetrainResult(res.data);
    } catch (e) {
      setRetrainError(e.response?.data?.message || e.response?.data?.error || e.message);
    } finally {
      setRetraining(false);
    }
  };

  return (
    <div>
      <h2 className="text-white fw-bold mb-1">
        <i className="bi bi-shield-exclamation me-2 text-info"></i>Drift Detection
      </h2>
      <p className="text-secondary mb-4">
        Monitor model health by comparing live customer data against training distribution
      </p>

      {/* Trigger card */}
      <div className="card bg-dark border-secondary mb-4">
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col-md-8">
              <h6 className="text-white mb-1">Run Drift Analysis</h6>
              <p className="text-secondary small mb-0">
                Samples 100 customers from MongoDB and computes Z-score statistics against
                the training data distribution. Alerts if features deviate significantly (|Z| &gt; 2).
              </p>
            </div>
            <div className="col-md-4 text-end">
              <button className="btn btn-info btn-lg" onClick={handleCheck} disabled={loading}>
                {loading ? (
                  <><span className="spinner-border spinner-border-sm me-2"></span>Analyzing...</>
                ) : (
                  <><i className="bi bi-shield-check me-2"></i>Run Drift Check</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Drift results */}
      {driftResult && (
        <div className={`card bg-dark border-${driftResult.drift_detected ? "danger" : "success"} mb-4`}>
          <div className={`card-header border-${driftResult.drift_detected ? "danger" : "success"}`}>
            <h6 className="text-white mb-0">
              <i className={`bi bi-${driftResult.drift_detected ? "exclamation-triangle text-danger" : "check-circle text-success"} me-2`}></i>
              Analysis Results
            </h6>
          </div>
          <div className="card-body">
            {/* Summary stats */}
            <div className="row text-center g-3 mb-4">
              <div className="col-md-4">
                <div className="card bg-dark border-secondary p-3">
                  <div className="text-secondary small">Drift Status</div>
                  <span className={`badge bg-${driftResult.drift_detected ? "danger" : "success"} fs-5 mt-2`}>
                    {driftResult.drift_detected ? "DRIFT DETECTED" : "NO DRIFT"}
                  </span>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card bg-dark border-secondary p-3">
                  <div className="text-secondary small">Severity</div>
                  <span className={`badge bg-${driftResult.severity === "high" ? "danger" : driftResult.severity === "medium" ? "warning" : "success"} fs-5 mt-2`}>
                    {(driftResult.severity || "none").toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card bg-dark border-secondary p-3">
                  <div className="text-secondary small">Drifted Features</div>
                  <div className={`display-6 fw-bold mt-1 ${driftResult.num_drifted_features > 0 ? "text-danger" : "text-success"}`}>
                    {driftResult.num_drifted_features}
                  </div>
                </div>
              </div>
            </div>

            {/* Drifted feature detail table */}
            {driftResult.drifted_features?.length > 0 && (
              <>
                <h6 className="text-secondary mb-3">
                  <i className="bi bi-table me-2"></i>Drifted Feature Details
                </h6>
                <div className="table-responsive">
                  <table className="table table-dark table-hover mb-0">
                    <thead>
                      <tr className="text-secondary">
                        <th>#</th>
                        <th>Feature Name</th>
                        <th>Train Mean</th>
                        <th>Sample Mean</th>
                        <th>Z-Score</th>
                        <th>Drift</th>
                      </tr>
                    </thead>
                    <tbody>
                      {driftResult.drifted_features.map((f, i) => {
                        const name = getFeatureName(f.feature_idx);
                        const absZ = Math.abs(f.z_score);
                        return (
                          <tr key={i}>
                            <td className="text-secondary small">{f.feature_idx}</td>
                            <td className="text-white fw-bold">{name}</td>
                            <td className="text-secondary">{f.train_mean.toFixed(4)}</td>
                            <td className="text-white">{f.new_mean.toFixed(4)}</td>
                            <td>
                              <span className={`fw-bold ${absZ > 3 ? "text-danger" : absZ > 2 ? "text-warning" : "text-white"}`}>
                                {f.z_score.toFixed(2)}
                              </span>
                            </td>
                            <td>
                              <div className="progress" style={{ height: 8, minWidth: 80 }}>
                                <div
                                  className={`progress-bar ${absZ > 3 ? "bg-danger" : "bg-warning"}`}
                                  style={{ width: `${Math.min(absZ / 5, 1) * 100}%` }}
                                ></div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {driftResult.drift_detected && (
              <div className="alert alert-danger mt-3 mb-0">
                <i className="bi bi-exclamation-triangle me-2"></i>
                <strong>Action Required:</strong> Significant data drift detected. Consider retraining the model
                with recent customer data using <code className="text-warning">python src/train.py</code>.
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="alert alert-danger mb-4">
          <i className="bi bi-exclamation-triangle me-2"></i>{error}
        </div>
      )}

      {/* Retrain trigger — admin only */}
      {isAdmin && (
        <div className="card bg-dark border-warning mb-4">
          <div className="card-header border-warning d-flex justify-content-between align-items-center">
            <h6 className="text-warning mb-0">
              <i className="bi bi-arrow-repeat me-2"></i>Model Retraining
              <span className="badge bg-warning text-dark ms-2 small">Admin Only</span>
            </h6>
          </div>
          <div className="card-body">
            <div className="row align-items-center">
              <div className="col-md-8">
                <p className="text-secondary small mb-0">
                  Trigger a full model retrain using <code className="text-warning">src/train.py</code>.
                  This will rebuild the Logistic Regression + XGBoost pipeline with the current data.
                  Training may take 30–90 seconds.
                </p>
              </div>
              <div className="col-md-4 text-end">
                <button
                  className="btn btn-warning"
                  onClick={handleRetrain}
                  disabled={retraining}
                >
                  {retraining ? (
                    <><span className="spinner-border spinner-border-sm me-2"></span>Retraining...</>
                  ) : (
                    <><i className="bi bi-arrow-repeat me-2"></i>Trigger Retrain</>
                  )}
                </button>
              </div>
            </div>

            {/* Retrain result */}
            {retrainResult && (
              <div className={`alert alert-${retrainResult.success ? "success" : "danger"} mt-3 mb-0`}>
                <div className="d-flex justify-content-between">
                  <span>
                    <i className={`bi bi-${retrainResult.success ? "check-circle" : "x-circle"} me-2`}></i>
                    {retrainResult.message}
                  </span>
                  {retrainResult.duration && (
                    <span className="text-secondary small">{retrainResult.duration}s</span>
                  )}
                </div>
                {retrainResult.logs && retrainResult.logs.length > 0 && (
                  <div className="mt-2 p-2 rounded" style={{ background: "rgba(0,0,0,0.3)", maxHeight: 200, overflow: "auto" }}>
                    <pre className="text-secondary small mb-0" style={{ fontSize: "0.72rem" }}>
                      {retrainResult.logs.join("\n")}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {retrainError && (
              <div className="alert alert-danger mt-3 mb-0">
                <i className="bi bi-x-circle me-2"></i>{retrainError}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Drift alert history */}
      <div className="card bg-dark border-secondary">
        <div className="card-header border-secondary">
          <h6 className="text-white mb-0">
            <i className="bi bi-bell-history me-2 text-secondary"></i>Drift Alert History
          </h6>
        </div>
        <div className="card-body p-0">
          <table className="table table-dark table-hover mb-0">
            <thead>
              <tr className="text-secondary">
                <th>Date</th>
                <th>Severity</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              {(logsData?.logs || []).map((log) => (
                <tr key={log._id}>
                  <td className="text-secondary small">
                    {new Date(log.createdAt).toLocaleString("en-US", {
                      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                    })}
                  </td>
                  <td>
                    <span className={`badge bg-${log.severity === "high" ? "danger" : log.severity === "medium" ? "warning" : "info"}`}>
                      {log.severity}
                    </span>
                  </td>
                  <td className="text-white">{log.message}</td>
                </tr>
              ))}
              {(!logsData?.logs || logsData.logs.length === 0) && (
                <tr>
                  <td colSpan="3" className="text-center text-secondary py-4">
                    <i className="bi bi-shield-check d-block fs-3 mb-2 text-success"></i>
                    No drift alerts recorded
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
