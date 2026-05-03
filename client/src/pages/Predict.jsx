import { useState } from "react";
import { useLocation } from "react-router-dom";
import { predictSingle } from "../services/api";

const defaultCustomer = {
  gender: "Female",
  SeniorCitizen: 0,
  Partner: "Yes",
  Dependents: "No",
  tenure: 12,
  PhoneService: "Yes",
  MultipleLines: "No",
  InternetService: "DSL",
  OnlineSecurity: "No",
  OnlineBackup: "Yes",
  DeviceProtection: "No",
  TechSupport: "No",
  StreamingTV: "No",
  StreamingMovies: "No",
  Contract: "Month-to-month",
  PaperlessBilling: "Yes",
  PaymentMethod: "Electronic check",
  MonthlyCharges: 65.5,
  TotalCharges: 786.0,
};

function SelectField({ label, name, value, onChange, options }) {
  return (
    <div className="col-md-4 mb-3">
      <label className="form-label text-secondary small">{label}</label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="form-select form-select-sm bg-dark text-white border-secondary"
      >
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

function NumberField({ label, name, value, onChange, min, max, step }) {
  return (
    <div className="col-md-4 mb-3">
      <label className="form-label text-secondary small">{label}</label>
      <input
        type="number"
        name={name}
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        step={step || 1}
        className="form-control form-control-sm bg-dark text-white border-secondary"
      />
    </div>
  );
}

function RiskMeter({ probability, risk }) {
  const pct = (probability * 100).toFixed(1);
  const colors = { High: "#dc3545", Medium: "#ffc107", Low: "#198754" };
  return (
    <div className="text-center">
      <div className="position-relative d-inline-block" style={{ width: 180, height: 180 }}>
        <svg viewBox="0 0 180 180" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="90" cy="90" r="70" fill="none" stroke="#2a2a2a" strokeWidth="15" />
          <circle
            cx="90" cy="90" r="70" fill="none"
            stroke={colors[risk] || "#6c757d"}
            strokeWidth="15"
            strokeDasharray={`${probability * 440} 440`}
            strokeLinecap="round"
          />
        </svg>
        <div className="position-absolute top-50 start-50 translate-middle text-center">
          <div className="text-white fw-bold fs-2">{pct}%</div>
          <div className="text-secondary small">churn risk</div>
        </div>
      </div>
    </div>
  );
}

import ReasonAndRescue from "../components/ReasonAndRescue";

export default function Predict() {
  const location = useLocation();
  const prefill = location.state?.prefill;

  const [form, setForm] = useState(() => {
    if (prefill) {
      const { _id, __v, customerID, Churn, createdAt, updatedAt, ...rest } = prefill;
      return { ...defaultCustomer, ...rest };
    }
    return defaultCustomer;
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: ["tenure", "SeniorCitizen", "MonthlyCharges", "TotalCharges"].includes(name)
        ? Number(value)
        : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await predictSingle(form);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-white fw-bold mb-1">
        <i className="bi bi-cpu me-2 text-info"></i>Churn Prediction
      </h2>
      <p className="text-secondary mb-4">Enter customer data to get AI-powered churn prediction with SHAP explanation</p>

      <div className="row">
        {/* Form */}
        <div className={result ? "col-lg-6" : "col-lg-12"}>
          <form onSubmit={handleSubmit}>
            <div className="card bg-dark border-secondary mb-3">
              <div className="card-header border-secondary">
                <h6 className="text-white mb-0">Customer Profile</h6>
              </div>
              <div className="card-body">
                <div className="row">
                  <SelectField label="Gender" name="gender" value={form.gender} onChange={handleChange} options={["Male", "Female"]} />
                  <SelectField label="Senior Citizen" name="SeniorCitizen" value={form.SeniorCitizen} onChange={handleChange} options={[0, 1]} />
                  <SelectField label="Partner" name="Partner" value={form.Partner} onChange={handleChange} options={["Yes", "No"]} />
                  <SelectField label="Dependents" name="Dependents" value={form.Dependents} onChange={handleChange} options={["Yes", "No"]} />
                  <NumberField label="Tenure (months)" name="tenure" value={form.tenure} onChange={handleChange} min={0} max={100} />
                  <SelectField label="Phone Service" name="PhoneService" value={form.PhoneService} onChange={handleChange} options={["Yes", "No"]} />
                  <SelectField label="Multiple Lines" name="MultipleLines" value={form.MultipleLines} onChange={handleChange} options={["Yes", "No"]} />
                  <SelectField label="Internet Service" name="InternetService" value={form.InternetService} onChange={handleChange} options={["DSL", "Fiber optic", "No"]} />
                  <SelectField label="Online Security" name="OnlineSecurity" value={form.OnlineSecurity} onChange={handleChange} options={["Yes", "No"]} />
                  <SelectField label="Online Backup" name="OnlineBackup" value={form.OnlineBackup} onChange={handleChange} options={["Yes", "No"]} />
                  <SelectField label="Device Protection" name="DeviceProtection" value={form.DeviceProtection} onChange={handleChange} options={["Yes", "No"]} />
                  <SelectField label="Tech Support" name="TechSupport" value={form.TechSupport} onChange={handleChange} options={["Yes", "No"]} />
                  <SelectField label="Streaming TV" name="StreamingTV" value={form.StreamingTV} onChange={handleChange} options={["Yes", "No"]} />
                  <SelectField label="Streaming Movies" name="StreamingMovies" value={form.StreamingMovies} onChange={handleChange} options={["Yes", "No"]} />
                  <SelectField label="Contract" name="Contract" value={form.Contract} onChange={handleChange} options={["Month-to-month", "One year", "Two year"]} />
                  <SelectField label="Paperless Billing" name="PaperlessBilling" value={form.PaperlessBilling} onChange={handleChange} options={["Yes", "No"]} />
                  <SelectField label="Payment Method" name="PaymentMethod" value={form.PaymentMethod} onChange={handleChange} options={["Electronic check", "Mailed check", "Bank transfer (automatic)", "Credit card (automatic)"]} />
                  <NumberField label="Monthly Charges ($)" name="MonthlyCharges" value={form.MonthlyCharges} onChange={handleChange} min={0} max={200} step={0.5} />
                  <NumberField label="Total Charges ($)" name="TotalCharges" value={form.TotalCharges} onChange={handleChange} min={0} step={1} />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-info btn-lg w-100"
              disabled={loading}
            >
              {loading ? (
                <span className="spinner-border spinner-border-sm me-2"></span>
              ) : (
                <i className="bi bi-cpu me-2"></i>
              )}
              {loading ? "Running AI Prediction..." : "Predict Churn"}
            </button>
          </form>
        </div>

        {/* Results */}
        {result && (
          <div className="col-lg-6">
            <div className="card bg-dark border-secondary mb-3">
              <div className="card-header border-secondary">
                <h6 className="text-white mb-0">
                  <i className="bi bi-bar-chart me-2 text-info"></i>Prediction Result
                </h6>
              </div>
              <div className="card-body text-center">
                <RiskMeter
                  probability={result.prediction?.churn_probability || result.churn_probability}
                  risk={result.prediction?.risk_label || result.risk_label}
                />
                <div className="mt-3">
                  <span className={`badge bg-${
                    (result.prediction?.risk_label || result.risk_label) === "High" ? "danger" :
                    (result.prediction?.risk_label || result.risk_label) === "Medium" ? "warning" : "success"
                  } fs-6 me-2`}>
                    {result.prediction?.risk_label || result.risk_label} Risk
                  </span>
                  <span className="badge bg-secondary fs-6">
                    Stage: {result.prediction?.stage_used || result.stage_used}
                  </span>
                  {(result.prediction?.needs_review || result.needs_review) && (
                    <span className="badge bg-warning text-dark fs-6 ms-2">
                      <i className="bi bi-flag me-1"></i>Needs Review
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* SHAP Features */}
            {result.top_features && result.top_features.length > 0 && (
              <div className="card bg-dark border-secondary mb-3">
                <div className="card-header border-secondary">
                  <h6 className="text-white mb-0">
                    <i className="bi bi-lightbulb me-2 text-warning"></i>Top Contributing Factors
                  </h6>
                </div>
                <div className="card-body">
                  {result.top_features.map((f, i) => (
                    <div key={i} className="d-flex justify-content-between align-items-center mb-2">
                      <span className="text-white">{f.feature}</span>
                      <span className={`badge bg-${f.shap_value > 0 ? "danger" : "success"}`}>
                        {f.shap_value > 0 ? "+" : ""}{f.shap_value.toFixed(4)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reason & Rescue Section */}
            <ReasonAndRescue 
              topFeatures={result.top_features} 
              rescuePlan={result.rescue_plan}
              churnPrediction={result.prediction.churn_prediction}
            />

            {/* Recommendations */}
            {result.recommendations && result.recommendations.length > 0 && (
              <div className="card bg-dark border-secondary">
                <div className="card-header border-secondary">
                  <h6 className="text-white mb-0">
                    <i className="bi bi-clipboard-check me-2 text-success"></i>Recommended Actions
                  </h6>
                </div>
                <div className="card-body">
                  {result.recommendations.map((rec, i) => (
                    <div key={i} className="border border-secondary rounded p-2 mb-2">
                      <div className="d-flex justify-content-between align-items-start">
                        <strong className="text-white">{rec.action}</strong>
                        <span className={`badge bg-${rec.priority === "high" ? "danger" : "warning"}`}>
                          {rec.priority}
                        </span>
                      </div>
                      <small className="text-secondary d-block mt-1">{rec.reason}</small>
                      <small className="text-info d-block">{rec.expected_impact}</small>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="alert alert-danger mt-3">
          <i className="bi bi-exclamation-triangle me-2"></i>{error}
        </div>
      )}
    </div>
  );
}
