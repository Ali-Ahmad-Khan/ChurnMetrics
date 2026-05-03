import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

import pytest
from fastapi.testclient import TestClient
from api.main import app
from api.model_loader import load_model_at_startup

# Load the model for testing
load_model_at_startup("models/logistic_model.pkl")

# This is done because TestClient wrapping of the app doesn't require the server running
client = TestClient(app)

# Reusable valid customer payload matching the schema constraints
VALID_CUSTOMER = {
    "gender": "Female",
    "SeniorCitizen": 0,
    "Partner": "Yes",
    "Dependents": "No",
    "tenure": 12,
    "PhoneService": "Yes",
    "MultipleLines": "No",
    "InternetService": "DSL",
    "OnlineSecurity": "No",
    "OnlineBackup": "Yes",
    "DeviceProtection": "No",
    "TechSupport": "No",
    "StreamingTV": "No",
    "StreamingMovies": "No",
    "Contract": "Month-to-month",
    "PaperlessBilling": "Yes",
    "PaymentMethod": "Electronic check",
    "MonthlyCharges": 65.5,
    "TotalCharges": 786.0
}


# Health & Info

def test_health_endpoint_returns_ok():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["model_loaded"] is True

def test_model_info_endpoint():
    response = client.get("/model-info")
    assert response.status_code == 200
    data = response.json()
    assert "model_type" in data
    assert "model_path" in data


# Single Prediction

def test_predict_valid_input_returns_200():
    response = client.post("/predict", json=VALID_CUSTOMER)
    assert response.status_code == 200

def test_predict_response_schema():
    response = client.post("/predict", json=VALID_CUSTOMER)
    data = response.json()
    assert "churn_prediction" in data
    assert "churn_probability" in data
    assert "risk_label" in data
    assert data["churn_prediction"] in [0, 1]
    assert 0.0 <= data["churn_probability"] <= 1.0
    assert data["risk_label"] in ["Low", "Medium", "High"]

def test_predict_new_customer_zero_total_charges():
    # New customers (tenure=0) may have zero TotalCharges so it must not crash
    payload = {**VALID_CUSTOMER, "tenure": 0, "TotalCharges": 0.0}
    response = client.post("/predict", json=payload)
    assert response.status_code == 200

def test_predict_senior_citizen_edge_case():
    payload = {**VALID_CUSTOMER, "SeniorCitizen": 1, "tenure": 72, "Contract": "Two year"}
    response = client.post("/predict", json=payload)
    assert response.status_code == 200


# Validation and Robustness

def test_predict_missing_required_field_returns_422():
    # 'tenure' is required and omitting it should trigger validation error
    payload = {k: v for k, v in VALID_CUSTOMER.items() if k != "tenure"}
    response = client.post("/predict", json=payload)
    assert response.status_code == 422

def test_predict_invalid_gender_returns_422():
    payload = {**VALID_CUSTOMER, "gender": "Other"}
    response = client.post("/predict", json=payload)
    assert response.status_code == 422

def test_predict_negative_tenure_returns_422():
    payload = {**VALID_CUSTOMER, "tenure": -5}
    response = client.post("/predict", json=payload)
    assert response.status_code == 422

def test_predict_out_of_range_monthly_charges_returns_422():
    payload = {**VALID_CUSTOMER, "MonthlyCharges": 9999.0}
    response = client.post("/predict", json=payload)
    assert response.status_code == 422

def test_predict_invalid_contract_type_returns_422():
    payload = {**VALID_CUSTOMER, "Contract": "Weekly"}
    response = client.post("/predict", json=payload)
    assert response.status_code == 422

def test_predict_empty_body_returns_422():
    response = client.post("/predict", json={})
    assert response.status_code == 422

def test_predict_wrong_content_type_returns_422():
    # Sending malformed JSON
    response = client.post("/predict", content='{"invalid": }', headers={"Content-Type": "application/json"})
    assert response.status_code == 422


# Batch Prediction

def test_batch_predict_single_customer():
    response = client.post("/predict/batch", json={"customers": [VALID_CUSTOMER]})
    assert response.status_code == 200
    data = response.json()
    assert data["total_customers"] == 1
    assert len(data["predictions"]) == 1

def test_batch_predict_multiple_customers():
    response = client.post("/predict/batch", json={"customers": [VALID_CUSTOMER] * 5})
    assert response.status_code == 200
    data = response.json()
    assert data["total_customers"] == 5
    assert "predicted_churners" in data

def test_batch_predict_empty_list_returns_422():
    # min_length=1 on the list so it is  empty and should be rejected
    response = client.post("/predict/batch", json={"customers": []})
    assert response.status_code == 422

def test_batch_predict_invalid_customer_in_list():
    bad_customer = {**VALID_CUSTOMER, "tenure": -1}
    response = client.post("/predict/batch", json={"customers": [bad_customer]})
    assert response.status_code == 422


# Timed endpoint for latency checks

def test_timed_predict_returns_latency():
    response = client.post("/predict/timed", json=VALID_CUSTOMER)
    assert response.status_code == 200
    data = response.json()
    assert "inference_latency_ms" in data
    assert data["inference_latency_ms"] >= 0