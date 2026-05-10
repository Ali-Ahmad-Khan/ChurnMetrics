import { useState } from "react";
import { runPrediction } from "../services/api";
import { useReveal } from "../hooks/useReveal";
import ReasonAndRescue from "../components/ReasonAndRescue";

const INITIAL_FORM = {
  gender: "Female",
  SeniorCitizen: 0,
  Partner: "No",
  Dependents: "No",
  tenure: 1,
  PhoneService: "Yes",
  MultipleLines: "No",
  InternetService: "DSL",
  OnlineSecurity: "No",
  OnlineBackup: "No",
  DeviceProtection: "No",
  TechSupport: "No",
  StreamingTV: "No",
  StreamingMovies: "No",
  Contract: "Month-to-month",
  PaperlessBilling: "Yes",
  PaymentMethod: "Electronic check",
  MonthlyCharges: 50.0,
  TotalCharges: 50.0
};

export default function Predict() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const revealRef = useReveal();

  const handleChange = (e) => {
    const val = e.target.type === "number" ? Number(e.target.value) : e.target.value;
    setForm({ ...form, [e.target.name]: val });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await runPrediction(form);
      setResult(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reveal" ref={revealRef}>
      <div className="panel-header mb-4">
        <div>
          <h1 className="panel-title fs-2">Risk Prediction Engine</h1>
          <p className="text-secondary small">Input customer parameters to generate high-precision risk scores and behavioral reasoning.</p>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-5">
          <div className="card-custom">
            <h2 className="panel-title mb-4">Customer Profile</h2>
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label small text-secondary fw-bold">Gender</label>
                  <select name="gender" className="form-input-custom" value={form.gender} onChange={handleChange}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label small text-secondary fw-bold">Senior Citizen</label>
                  <select name="SeniorCitizen" className="form-input-custom" value={form.SeniorCitizen} onChange={handleChange}>
                    <option value={0}>No</option>
                    <option value={1}>Yes</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label small text-secondary fw-bold">Partner</label>
                  <select name="Partner" className="form-input-custom" value={form.Partner} onChange={handleChange}>
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label small text-secondary fw-bold">Dependents</label>
                  <select name="Dependents" className="form-input-custom" value={form.Dependents} onChange={handleChange}>
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label small text-secondary fw-bold">Tenure (Months)</label>
                  <input type="number" name="tenure" className="form-input-custom" value={form.tenure} onChange={handleChange} min="0" max="100" />
                </div>
                <div className="col-md-6">
                  <label className="form-label small text-secondary fw-bold">Phone Service</label>
                  <select name="PhoneService" className="form-input-custom" value={form.PhoneService} onChange={handleChange}>
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label small text-secondary fw-bold">Multiple Lines</label>
                  <select name="MultipleLines" className="form-input-custom" value={form.MultipleLines} onChange={handleChange}>
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                    <option value="No phone service">No phone service</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label small text-secondary fw-bold">Internet Service</label>
                  <select name="InternetService" className="form-input-custom" value={form.InternetService} onChange={handleChange}>
                    <option value="DSL">DSL</option>
                    <option value="Fiber optic">Fiber optic</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label small text-secondary fw-bold">Online Security</label>
                  <select name="OnlineSecurity" className="form-input-custom" value={form.OnlineSecurity} onChange={handleChange}>
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                    <option value="No internet service">No internet service</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label small text-secondary fw-bold">Online Backup</label>
                  <select name="OnlineBackup" className="form-input-custom" value={form.OnlineBackup} onChange={handleChange}>
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                    <option value="No internet service">No internet service</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label small text-secondary fw-bold">Contract</label>
                  <select name="Contract" className="form-input-custom" value={form.Contract} onChange={handleChange}>
                    <option value="Month-to-month">Month-to-month</option>
                    <option value="One year">One year</option>
                    <option value="Two year">Two year</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label small text-secondary fw-bold">Payment Method</label>
                  <select name="PaymentMethod" className="form-input-custom" value={form.PaymentMethod} onChange={handleChange}>
                    <option value="Electronic check">Electronic check</option>
                    <option value="Mailed check">Mailed check</option>
                    <option value="Bank transfer (automatic)">Bank transfer (automatic)</option>
                    <option value="Credit card (automatic)">Credit card (automatic)</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label small text-secondary fw-bold">Monthly Charges ($)</label>
                  <input type="number" name="MonthlyCharges" className="form-input-custom" value={form.MonthlyCharges} onChange={handleChange} step="0.01" />
                </div>
                <div className="col-md-6">
                  <label className="form-label small text-secondary fw-bold">Total Charges ($)</label>
                  <input type="number" name="TotalCharges" className="form-input-custom" value={form.TotalCharges} onChange={handleChange} step="0.01" />
                </div>

                <div className="col-12 mt-4">
                  <button type="submit" className="btn-primary-custom w-100" disabled={loading}>
                    {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-lightning-charge me-2"></i>}
                    {loading ? "Analyzing..." : "Generate Prediction"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        <div className="col-lg-7">
          {result ? (
            <div className="reveal-group visible">
              <div className="card-custom text-center py-5 mb-4">
                <div className="text-secondary small mb-2">Churn Probability</div>
                <div 
                  className="display-1 fw-bold mb-3" 
                  style={{ color: result.prediction.churnProbability > 0.5 ? 'var(--accent)' : 'var(--text-primary)' }}
                >
                  {(result.prediction.churnProbability * 100).toFixed(1)}%
                </div>
                <span className={`badge-custom ${result.prediction.churnPrediction === 1 ? 'badge-danger' : 'badge-success'}`}>
                  {result.prediction.churnPrediction === 1 ? 'High Risk' : 'Low Risk'}
                </span>
              </div>
              
              <ReasonAndRescue prediction={result} />
            </div>
          ) : (
            <div className="card-custom h-100 d-flex flex-column align-items-center justify-content-center text-center py-5 border-dashed" style={{ borderStyle: 'dashed' }}>
              <i className="bi bi-cpu text-muted" style={{ fontSize: '4rem', opacity: 0.2 }}></i>
              <h3 className="mt-4 text-secondary">Ready for Analysis</h3>
              <p className="text-muted small max-width-300">Complete the customer profile on the left to generate predictive insights.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
