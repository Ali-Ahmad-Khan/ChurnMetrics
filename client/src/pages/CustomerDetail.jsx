import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getCustomerById, getPredictionForCustomer, runPrediction } from "../services/api";
import { useReveal } from "../hooks/useReveal";
import ReasonAndRescue from "../components/ReasonAndRescue";

export default function CustomerDetail() {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [predicting, setPredicting] = useState(false);
  const [error, setError] = useState(null);
  const revealRef = useReveal();

  useEffect(() => {
    setLoading(true);
    setError(null);
    
    Promise.all([
      getCustomerById(id).catch(err => {
        console.error("Customer fetch error:", err);
        return { data: null, error: true };
      }),
      getPredictionForCustomer(id).catch(err => {
        console.error("Prediction fetch error:", err);
        return { data: { predictions: [] } };
      })
    ]).then(
      ([cRes, pRes]) => {
        if (cRes.error || !cRes.data) {
          setError("Customer data could not be retrieved. It may have been deleted or the ID is invalid.");
        } else {
          setCustomer(cRes.data);
          setPrediction(pRes.data?.predictions?.[0] || null);
        }
        setLoading(false);
      }
    ).catch((err) => {
      console.error("Customer detail promise.all failed:", err);
      setError("An unexpected error occurred while loading customer details.");
      setLoading(false);
    });
  }, [id]);

  const handleRunPrediction = async () => {
    if (!customer) return;
    setPredicting(true);
    try {
      const res = await runPrediction(customer);
      const raw = res.data;
      // Flatten nested FastAPI response to match MongoDB document shape
      setPrediction({
        churnPrediction: raw.prediction?.churnPrediction,
        churnProbability: raw.prediction?.churnProbability,
        riskLabel: raw.prediction?.riskLabel,
        needsReview: raw.prediction?.needsReview,
        stageUsed: raw.prediction?.stageUsed,
        topFeatures: raw.topFeatures || [],
        recommendations: raw.recommendations || [],
        rescuePlan: raw.rescuePlan || {},
        customerID: customer.customerID,
        inputFeatures: customer,
        _id: raw._id,
        createdAt: raw.savedAt,
      });
    } catch (err) {
      console.error("Prediction failed:", err);
      alert("Failed to generate prediction. Ensure AI Engine (FastAPI) is online at port 8000.");
    } finally {
      setPredicting(false);
    }
  };

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center min-vh-100" style={{ background: 'var(--bg-base)' }}>
      <div className="spinner-border text-accent" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );

  if (error || !customer) return (
    <div className="container py-5 text-center">
      <div className="card-custom py-5">
        <i className="bi bi-exclamation-octagon text-danger fs-1 mb-3 d-block"></i>
        <h2 className="text-primary">{error || "Customer Not Found"}</h2>
        <p className="text-secondary mt-2">The system was unable to find record for ID: {id}</p>
        <Link to="/customers" className="btn-primary-custom mt-4 text-decoration-none d-inline-block">Back to Directory</Link>
      </div>
    </div>
  );

  return (
    <div className="reveal" ref={revealRef}>
      <div className="panel-header mb-4">
        <div className="d-flex align-items-center gap-3">
          <Link to="/customers" className="btn-ghost-custom p-2 rounded-circle" style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="bi bi-arrow-left"></i>
          </Link>
          <div>
            <h1 className="panel-title fs-2">{customer.customerID}</h1>
            <p className="text-secondary small">Profile: {customer.gender} | {customer.SeniorCitizen === 1 ? 'Senior' : 'Non-Senior'} | {customer.Partner === 'Yes' ? 'Partnered' : 'Single'}</p>
          </div>
        </div>
        <div className="d-flex gap-3 align-items-center">
          {!prediction && (
            <button 
              className="btn-primary-custom py-1 px-4" 
              onClick={handleRunPrediction}
              disabled={predicting}
            >
              {predicting ? (
                <><span className="spinner-border spinner-border-sm me-2"></span>Analysing...</>
              ) : (
                <><i className="bi bi-cpu me-2"></i>Run AI Analysis</>
              )}
            </button>
          )}
          <div className={`badge-custom ${customer.Churn === 'Yes' ? 'badge-danger' : 'badge-success'}`}>
            {customer.Churn === 'Yes' ? 'Churned' : 'Active'}
          </div>
        </div>
      </div>

      <div className="row g-4 reveal-group">
        {/* Profile Card */}
        <div className="col-lg-4">
          <div className="card-custom h-100">
            <h2 className="panel-title mb-4">Service Profile</h2>
            <div className="d-flex flex-column gap-4">
              <div className="d-flex align-items-center gap-3">
                <div className="bg-surface-2 p-3 rounded-3 text-accent">
                  <i className="bi bi-cpu fs-4"></i>
                </div>
                <div>
                  <div className="text-secondary small">Internet Service</div>
                  <div className="fw-bold">{customer.InternetService || 'N/A'}</div>
                </div>
              </div>

              <div className="d-flex align-items-center gap-3">
                <div className="bg-surface-2 p-3 rounded-3 text-accent">
                  <i className="bi bi-file-earmark-text fs-4"></i>
                </div>
                <div>
                  <div className="text-secondary small">Contract Type</div>
                  <div className="fw-bold">{customer.Contract || 'N/A'}</div>
                </div>
              </div>

              <div className="d-flex align-items-center gap-3">
                <div className="bg-surface-2 p-3 rounded-3 text-accent">
                  <i className="bi bi-credit-card fs-4"></i>
                </div>
                <div>
                  <div className="text-secondary small">Payment Method</div>
                  <div className="fw-bold">{customer.PaymentMethod || 'N/A'}</div>
                </div>
              </div>
              
              <div className="pt-4 border-top border-subtle mt-2">
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-secondary small">Monthly Charges</span>
                  <span className="fw-bold">${customer.MonthlyCharges?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-secondary small">Tenure (Months)</span>
                  <span className="fw-bold">{customer.tenure} months</span>
                </div>
                <div className="d-flex justify-content-between mt-2 pt-2 border-top border-dashed">
                  <span className="text-secondary small">Lifetime Value</span>
                  <span className="fw-bold text-success">${customer.TotalCharges?.toLocaleString() || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Prediction Stats */}
        <div className="col-lg-8">
          <div className="card-custom h-100">
            <div className="panel-header">
              <h2 className="panel-title">Risk Analysis</h2>
              {prediction && (
                <span className="badge-custom badge-secondary small">
                  {prediction.stageUsed === 'stage2' ? 'XGBoost Local Expert' : 'Baseline Model'}
                </span>
              )}
            </div>
            
            {prediction ? (
              <>
                <div className="row g-4 mt-1">
                  <div className="col-md-6">
                    <div className="bg-surface-2 p-4 rounded-4 text-center border border-subtle">
                      <div className="text-secondary small mb-1">Risk Probability</div>
                      <div className="display-4 fw-bold" style={{ color: prediction.churnProbability > 0.6 ? 'var(--danger)' : prediction.churnProbability > 0.3 ? 'var(--warning)' : 'var(--success)' }}>
                        {(prediction.churnProbability * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="bg-surface-2 p-4 rounded-4 text-center h-100 d-flex flex-column justify-content-center border border-subtle">
                      <div className="text-secondary small mb-2">Risk Classification</div>
                      <div className={`fs-3 fw-bold ${prediction.riskLabel === 'High' ? 'text-danger' : prediction.riskLabel === 'Medium' ? 'text-warning' : 'text-success'}`}>
                        {prediction.riskLabel}
                      </div>
                      <div className="text-secondary extra-small mt-1">Calculated via Two-Stage Cascade</div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-5">
                  <h3 className="panel-title fs-6 mb-4">Contributing Behavioral Features (SHAP)</h3>
                  <div className="d-flex flex-column gap-3">
                    {(prediction.topFeatures || []).slice(0, 5).map((f, i) => (
                      <div key={i}>
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className="text-secondary small">{f.feature}</span>
                          <span className={`${f.shapValue > 0 ? 'text-danger' : 'text-success'} small fw-bold`}>
                            {f.shapValue > 0 ? '+' : ''}{(f.shapValue * 100).toFixed(1)}% impact
                          </span>
                        </div>
                        <div className="progress" style={{ height: 6, background: 'var(--bg-surface-2)' }}>
                          <div 
                            className={`progress-bar ${f.shapValue > 0 ? 'bg-danger' : 'bg-success'}`} 
                            style={{ width: `${Math.min(Math.abs(f.shapValue) * 250, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                    {!prediction.topFeatures?.length && (
                      <div className="text-center py-4 bg-surface-2 rounded-4 border border-dashed border-subtle">
                        <i className="bi bi-info-circle text-muted mb-2 d-block"></i>
                        <p className="text-secondary small mb-0">Detailed feature impact is unavailable for baseline predictions.</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="d-flex flex-column align-items-center justify-content-center h-100 text-center p-5">
                <div className="bg-surface-2 p-4 rounded-circle mb-4" style={{ width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="bi bi-robot fs-1 text-muted opacity-50"></i>
                </div>
                <h4 className="text-primary">Analysis Required</h4>
                <p className="text-secondary small mb-4 max-w-400 mx-auto">
                  This customer record hasn't been processed by the AI Engine yet. 
                  Run the analysis to generate risk scores, reasoning, and rescue strategies.
                </p>
                <button 
                  className="btn-primary-custom px-4"
                  onClick={handleRunPrediction}
                  disabled={predicting}
                >
                  {predicting ? 'Processing Data...' : 'Initialize AI Analysis'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* AI Analysis Component (ReasonAndRescue) */}
        <div className="col-12">
          {prediction ? (
            <ReasonAndRescue prediction={prediction} />
          ) : (
            <div className="card-custom text-center py-5 opacity-75 border-dashed">
              <i className="bi bi-shield-lock text-muted fs-3 mb-2 d-block"></i>
              <p className="text-secondary mb-0">Generate an AI analysis to unlock personalized rescue strategies.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
