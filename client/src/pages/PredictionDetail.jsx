import { useParams, Link } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";
import { getPredictionById } from "../services/api";

import ReasonAndRescue from "../components/ReasonAndRescue";

export default function PredictionDetail() {
  const { id } = useParams();
  const { data: p, loading, error } = useFetch(() => getPredictionById(id), [id]);

  if (loading) return <div className="text-center py-5"><div className="spinner-border text-info"></div></div>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!p) return <div className="alert alert-warning">Prediction not found</div>;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-white fw-bold mb-0">Prediction Detail</h2>
        <Link to="/predictions" className="btn btn-outline-secondary">
          <i className="bi bi-arrow-left me-1"></i> Back
        </Link>
      </div>

      {/* Summary */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card bg-dark border-secondary text-center p-3">
            <h6 className="text-secondary">Probability</h6>
            <h2 className="text-info">{(p.churnProbability * 100).toFixed(1)}%</h2>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-dark border-secondary text-center p-3">
            <h6 className="text-secondary">Risk Level</h6>
            <h2>
              <span className={`badge bg-${p.riskLabel === "High" ? "danger" : p.riskLabel === "Medium" ? "warning" : "success"} fs-5`}>
                {p.riskLabel}
              </span>
            </h2>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-dark border-secondary text-center p-3">
            <h6 className="text-secondary">Stage Used</h6>
            <h2 className="text-white">{p.stageUsed}</h2>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-dark border-secondary text-center p-3">
            <h6 className="text-secondary">Prediction</h6>
            <h2 className={p.churnPrediction === 1 ? "text-danger" : "text-success"}>
              {p.churnPrediction === 1 ? "CHURN" : "STAY"}
            </h2>
          </div>
        </div>
      </div>

      {/* Reason & Rescue */}
      <ReasonAndRescue 
        topFeatures={p.topFeatures?.map(f => ({ ...f, shap_value: f.shapValue }))} 
        rescuePlan={p.rescuePlan}
        churnPrediction={p.churnPrediction}
      />

      {/* SHAP Features */}
      {p.topFeatures && p.topFeatures.length > 0 && (
        <div className="card bg-dark border-secondary mb-3">
          <div className="card-header border-secondary">
            <h6 className="text-white mb-0"><i className="bi bi-lightbulb me-2 text-warning"></i>SHAP Explanations</h6>
          </div>
          <div className="card-body">
            {p.topFeatures.map((f, i) => (
              <div key={i} className="d-flex justify-content-between mb-2">
                <span className="text-white">{f.feature}</span>
                <span className={`badge bg-${f.shapValue > 0 ? "danger" : "success"}`}>
                  {f.shapValue > 0 ? "+" : ""}{f.shapValue.toFixed(4)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {p.recommendations && p.recommendations.length > 0 && (
        <div className="card bg-dark border-secondary mb-3">
          <div className="card-header border-secondary">
            <h6 className="text-white mb-0"><i className="bi bi-clipboard-check me-2 text-success"></i>Recommendations</h6>
          </div>
          <div className="card-body">
            {p.recommendations.map((rec, i) => (
              <div key={i} className="border border-secondary rounded p-2 mb-2">
                <strong className="text-white">{rec.action}</strong>
                <span className={`badge bg-${rec.priority === "high" ? "danger" : "warning"} ms-2`}>{rec.priority}</span>
                <small className="text-secondary d-block mt-1">{rec.reason}</small>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feedback */}
      <div className="card bg-dark border-secondary">
        <div className="card-header border-secondary">
          <h6 className="text-white mb-0"><i className="bi bi-chat-square-dots me-2 text-info"></i>Feedback</h6>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-4">
              <small className="text-secondary">Review Status</small>
              <div className="text-white">{p.reviewStatus}</div>
            </div>
            <div className="col-md-4">
              <small className="text-secondary">Actual Outcome</small>
              <div className="text-white">
                {p.actualChurn !== null ? (p.actualChurn === 1 ? "Churned" : "Stayed") : "Not yet provided"}
              </div>
            </div>
            <div className="col-md-4">
              <small className="text-secondary">Prediction Accuracy</small>
              <div>
                {p.predictionCorrect !== null ? (
                  <span className={`badge bg-${p.predictionCorrect ? "success" : "danger"}`}>
                    {p.predictionCorrect ? "Correct" : "Incorrect"}
                  </span>
                ) : (
                  <span className="text-secondary">Awaiting feedback</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
