import { useState, useRef } from "react";
import { runSimulation } from "../services/api";
import { useReveal } from "../hooks/useReveal";

export default function WhatIf() {
  const [params, setParams] = useState({
    MonthlyCharges: 0,
    tenure: 0,
    TotalCharges: 0,
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const revealRef = useReveal();
  const resultsRef = useRef(null);

  const handleRun = async () => {
    setLoading(true);
    setError(null);
    try {
      // Build shifts from params. MonthlyCharges and TotalCharges are co-dependent
      // (TotalCharges ≈ tenure × MonthlyCharges), so a pricing shift must propagate to both
      // to produce correct logit direction (otherwise LR multicollinearity flips the sign).
      const shiftMap = { ...params };
      if (shiftMap.MonthlyCharges !== 0 && shiftMap.TotalCharges === 0) {
        shiftMap.TotalCharges = shiftMap.MonthlyCharges;
      }

      const shifts = Object.entries(shiftMap)
        .filter(([_, value]) => value !== 0)
        .map(([feature, value]) => ({
          feature,
          percentage_change: value
        }));

      if (shifts.length === 0) {
        setResult(null);
        setLoading(false);
        return;
      }

      const res = await runSimulation({ shifts });
      setResult(res.data);
      
      // Smooth scroll to results on mobile
      if (window.innerWidth < 992) {
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } catch (err) {
      console.error("Simulation error:", err);
      setError("Failed to run simulation. Ensure the AI engine is active.");
    } finally {
      setLoading(false);
    }
  };

  const resetParams = () => {
    setParams({
      MonthlyCharges: 0,
      tenure: 0,
      TotalCharges: 0,
    });
    setResult(null);
    setError(null);
  };

  return (
    <div className="reveal" ref={revealRef}>
      <div className="panel-header mb-4">
        <div>
          <h1 className="panel-title fs-2">Scenario Simulator</h1>
          <p className="text-secondary small">Mathematically deduce the impact of global feature shifts on your entire customer base using Logit-Shift Deduction.</p>
        </div>
        {result && (
          <button className="btn-ghost-custom" onClick={resetParams}>
            <i className="bi bi-arrow-counterclockwise me-1"></i> Reset Scenarios
          </button>
        )}
      </div>

      <div className="row g-4">
        <div className="col-lg-4">
          <div className="card-custom h-100 shadow-sm border-0" style={{ background: 'var(--bg-surface)' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2 className="panel-title mb-0">Global Shifts (%)</h2>
              <i className="bi bi-info-circle text-muted" title="Adjust global feature distributions to simulate market changes"></i>
            </div>
            
            <div className="d-flex flex-column gap-4">
              <div className="param-group">
                <label className="form-label small text-secondary fw-bold d-flex justify-content-between">
                  Monthly Charges (Pricing)
                  <span className={params.MonthlyCharges > 0 ? 'text-danger' : params.MonthlyCharges < 0 ? 'text-success' : 'text-accent'}>
                    {params.MonthlyCharges > 0 ? '+' : ''}{params.MonthlyCharges}%
                  </span>
                </label>
                <input 
                  type="range" className="form-range custom-range" min="-30" max="30" step="1"
                  value={params.MonthlyCharges} 
                  onChange={(e) => setParams({...params, MonthlyCharges: Number(e.target.value)})} 
                />
              </div>

              <div className="param-group">
                <label className="form-label small text-secondary fw-bold d-flex justify-content-between">
                  Avg Tenure (Retention)
                  <span className={params.tenure > 0 ? 'text-success' : params.tenure < 0 ? 'text-danger' : 'text-accent'}>
                    {params.tenure > 0 ? '+' : ''}{params.tenure}%
                  </span>
                </label>
                <input 
                  type="range" className="form-range custom-range" min="-50" max="50" step="5"
                  value={params.tenure} 
                  onChange={(e) => setParams({...params, tenure: Number(e.target.value)})} 
                />
              </div>

              <div className="param-group">
                <label className="form-label small text-secondary fw-bold d-flex justify-content-between">
                  Total Charges (Historical Spend)
                  <span className={params.TotalCharges > 0 ? 'text-danger' : params.TotalCharges < 0 ? 'text-success' : 'text-accent'}>
                    {params.TotalCharges > 0 ? '+' : ''}{params.TotalCharges}%
                  </span>
                </label>
                <input
                  type="range" className="form-range custom-range" min="-30" max="30" step="1"
                  value={params.TotalCharges}
                  onChange={(e) => setParams({...params, TotalCharges: Number(e.target.value)})}
                />
              </div>

              {error && (
                <div className="alert alert-danger py-2 small mb-0 border-0">
                  <i className="bi bi-exclamation-circle me-2"></i> {error}
                </div>
              )}

              <button 
                className={`btn-primary-custom w-100 mt-2 ${loading ? 'loading' : ''}`} 
                onClick={handleRun} 
                disabled={loading}
              >
                {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-cpu-fill me-2"></i>}
                {loading ? "Calculating impact..." : "Run Global Simulation"}
              </button>
            </div>
          </div>
        </div>

        <div className="col-lg-8" ref={resultsRef}>
          {result ? (
            <div className="reveal-group visible">
              <div className="row g-4 mb-4">
                <div className="col-md-6">
                  <div className="card-custom text-center py-4 bg-surface-2 border-0">
                    <div className="text-secondary small mb-1">Baseline Churn Rate</div>
                    <div className="fs-1 fw-bold">{(result.originalChurnRate * 100).toFixed(1)}%</div>
                    <div className="text-muted extra-small">{result.originalChurnCount} customers</div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="card-custom text-center py-4 border-0" style={{ 
                    border: `1px solid ${result.modifiedChurnRate > result.originalChurnRate ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                    background: result.modifiedChurnRate > result.originalChurnRate ? 'rgba(239, 68, 68, 0.05)' : 'rgba(16, 185, 129, 0.05)'
                  }}>
                    <div className="text-secondary small mb-1">Simulated Churn Rate</div>
                    <div className={`fs-1 fw-bold ${result.modifiedChurnRate > result.originalChurnRate ? 'text-danger' : 'text-success'}`}>
                      {(result.modifiedChurnRate * 100).toFixed(1)}%
                    </div>
                    <div className="text-muted extra-small">{result.modifiedChurnCount} customers</div>
                  </div>
                </div>
              </div>

              <div className="card-custom border-0" style={{ background: 'var(--bg-surface-2)' }}>
                <div className="d-flex align-items-center mb-3">
                  <div className="p-2 rounded bg-accent-soft me-3">
                    <i className="bi bi-graph-up-arrow text-accent"></i>
                  </div>
                  <h3 className="panel-title mb-0">Projected Business Impact</h3>
                </div>
                
                <div className="row g-3">
                  <div className="col-sm-6">
                    <div className="p-3 rounded bg-surface border border-subtle">
                      <div className="text-secondary extra-small mb-1 uppercase tracking-wider">Delta (Count)</div>
                      <div className={`fs-4 fw-bold ${result.changeCount > 0 ? 'text-danger' : 'text-success'}`}>
                        {result.changeCount > 0 ? '+' : ''}{result.changeCount}
                      </div>
                      <div className="text-muted extra-small">Customer difference</div>
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <div className="p-3 rounded bg-surface border border-subtle">
                      <div className="text-secondary extra-small mb-1 uppercase tracking-wider">Delta (%)</div>
                      <div className={`fs-4 fw-bold ${result.changePercentage > 0 ? 'text-danger' : 'text-success'}`}>
                        {result.changePercentage > 0 ? '+' : ''}{result.changePercentage}%
                      </div>
                      <div className="text-muted extra-small">Relative churn shift</div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-top border-subtle">
                  <div className="d-flex align-items-center mb-2">
                    <i className="bi bi-info-circle-fill text-accent me-2"></i>
                    <span className="small fw-bold text-secondary">Logit-Shift Methodology</span>
                  </div>
                  <p className="text-muted extra-small lh-base mb-0">
                    {result.mathDetails || "Mathematically deduced using weight-propagation through the stage 1 logistic model."}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="card-custom h-100 d-flex flex-column justify-content-center align-items-center text-center p-5 border-0" style={{ background: 'var(--bg-surface-2)', borderStyle: 'dashed !important', borderWidth: '2px !important' }}>
              <div className="mb-4 p-4 rounded-circle bg-surface shadow-sm">
                <i className="bi bi-cpu text-accent" style={{ fontSize: '2.5rem' }}></i>
              </div>
              <h3 className="panel-title mb-2">Ready for Simulation</h3>
              <p className="text-muted max-width-400 mx-auto small">
                Adjust the global parameters on the left and click "Run Global Simulation" to mathematically deduce how market shifts would affect your bottom line.
              </p>
              <div className="mt-4 d-flex gap-2">
                <span className="badge bg-surface-3 text-secondary border border-subtle px-3 py-2">Deductive AI</span>
                <span className="badge bg-surface-3 text-secondary border border-subtle px-3 py-2">Real-time Inference</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
