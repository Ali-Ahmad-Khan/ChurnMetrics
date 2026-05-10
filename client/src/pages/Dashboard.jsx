import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDashboardStats } from "../services/api";
import { useReveal } from "../hooks/useReveal";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const revealRef = useReveal();
  const groupRef = useReveal();

  useEffect(() => {
    getDashboardStats()
      .then((res) => {
        setStats(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Dashboard stats fetch failed:", err);
        setStats({
          customers: { total: 0, churned: 0, churnRate: 0 },
          predictions: { total: 0, predictedChurners: 0, riskDistribution: [], revenueAtRisk: 0 },
          recentPredictions: [],
          aiEngine: { status: 'offline', modelLoaded: false }
        });
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center min-vh-100" style={{ background: 'var(--bg-base)' }}>
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );

  if (!stats) return (
    <div className="container mt-5">
      <div className="alert alert-danger">Failed to load dashboard data. Please check backend connection.</div>
    </div>
  );

  return (
    <div className="reveal" ref={revealRef}>
      <div className="panel-header mb-4">
        <h1 className="panel-title fs-2">Executive Overview</h1>
        <div className="text-secondary small">Last updated: {new Date().toLocaleDateString()}</div>
      </div>

      <div className="row g-4 reveal-group" ref={groupRef}>
        {/* KPI Cards */}
        <div className="col-md-3">
          <div className="card-custom">
            <div className="text-secondary small mb-1">Total Customers</div>
            <div className="fs-3 fw-bold">{stats.customers?.total?.toLocaleString() || 0}</div>
            <div className="text-success small mt-2">
              <i className="bi bi-arrow-up-right me-1"></i>+2.4%
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card-custom">
            <div className="text-secondary small mb-1">Active Predictions</div>
            <div className="fs-3 fw-bold">{stats.predictions?.total?.toLocaleString() || 0}</div>
            <div className="text-info small mt-2">Real-time monitoring</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card-custom">
            <div className="text-secondary small mb-1">Avg. Churn Rate</div>
            <div className="fs-3 fw-bold">{(stats.customers?.churnRate * 100 || 0).toFixed(1)}%</div>
            <div className="text-danger small mt-2">
              <i className="bi bi-exclamation-triangle me-1"></i>High Attention
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card-custom">
            <div className="text-secondary small mb-1">
              Revenue at Risk
              <i className="bi bi-info-circle ms-1" title="Sum of Monthly Charges for predicted churners" style={{ cursor: 'help' }}></i>
            </div>
            <div className="fs-3 fw-bold">${(stats.predictions?.revenueAtRisk || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
            <div className="text-warning small mt-2">Potential Monthly Loss</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card-custom">
            <div className="text-secondary small mb-1">AI Engine Status</div>
            <div className={`fs-3 fw-bold ${(stats.aiEngine?.status === 'online' || stats.aiEngine?.status === 'ok') ? 'text-success' : 'text-danger'}`}>
              {(stats.aiEngine?.status === 'online' || stats.aiEngine?.status === 'ok') ? 'Active' : 'Offline'}
            </div>
            <div className="text-secondary small mt-2">
              {(stats.aiEngine?.modelLoaded || stats.aiEngine?.model_loaded || stats.aiEngine?.loaded) ? (
                <><i className="bi bi-check-circle-fill text-success me-1"></i>Model Loaded</>
              ) : (
                <><i className="bi bi-x-circle-fill text-danger me-1"></i>{stats.aiEngine?.status === 'offline' ? 'System Down' : 'No Model'}</>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="row mt-4">
        <div className="col-lg-8">
          <div className="card-custom h-100">
            <div className="panel-header">
              <h2 className="panel-title">Recent High-Risk Customers</h2>
              <Link to="/customers" className="btn-ghost-custom btn-sm py-1 px-2 text-decoration-none" style={{ fontSize: '0.8rem' }}>View All</Link>
            </div>
            <div className="table-responsive">
              <table className="table-custom">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Risk Score</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(stats.recentPredictions || []).map(pred => (
                    <tr key={pred._id}>
                      <td>
                        <div className="fw-bold text-truncate" style={{ maxWidth: '120px' }}>{pred.customerID}</div>
                        <div className="text-secondary extra-small" style={{ fontSize: '0.75rem' }}>{pred.stageUsed}</div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div className="progress flex-grow-1" style={{ height: 6, maxWidth: 60 }}>
                            <div 
                              className={`progress-bar ${pred.churnProbability > 0.7 ? 'bg-danger' : 'bg-warning'}`} 
                              style={{ width: `${pred.churnProbability * 100}%` }}
                            ></div>
                          </div>
                          <span className="fw-bold">{(pred.churnProbability * 100).toFixed(0)}%</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge-custom ${pred.riskLabel === 'High' ? 'badge-danger' : pred.riskLabel === 'Medium' ? 'badge-warning' : 'badge-success'}`}>
                          {pred.riskLabel}
                        </span>
                      </td>
                      <td>
                        <Link to={`/customers/${pred.customerID}`} className="btn-ghost-custom py-1 px-2 text-decoration-none" style={{ fontSize: '0.8rem' }}>Analyze</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        <div className="col-lg-4">
          <div className="card-custom h-100">
            <div className="panel-header">
              <h2 className="panel-title">Model Performance</h2>
            </div>
            <div className="text-center py-4">
              <div className="fs-1 fw-bold text-accent" style={{ color: 'var(--accent)' }}>87.4%</div>
              <div className="text-secondary mb-4">Current Model Accuracy</div>
              
              <div className="d-flex flex-column gap-3 text-start">
                <div>
                  <div className="d-flex justify-content-between mb-1 small">
                    <span>Precision</span>
                    <span>91%</span>
                  </div>
                  <div className="progress" style={{ height: 4 }}>
                    <div className="progress-bar bg-info" style={{ width: '91%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="d-flex justify-content-between mb-1 small">
                    <span>Recall</span>
                    <span>84%</span>
                  </div>
                  <div className="progress" style={{ height: 4 }}>
                    <div className="progress-bar bg-info" style={{ width: '84%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="d-flex justify-content-between mb-1 small">
                    <span>F1 Score</span>
                    <span>87%</span>
                  </div>
                  <div className="progress" style={{ height: 4 }}>
                    <div className="progress-bar bg-info" style={{ width: '87%' }}></div>
                  </div>
                </div>
              </div>
              
              <Link to="/drift" className="btn-primary-custom w-100 mt-4 text-decoration-none d-block">View Drift Analysis</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
