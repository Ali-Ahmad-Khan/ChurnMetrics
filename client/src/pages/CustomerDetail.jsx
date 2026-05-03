import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";
import { getCustomerById, predictSingle } from "../services/api";
import api from "../services/api";
import ReasonAndRescue from "../components/ReasonAndRescue";

function InfoRow({ label, value, icon }) {
  return (
    <div className="col-md-4 mb-3">
      <div className="d-flex align-items-center gap-2">
        {icon && <i className={`bi ${icon} text-info`}></i>}
        <div>
          <small className="text-secondary d-block">{label}</small>
          <span className="text-white fw-bold">{value}</span>
        </div>
      </div>
    </div>
  );
}

export default function CustomerDetail() {
  const { id } = useParams();
  const [prediction, setPrediction] = useState(null);
  const [predicting, setPredicting] = useState(false);

  const { data: customer, loading, error } = useFetch(
    () => getCustomerById(id),
    [id]
  );

  const runAnalysis = async () => {
    setPredicting(true);
    try {
      // Sanitize customer object to match FastAPI schema
      const { _id, __v, createdAt, updatedAt, ...cleanCustomer } = customer;
      const res = await predictSingle(cleanCustomer);
      setPrediction(res.data);
    } catch (err) {
      console.error("Analysis failed:", err);
    } finally {
      setPredicting(false);
    }
  };

  if (loading)
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-info"></div>
      </div>
    );
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!customer) return <div className="alert alert-warning">Customer not found</div>;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="text-white fw-bold mb-0">
            <i className="bi bi-person-circle me-2 text-info"></i>
            Customer: {customer.customerID}
          </h2>
          <p className="text-secondary mb-0">Full customer profile</p>
        </div>
        <div className="d-flex gap-2">
          <Link to="/customers" className="btn btn-outline-secondary">
            <i className="bi bi-arrow-left me-1"></i> Back
          </Link>
          <button 
            className="btn btn-info" 
            onClick={runAnalysis} 
            disabled={predicting}
          >
            {predicting ? (
              <><span className="spinner-border spinner-border-sm me-2"></span>Analyzing...</>
            ) : (
              <><i className="bi bi-stars me-1"></i>AI Risk Analysis</>
            )}
          </button>
        </div>
      </div>

      {/* AI Analysis Result */}
      {prediction && (
        <ReasonAndRescue 
          topFeatures={prediction.top_features} 
          rescuePlan={prediction.rescue_plan}
          churnPrediction={prediction.prediction.churn_prediction}
        />
      )}

      {/* Status */}
      <div className="card bg-dark border-secondary mb-4">
        <div className="card-header border-secondary d-flex justify-content-between align-items-center">
          <h6 className="text-white mb-0">Customer Status</h6>
          <span
            className={`badge bg-${customer.Churn === "Yes" ? "danger" : "success"} fs-6`}
          >
            {customer.Churn === "Yes" ? "Churned" : "Active"}
          </span>
        </div>
      </div>

      {/* Demographics */}
      <div className="card bg-dark border-secondary mb-4">
        <div className="card-header border-secondary">
          <h6 className="text-white mb-0">
            <i className="bi bi-person me-2 text-info"></i>Demographics
          </h6>
        </div>
        <div className="card-body">
          <div className="row">
            <InfoRow label="Gender" value={customer.gender} icon="bi-gender-ambiguous" />
            <InfoRow label="Senior Citizen" value={customer.SeniorCitizen ? "Yes" : "No"} icon="bi-star" />
            <InfoRow label="Partner" value={customer.Partner} icon="bi-heart" />
            <InfoRow label="Dependents" value={customer.Dependents} icon="bi-people" />
            <InfoRow label="Tenure" value={`${customer.tenure} months`} icon="bi-calendar-range" />
          </div>
        </div>
      </div>

      {/* Services */}
      <div className="card bg-dark border-secondary mb-4">
        <div className="card-header border-secondary">
          <h6 className="text-white mb-0">
            <i className="bi bi-wifi me-2 text-info"></i>Services
          </h6>
        </div>
        <div className="card-body">
          <div className="row">
            <InfoRow label="Phone Service" value={customer.PhoneService} />
            <InfoRow label="Multiple Lines" value={customer.MultipleLines} />
            <InfoRow label="Internet Service" value={customer.InternetService} />
            <InfoRow label="Online Security" value={customer.OnlineSecurity} />
            <InfoRow label="Online Backup" value={customer.OnlineBackup} />
            <InfoRow label="Device Protection" value={customer.DeviceProtection} />
            <InfoRow label="Tech Support" value={customer.TechSupport} />
            <InfoRow label="Streaming TV" value={customer.StreamingTV} />
            <InfoRow label="Streaming Movies" value={customer.StreamingMovies} />
          </div>
        </div>
      </div>

      {/* Billing */}
      <div className="card bg-dark border-secondary">
        <div className="card-header border-secondary">
          <h6 className="text-white mb-0">
            <i className="bi bi-credit-card me-2 text-info"></i>Billing
          </h6>
        </div>
        <div className="card-body">
          <div className="row">
            <InfoRow label="Contract" value={customer.Contract} icon="bi-file-earmark-text" />
            <InfoRow label="Paperless Billing" value={customer.PaperlessBilling} icon="bi-envelope" />
            <InfoRow label="Payment Method" value={customer.PaymentMethod} icon="bi-wallet2" />
            <InfoRow label="Monthly Charges" value={`$${customer.MonthlyCharges?.toFixed(2)}`} icon="bi-cash" />
            <InfoRow label="Total Charges" value={`$${customer.TotalCharges?.toFixed(2)}`} icon="bi-cash-stack" />
          </div>
        </div>
      </div>
    </div>
  );
}
