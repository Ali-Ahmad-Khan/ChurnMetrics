import React from "react";

const ReasonAndRescue = ({ topFeatures, rescuePlan, churnPrediction }) => {
  if (!churnPrediction) return null;

  return (
    <div className="card shadow-sm border-0 mb-4 overflow-hidden" style={{ borderRadius: "16px", background: "rgba(255, 255, 255, 0.05)", backdropFilter: "blur(10px)" }}>
      <div className="card-header bg-danger bg-opacity-10 border-0 py-3">
        <h5 className="mb-0 text-danger d-flex align-items-center">
          <i className="bi bi-shield-exclamation me-2"></i>
          Reason & Rescue Strategy
        </h5>
      </div>
      <div className="card-body p-4 text-light">
        <div className="row g-4">
          {/* Reasons Section */}
          <div className="col-md-5">
            <h6 className="text-uppercase text-secondary small fw-bold mb-3">Top Churn Drivers (SHAP)</h6>
            <div className="d-flex flex-column gap-2">
              {topFeatures && topFeatures.length > 0 ? (
                topFeatures.slice(0, 3).map((feat, idx) => (
                  <div key={idx} className="p-2 rounded bg-dark bg-opacity-50 border border-secondary border-opacity-25">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="small text-truncate me-2">{feat.feature.replace(/_/g, ' ')}</span>
                      <span className="badge bg-danger bg-opacity-25 text-danger">+{Math.round(feat.impact * 100)}%</span>
                    </div>
                    <div className="progress" style={{ height: "4px", backgroundColor: "rgba(255,255,255,0.1)" }}>
                      <div 
                        className="progress-bar bg-danger" 
                        role="progressbar" 
                        style={{ width: `${Math.min(100, feat.impact * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-secondary small italic">No specific drivers identified.</div>
              )}
            </div>
          </div>

          {/* Rescue Plan Section */}
          <div className="col-md-7">
            <div className="p-3 rounded border border-primary border-opacity-25" style={{ background: "rgba(13, 110, 253, 0.05)" }}>
              <div className="d-flex justify-content-between align-items-start mb-2">
                <h6 className="text-uppercase text-primary small fw-bold mb-0">Personalized Rescue Plan</h6>
                {rescuePlan?.is_ai_generated && (
                  <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25" style={{ fontSize: "0.65rem" }}>
                    <i className="bi bi-stars me-1"></i> {rescuePlan.model_used || "AI Analysis"}
                  </span>
                )}
              </div>
              
              {rescuePlan ? (
                <>
                  <div className="mb-3">
                    <div className="small text-secondary mb-1">Core Strategy</div>
                    <div className="fw-bold text-info">{rescuePlan.strategy}</div>
                  </div>
                  <div className="mb-3">
                    <div className="small text-secondary mb-1">The Plan</div>
                    <div className="small lh-sm">{rescuePlan.plan}</div>
                  </div>
                  <div className="mt-3 pt-3 border-top border-secondary border-opacity-25">
                    <div className="small text-secondary mb-1 d-flex align-items-center">
                      <i className="bi bi-chat-left-text me-1"></i> Agent Outreach Script
                    </div>
                    <div className="p-2 rounded bg-dark bg-opacity-50 small italic text-secondary border-start border-3 border-primary">
                      "{rescuePlan.script}"
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-secondary small italic py-4 text-center">
                  Generating plan based on drivers...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReasonAndRescue;
