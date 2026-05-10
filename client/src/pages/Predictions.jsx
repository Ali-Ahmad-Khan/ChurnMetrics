import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getPredictions } from "../services/api";
import { useReveal } from "../hooks/useReveal";

export default function Predictions() {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const revealRef = useReveal();

  useEffect(() => {
    getPredictions().then((res) => {
      setPredictions(res.data?.predictions || []);
      setLoading(false);
    }).catch(err => {
      console.error("Predictions fetch failed:", err);
      setPredictions([]);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center min-vh-100">
      <div className="spinner-border text-info"></div>
    </div>
  );

  return (
    <div className="reveal" ref={revealRef}>
      <div className="panel-header mb-4">
        <div>
          <h1 className="panel-title fs-2">Prediction History</h1>
          <p className="text-secondary small">Review past analysis and monitor model performance consistency.</p>
        </div>
      </div>

      <div className="card-custom p-0 overflow-hidden">
        <div className="table-responsive">
          <table className="table-custom">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Probability</th>
                <th>Result</th>
                <th>Customer ID</th>
                <th>Contract</th>
                <th>Monthly Charge</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {predictions.map((p) => (
                <tr key={p._id}>
                  <td className="text-secondary small">{new Date(p.createdAt).toLocaleString()}</td>
                  <td>
                    <div className="fw-bold">{(p.churnProbability * 100).toFixed(1)}%</div>
                  </td>
                  <td>
                    <span className={`badge-custom ${p.churnPrediction === 1 ? 'badge-danger' : 'badge-success'}`}>
                      {p.churnPrediction === 1 ? 'Churn' : 'Stay'}
                    </span>
                  </td>
                  <td>{p.customerID}</td>
                  <td>{p.inputFeatures?.Contract || 'N/A'}</td>
                  <td className="text-secondary">${p.inputFeatures?.MonthlyCharges || 0}</td>
                  <td>
                    <Link
                      to={`/predictions/${p._id}`}
                      className="btn btn-sm btn-outline-primary text-decoration-none"
                    >
                      <i className="bi bi-eye me-1"></i> Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
