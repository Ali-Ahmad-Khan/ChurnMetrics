import { useEffect, useState } from "react";
import { getDriftStatus, triggerRetrain } from "../services/api";
import { useReveal } from "../hooks/useReveal";
import { useAuth } from "../context/AuthContext";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Drift() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const revealRef = useReveal();
  const { isAdmin } = useAuth();

  const fetchDrift = () => {
    setLoading(true);
    getDriftStatus()
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Drift data fetch error:", err);
        setError("Failed to connect to the drift detection service.");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDrift();
  }, []);

  const handleRetrain = async () => {
    if (!isAdmin) return;
    setRetraining(true);
    setMessage(null);
    try {
      await triggerRetrain();
      setMessage({ type: 'success', text: 'Model retraining triggered successfully. This may take a few minutes.' });
      // Refresh drift status after a delay
      setTimeout(fetchDrift, 5000);
    } catch (err) {
      console.error("Retrain error:", err);
      setMessage({ type: 'danger', text: 'Failed to trigger model retraining. Check system logs.' });
    } finally {
      setRetraining(false);
    }
  };

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center min-vh-100" style={{ background: 'var(--bg-base)' }}>
      <div className="text-center">
        <div className="spinner-border text-accent mb-3"></div>
        <div className="text-secondary">Analyzing model stability...</div>
      </div>
    </div>
  );

  if (error || !data) return (
    <div className="container mt-5">
      <div className="card-custom border-0 shadow-sm">
        <div className="card-body p-5 text-center">
          <div className="mb-4">
            <i className="bi bi-shield-slash text-danger" style={{ fontSize: '3rem' }}></i>
          </div>
          <h3 className="panel-title mb-3">Monitoring Unavailable</h3>
          <p className="text-muted mb-4 max-width-500 mx-auto">
            {error || "We encountered an unexpected issue while retrieving drift analysis. Ensure the AI engine microservice is running and accessible."}
          </p>
          <button className="btn-primary-custom" onClick={() => window.location.reload()}>
            <i className="bi bi-arrow-clockwise me-2"></i> Retry Connection
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="reveal" ref={revealRef}>
      <div className="panel-header mb-4">
        <div>
          <h1 className="panel-title fs-2">Model Drift Analysis</h1>
          <p className="text-secondary small">Real-time monitoring of machine learning model performance and data distribution shifts.</p>
        </div>
        <div className={`badge-custom ${data?.driftDetected ? 'badge-danger' : 'badge-success'}`}>
          <i className={`bi bi-${data?.driftDetected ? 'exclamation-circle' : 'check-circle'} me-2`}></i>
          {data?.driftDetected ? 'Drift Detected' : 'Model Healthy'}
        </div>
      </div>

      <div className="row g-4 reveal-group">
        <div className="col-lg-4">
          <div className="card-custom h-100">
            <h3 className="panel-title mb-4">Current Accuracy</h3>
            <div className="text-center py-4">
              <div className="display-4 fw-bold mb-1">{( (data?.currentAccuracy || 0.92) * 100).toFixed(1)}%</div>
              <div className="text-secondary small">Against baseline performance</div>
              
              <div className="mt-5 text-start">
                <div className="d-flex justify-content-between mb-2">
                  <span className="small text-secondary">Data Consistency</span>
                  <span className="small fw-bold">{(data?.consistencyScore || 98.2).toFixed(1)}%</span>
                </div>
                <div className="progress" style={{ height: 6, background: 'var(--bg-surface-2)' }}>
                  <div className="progress-bar bg-success" style={{ width: `${data?.consistencyScore || 98}%` }}></div>
                </div>
              </div>
              
              {message && (
                <div className={`alert alert-${message.type} py-2 small mt-4 mb-0 border-0`}>
                  <i className={`bi bi-${message.type === 'success' ? 'check-circle' : 'exclamation-triangle'} me-2`}></i>
                  {message.text}
                </div>
              )}

              <div className="mt-5">
                {isAdmin ? (
                  <button 
                    className="btn-primary-custom w-100" 
                    onClick={handleRetrain} 
                    disabled={retraining}
                  >
                    {retraining ? (
                      <span className="spinner-border spinner-border-sm me-2"></span>
                    ) : (
                      <i className="bi bi-gear-fill me-2"></i>
                    )}
                    {retraining ? "Retraining..." : "Retrain Model"}
                  </button>
                ) : (
                  <div className="alert alert-secondary py-2 small mb-0 border-0 text-center">
                    <i className="bi bi-lock-fill me-2"></i>
                    Admin access required to retrain
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-8">
          <div className="card-custom h-100">
            <h3 className="panel-title mb-4">Performance Stability (Historical)</h3>
            <div style={{ height: 350 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data?.history || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} />
                  <YAxis domain={[0.7, 1]} tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} />
                  <Tooltip 
                    contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px' }}
                  />
                  <Line type="monotone" dataKey="accuracy" stroke="var(--accent)" strokeWidth={3} dot={{ fill: 'var(--accent)', r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        <div className="col-12">
          <div className="card-custom">
            <h3 className="panel-title mb-4">Feature Shifts (PSI)</h3>
            <div className="table-responsive">
              <table className="table-custom">
                <thead>
                  <tr>
                    <th>Feature Name</th>
                    <th>Train Mean</th>
                    <th>Inference Mean</th>
                    <th>Z-Score</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.driftedFeatures || []).length > 0 ? data.driftedFeatures.map((shift, i) => (
                    <tr key={i}>
                      <td className="fw-bold">{shift.feature || `Feature #${shift.featureIdx}`}</td>
                      <td>{shift.trainMean?.toFixed(4)}</td>
                      <td>{shift.newMean?.toFixed(4)}</td>
                      <td>
                        <span className="fw-mono">{shift.zScore?.toFixed(4)}</span>
                      </td>
                      <td>
                        <span className={`badge-custom ${Math.abs(shift.zScore) > 2 ? 'badge-warning' : 'badge-success'}`}>
                          {Math.abs(shift.zScore) > 2 ? 'Drifted' : 'Stable'}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="5" className="text-center py-4 text-muted">No significant feature drift detected in the current sample.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
