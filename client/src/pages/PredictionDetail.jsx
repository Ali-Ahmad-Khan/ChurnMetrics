import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getPredictionById } from "../services/api";
import { useReveal } from "../hooks/useReveal";
import ReasonAndRescue from "../components/ReasonAndRescue";

export default function PredictionDetail() {
  const { id } = useParams();
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const revealRef = useReveal();

  useEffect(() => {
    getPredictionById(id)
      .then((res) => {
        setPrediction(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Prediction fetch failed:", err);
        setError("Could not load prediction record.");
        setLoading(false);
      });
  }, [id]);

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center min-vh-100">
      <div className="spinner-border text-info"></div>
    </div>
  );

  if (error || !prediction) return (
    <div className="container py-5 text-center">
      <div className="card-custom py-5">
        <i className="bi bi-exclamation-octagon text-danger fs-1 mb-3 d-block"></i>
        <h2>{error || "Prediction Not Found"}</h2>
        <Link to="/predictions" className="btn-primary-custom mt-4 text-decoration-none d-inline-block">Back to History</Link>
      </div>
    </div>
  );

  return (
    <div className="reveal" ref={revealRef}>
      <div className="panel-header mb-4">
        <div className="d-flex align-items-center gap-3">
          <Link to="/predictions" className="btn-ghost-custom p-2 rounded-circle" style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="bi bi-arrow-left"></i>
          </Link>
        <div>
          <h1 className="panel-title fs-2">Prediction Analysis</h1>
          <p className="text-secondary small">Snapshot from {new Date(prediction.createdAt || prediction.timestamp).toLocaleString()}</p>
        </div>
      </div>
      <div className={`badge-custom ${prediction.churnPrediction === 1 ? 'badge-danger' : 'badge-success'}`}>
        {prediction.churnPrediction === 1 ? 'Churn Predicted' : 'Retention Predicted'}
      </div>
      </div>

      <div className="row g-4 reveal-group">
        <div className="col-lg-4">
          <div className="card-custom h-100">
            <h2 className="panel-title mb-4">Input Parameters</h2>
            <div className="d-flex flex-column gap-3">
              {Object.entries(prediction.inputFeatures || prediction.input_data || {}).map(([key, value]) => (
                <div key={key} className="d-flex justify-content-between align-items-center py-2 border-bottom border-subtle">
                  <span className="text-secondary small text-capitalize">{key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}</span>
                  <span className="fw-bold" style={{ color: 'var(--text-primary)' }}>{typeof value === 'number' && value > 1000 ? value.toLocaleString() : String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-lg-8">
          <div className="card-custom mb-4">
            <div className="panel-header">
              <h2 className="panel-title">Model Output</h2>
            </div>
            <div className="row g-4 text-center py-3">
              <div className="col-md-6">
                <div className="text-secondary small mb-1">Probability Score</div>
                <div className="display-4 fw-bold" style={{ color: (prediction.churnProbability || prediction.probability) > 0.5 ? 'var(--accent)' : 'var(--text-primary)' }}>
                  {((prediction.churnProbability || prediction.probability || 0) * 100).toFixed(1)}%
                </div>
              </div>
              <div className="col-md-6">
                <div className="text-secondary small mb-1">Model Version</div>
                <div className="fs-2 fw-bold" style={{ color: 'var(--text-primary)' }}>v2.4.1</div>
                <div className="text-info small mt-1">Cascade Expert</div>
              </div>
            </div>
          </div>

          <ReasonAndRescue prediction={prediction} />
        </div>
      </div>
    </div>
  );
}
