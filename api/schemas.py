from pydantic import BaseModel, Field, field_validator
from typing import Literal, Optional


# ── Customer Input Schema ──
# Field names and types match the preprocessed dataset expectations after normalization
# Constraints derived from EDA findings and preprocessing steps
class CustomerInput(BaseModel):
    gender: Literal["Male", "Female"]
    SeniorCitizen: Literal[0, 1]
    Partner: Literal["Yes", "No"]
    Dependents: Literal["Yes", "No"]
    tenure: int = Field(..., ge=0, le=100, description="Months as customer (0-100)")
    PhoneService: Literal["Yes", "No"]
    MultipleLines: Literal["Yes", "No"]
    InternetService: Literal["DSL", "Fiber optic", "No"]
    OnlineSecurity: Literal["Yes", "No"]
    OnlineBackup: Literal["Yes", "No"]
    DeviceProtection: Literal["Yes", "No"]
    TechSupport: Literal["Yes", "No"]
    StreamingTV: Literal["Yes", "No"]
    StreamingMovies: Literal["Yes", "No"]
    Contract: Literal["Month-to-month", "One year", "Two year"]
    PaperlessBilling: Literal["Yes", "No"]
    PaymentMethod: Literal[
        "Electronic check",
        "Mailed check",
        "Bank transfer (automatic)",
        "Credit card (automatic)"
    ]
    MonthlyCharges: float = Field(..., ge=0.0, le=200.0, description="Monthly bill amount")
    TotalCharges: float = Field(..., ge=0.0, description="Total billed")

    @field_validator("TotalCharges")
    @classmethod
    def validate_total_charges(cls, v, info):
        if v < 0:
            raise ValueError("TotalCharges cannot be negative")
        return v

    model_config = {
        "json_schema_extra": {
            "example": {
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
        }
    }


# Legacy alias for backward compatibility
ChurnPredictRequest = CustomerInput


# ── Prediction Response ──
class PredictionResponse(BaseModel):
    churn_prediction: int = Field(..., description="0 = No churn, 1 = Churn")
    churn_probability: float = Field(..., description="Probability of churn (0.0 to 1.0)")
    risk_label: str = Field(..., description="Risk tier: Low / Medium / High")
    needs_review: bool = Field(False, description="Flagged for human review (0.45-0.55)")
    stage_used: str = Field("stage1", description="Which model produced the final prediction")


# Legacy alias
ChurnPredictResponse = PredictionResponse


# ── Batch ──
class BatchPredictRequest(BaseModel):
    customers: list[CustomerInput] = Field(
        ..., min_length=1, max_length=500,
        description="List of 1 to 500 customer records"
    )

class BatchPredictResponse(BaseModel):
    predictions: list[PredictionResponse]
    total_customers: int
    predicted_churners: int


# ── Explain Response ──
class FeatureExplanation(BaseModel):
    feature: str
    shap_value: float
    impact: float

class RescuePlan(BaseModel):
    strategy: str
    plan: str
    script: str
    is_ai_generated: bool


class ExplainResponse(BaseModel):
    prediction: PredictionResponse
    top_features: list[FeatureExplanation]
    recommendations: list[dict]
    rescue_plan: Optional[RescuePlan] = None


# ── What-If ──
class WhatIfRequest(BaseModel):
    original: CustomerInput
    modified: CustomerInput

class WhatIfResponse(BaseModel):
    original_probability: float
    modified_probability: float
    probability_change: float
    original_risk: str
    modified_risk: str
    risk_changed: bool


class FeatureShift(BaseModel):
    feature: str
    percentage_change: float


class GlobalSimulationRequest(BaseModel):
    shifts: list[FeatureShift]


class GlobalSimulationResponse(BaseModel):
    original_churn_count: int
    modified_churn_count: int
    original_churn_rate: float
    modified_churn_rate: float
    change_count: int
    change_percentage: float
    math_details: str


# ── Drift ──
class DriftRequest(BaseModel):
    customers: list[CustomerInput] = Field(
        ..., min_length=2, max_length=1000,
        description="Batch of customer data to check for drift"
    )

class DriftFeatureInfo(BaseModel):
    feature_idx: int
    train_mean: float
    new_mean: float
    z_score: float

class DriftResponse(BaseModel):
    drift_detected: bool
    num_drifted_features: int
    severity: str
    drifted_features: list[DriftFeatureInfo]


# ── Utility ──
class HealthResponse(BaseModel):
    status: str
    model_loaded: bool

class ModelInfoResponse(BaseModel):
    model_type: str
    model_path: str
    description: str
    optimal_threshold: float