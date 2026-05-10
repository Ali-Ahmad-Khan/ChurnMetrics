import { useState } from "react";
import { deployCampaign } from "../services/api";

export default function ReasonAndRescue({ prediction }) {
  const [loading, setLoading] = useState(false);
  const [deployed, setDeployed] = useState(false);
  const [error, setError] = useState(null);

  if (!prediction) return null;

  const handleDeploy = async () => {
    setLoading(true);
    setError(null);
    try {
      await deployCampaign({
        customerID: prediction.customerID,
        strategy: prediction.riskLabel || "High Risk",
        rescueAction: prediction.rescuePlan?.strategy || (prediction.strategy || '').split('\n')[0] || "Standard Retention offer"
      });
      setDeployed(true);
      setTimeout(() => setDeployed(false), 3000); // Reset after 3 seconds
    } catch (err) {
      console.error("Campaign deployment failed:", err);
      setError("Failed to deploy campaign. Check backend logs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="row g-4">
      <div className="col-md-6">
        <div className="card-custom h-100">
          <div className="panel-header">
            <h2 className="panel-title">
              <i className="bi bi-search me-2 text-accent" style={{ color: 'var(--accent)' }}></i>
              AI Reasoning
            </h2>
          </div>
          <p className="text-secondary small mb-4">Underlying factors contributing to the current risk score.</p>
          
            <div className="d-flex flex-column gap-3">
              {(() => {
                const raw = prediction.rescuePlan?.plan || prediction.explanation || prediction.reasoning;
                const text = typeof raw === 'string' ? raw : null;
                return text?.split('\n').filter(l => l.trim()).map((line, i) => (
                  <div key={i} className="d-flex gap-3 align-items-start">
                    <div className="mt-1" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }}></div>
                    <div className="small" style={{ lineHeight: 1.5, color: 'var(--text-primary)' }}>{line.replace(/^-\s*/, '')}</div>
                  </div>
                ));
              })()}
              {!(prediction.rescuePlan?.plan || prediction.explanation || prediction.reasoning) && prediction.topFeatures?.length > 0 && (
                prediction.topFeatures.map((f, i) => (
                  <div key={i} className="d-flex gap-3 align-items-start">
                    <div className="mt-1" style={{ width: 6, height: 6, borderRadius: '50%', background: f.shapValue > 0 ? 'var(--danger)' : 'var(--success)', flexShrink: 0 }}></div>
                    <div className="small" style={{ lineHeight: 1.5, color: 'var(--text-primary)' }}>
                      <strong>{f.feature}</strong>: {f.shapValue > 0 ? 'Increases' : 'Decreases'} churn risk by {(Math.abs(f.shapValue || 0) * 100).toFixed(1)}%
                    </div>
                  </div>
                ))
              )}
            </div>
        </div>
      </div>

      <div className="col-md-6">
        <div className="card-custom h-100" style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent)' }}>
          <div className="panel-header">
            <h2 className="panel-title">
              <i className="bi bi-shield-check me-2 text-accent" style={{ color: 'var(--accent)' }}></i>
              Rescue Strategy
            </h2>
          </div>
          <p className="text-secondary small mb-4">Personalized recommendations to reduce churn probability.</p>
          
          <div className="d-flex flex-column gap-3">
            {(() => {
              const raw = prediction.rescuePlan?.script || prediction.strategy;
              const text = typeof raw === 'string' ? raw : null;
              if (text) {
                return text.split('\n').filter(l => l.trim()).map((line, i) => (
                  <div key={i} className="d-flex gap-3 align-items-start">
                    <i className="bi bi-check2-circle text-accent mt-1" style={{ color: 'var(--accent)', fontSize: '0.9rem' }}></i>
                    <div className="small" style={{ lineHeight: 1.5, color: 'var(--text-primary)' }}>{line.replace(/^\d\.\s*/, '')}</div>
                  </div>
                ));
              }
              if (Array.isArray(prediction.recommendations) && prediction.recommendations.length > 0) {
                return prediction.recommendations.map((rec, i) => (
                  <div key={i} className="d-flex gap-3 align-items-start">
                    <i className="bi bi-check2-circle text-accent mt-1" style={{ color: 'var(--accent)', fontSize: '0.9rem' }}></i>
                    <div className="small" style={{ lineHeight: 1.5, color: 'var(--text-primary)' }}>
                      {typeof rec === 'string' ? rec.replace(/^\d\.\s*/, '') : (rec.action || rec.description || rec.text || JSON.stringify(rec))}
                    </div>
                  </div>
                ));
              }
              return null;
            })()}
          </div>
          
          <div className="mt-auto pt-4">
            {error && <div className="text-danger extra-small mb-2 text-center">{error}</div>}
            <button 
              className={`btn-primary-custom w-100 ${deployed ? 'btn-success-custom' : ''}`}
              onClick={handleDeploy}
              disabled={loading || deployed}
            >
              {loading ? (
                <><span className="spinner-border spinner-border-sm me-2"></span>Deploying...</>
              ) : deployed ? (
                <><i className="bi bi-check2-circle me-2"></i>Deployed Successfully</>
              ) : (
                'Deploy Campaign'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
