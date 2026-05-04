import sys
import os
import pandas as pd
import numpy as np
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware

# Add src/ to path so we can import AI modules
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, os.path.join(PROJECT_ROOT, "src"))

from api.schemas import (
    CustomerInput, PredictionResponse,
    BatchPredictRequest, BatchPredictResponse,
    ExplainResponse, FeatureExplanation, RescuePlan,
    WhatIfRequest, WhatIfResponse,
    GlobalSimulationRequest, GlobalSimulationResponse,
    DriftRequest, DriftResponse,
    HealthResponse, ModelInfoResponse,
)
from api.model_loader import (
    load_models_at_startup, get_stage1_model, get_stage2_model,
    get_model_path, get_optimal_threshold,
)

# Import AI modules from src/
from segment import get_risk_tier, needs_human_review, is_uncertain
from recommend import generate_recommendations
from drift import DriftDetector
from simulation import get_simulator
from llm import generate_rescue_plan


# ── Model paths ──
STAGE1_PATH = os.path.join(PROJECT_ROOT, "models", "logistic_model.pkl")
STAGE2_PATH = os.path.join(PROJECT_ROOT, "models", "xgboost_model.pkl")
METADATA_PATH = os.path.join(PROJECT_ROOT, "models", "metadata.json")

# Drift detector (initialized after model load)
_drift_detector = None


# ── Lifespan: load models once at startup ──
@asynccontextmanager
async def lifespan(app: FastAPI):
    global _drift_detector
    
    import json
    optimal_threshold = 0.5
    if os.path.exists(METADATA_PATH):
        with open(METADATA_PATH, "r") as f:
            metadata = json.load(f)
            optimal_threshold = metadata.get("optimal_threshold", 0.5)
            
    load_models_at_startup(STAGE1_PATH, STAGE2_PATH, optimal_threshold)

    # Initialize drift detector with training data statistics
    try:
        from data_load import load_data
        from preprocess import prepare_data
        df = load_data()
        X_train, _, _, _, _, _, preprocessor = prepare_data(df)
        X_train_transformed = get_stage1_model().named_steps["preprocess"].transform(X_train)
        _drift_detector = DriftDetector(X_train_transformed)
        print("[startup] Drift detector initialized with training data statistics")
    except Exception as e:
        print(f"[startup] Drift detector init failed (non-critical): {e}")

    # Initialize simulator
    try:
        get_simulator().initialize()
        print("[startup] Global simulator initialized")
    except Exception as e:
        print(f"[startup] Simulator init failed: {e}")

    yield


app = FastAPI(
    title="ChurnMetrics AI Engine",
    description=(
        "Two-stage cascade churn prediction engine with SHAP explainability, "
        "what-if simulation, and drift detection. "
        "Serves as the AI microservice consumed by the Express.js orchestration layer."
    ),
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# CORS: allow Express backend to call us
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Exception Handlers ──

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for err in exc.errors():
        errors.append({
            "field": " -> ".join(str(loc) for loc in err["loc"]),
            "issue": err["msg"],
            "input": err.get("input")
        })
    return JSONResponse(
        status_code=422,
        content={"error": "Input validation failed", "details": errors}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "detail": str(exc)}
    )


# ── Helpers ──

def build_dataframe(customer: CustomerInput) -> pd.DataFrame:
    """Convert Pydantic model to single-row DataFrame matching training schema."""
    return pd.DataFrame([customer.model_dump()])

def normalize_input(df: pd.DataFrame) -> pd.DataFrame:
    """Apply the same normalization as in preprocessing for consistency."""
    from preprocess import normalize_service_categories, convert_total_charges
    df = df.copy()
    
    # Use the centralized logic from src/preprocess.py
    df = normalize_service_categories(df)
    df = convert_total_charges(df)
    
    return df

def cascade_predict_single(df: pd.DataFrame):
    """
    Two-stage cascade prediction.
    Stage 1: Logistic Regression → if uncertain (0.30-0.70) → Stage 2: XGBoost.
    """
    stage1 = get_stage1_model()
    stage2 = get_stage2_model()
    threshold = get_optimal_threshold()

    # Stage 1 probability
    prob = float(stage1.predict_proba(df)[0][1])
    stage_used = "stage1"

    # If uncertain, refine with Stage 2
    if is_uncertain(prob) and stage2 is not None:
        prob = float(stage2.predict_proba(df)[0][1])
        stage_used = "stage2"

    # Apply optimized threshold
    prediction = 1 if prob >= threshold else 0
    risk = get_risk_tier(prob)
    review = needs_human_review(prob)

    return prediction, prob, risk, review, stage_used

def cascade_predict_batch(df: pd.DataFrame):
    """Batch cascade prediction."""
    stage1 = get_stage1_model()
    stage2 = get_stage2_model()
    threshold = get_optimal_threshold()

    # Stage 1 probabilities
    probs = stage1.predict_proba(df)[:, 1].astype(float)
    stages = ["stage1"] * len(probs)

    # Refine uncertain cases with Stage 2
    if stage2 is not None:
        uncertain_mask = np.array([is_uncertain(p) for p in probs])
        if uncertain_mask.any():
            stage2_probs = stage2.predict_proba(df[uncertain_mask])[:, 1]
            probs[uncertain_mask] = stage2_probs
            for i, idx in enumerate(np.where(uncertain_mask)[0]):
                stages[idx] = "stage2"

    predictions = (probs >= threshold).astype(int)
    risks = [get_risk_tier(p) for p in probs]
    reviews = [needs_human_review(p) for p in probs]

    return predictions, probs, risks, reviews, stages


# ── Endpoints ──

# Health check
@app.get("/health", response_model=HealthResponse, tags=["Utility"])
def health():
    try:
        get_stage1_model()
        loaded = True
    except RuntimeError:
        loaded = False
    return HealthResponse(status="ok" if loaded else "degraded", model_loaded=loaded)


# Model metadata
@app.get("/model-info", response_model=ModelInfoResponse, tags=["Utility"])
def model_info():
    stage1 = get_stage1_model()
    return ModelInfoResponse(
        model_type=type(stage1.named_steps["classifier"]).__name__,
        model_path=get_model_path(),
        description="Two-stage cascade: Logistic Regression (primary) + XGBoost (refinement for uncertain cases)",
        optimal_threshold=get_optimal_threshold(),
    )


# Single prediction (cascade)
@app.post("/predict", response_model=PredictionResponse, tags=["Prediction"])
def predict(customer: CustomerInput):
    df = build_dataframe(customer)
    df = normalize_input(df)

    try:
        prediction, prob, risk, review, stage = cascade_predict_single(df)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model inference failed: {str(e)}")

    return PredictionResponse(
        churn_prediction=prediction,
        churn_probability=round(prob, 4),
        risk_label=risk,
        needs_review=review,
        stage_used=stage,
    )


# Batch prediction
@app.post("/predict/batch", response_model=BatchPredictResponse, tags=["Prediction"])
def predict_batch(request: BatchPredictRequest):
    rows = [c.model_dump() for c in request.customers]
    df = pd.DataFrame(rows)
    df = normalize_input(df)

    try:
        predictions, probs, risks, reviews, stages = cascade_predict_batch(df)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch inference failed: {str(e)}")

    results = [
        PredictionResponse(
            churn_prediction=int(p),
            churn_probability=round(float(prob), 4),
            risk_label=risk,
            needs_review=review,
            stage_used=stage,
        )
        for p, prob, risk, review, stage in zip(predictions, probs, risks, reviews, stages)
    ]

    return BatchPredictResponse(
        predictions=results,
        total_customers=len(results),
        predicted_churners=sum(r.churn_prediction for r in results),
    )


# Prediction with SHAP explanation
@app.post("/predict/explain", response_model=ExplainResponse, tags=["Explainability"])
def predict_explain(customer: CustomerInput):
    df = build_dataframe(customer)
    df = normalize_input(df)

    # Get cascade prediction
    prediction, prob, risk, review, stage = cascade_predict_single(df)

    # Compute SHAP values using the model that made the final decision
    try:
        from explain import compute_shap_values, get_top_features

        model = get_stage2_model() if stage == "stage2" and get_stage2_model() is not None else get_stage1_model()

        shap_vals, base_val, X_transformed = compute_shap_values(model, df, num_samples=50)

        # Get feature names from preprocessor
        preprocessor = model.named_steps["preprocess"]
        feature_names = []
        for name, transformer, columns in preprocessor.transformers_:
            if name == "num":
                feature_names.extend(columns)
            elif name == "cat":
                encoder = transformer.named_steps["encoder"]
                feature_names.extend(encoder.get_feature_names_out(columns).tolist())

        top = get_top_features(shap_vals, feature_names, top_k=5)
        top_features = [FeatureExplanation(**f) for f in top]
    except Exception as e:
        # SHAP can fail on edge cases; return prediction without explanation
        top_features = []
        print(f"[explain] SHAP computation failed: {e}")

    # Generate recommendations
    rec_input = {
        "churn_probability": prob,
        "risk_label": risk,
        "MonthlyCharges": customer.MonthlyCharges,
        "tenure": customer.tenure,
        "TechSupport": customer.TechSupport,
        "Contract": customer.Contract,
        "InternetService": customer.InternetService,
    }
    recommendations = generate_recommendations(rec_input)

    # Generate Rescue Plan (LLM-enhanced)
    rescue_plan = None
    if prediction == 1 and top_features:
        try:
            # We only generate plan if churn is predicted and we have features
            raw_plan = generate_rescue_plan(customer.model_dump(), [f.model_dump() for f in top_features])
            rescue_plan = RescuePlan(**raw_plan)
        except Exception as e:
            print(f"[LLM] Rescue plan creation failed: {e}")

    return ExplainResponse(
        prediction=PredictionResponse(
            churn_prediction=prediction,
            churn_probability=round(prob, 4),
            risk_label=risk,
            needs_review=review,
            stage_used=stage,
        ),
        top_features=top_features,
        recommendations=recommendations,
        rescue_plan=rescue_plan,
    )


# What-If simulation
# Global Simulation (Mathematically Deduced)
@app.post("/predict/simulate-global", response_model=GlobalSimulationResponse, tags=["Simulation"])
def simulate_global(request: GlobalSimulationRequest):
    try:
        simulator = get_simulator()
        result = simulator.simulate_shift(request.shifts)
        return GlobalSimulationResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Global simulation failed: {str(e)}")


# Drift detection
@app.post("/drift", response_model=DriftResponse, tags=["Monitoring"])
def check_drift(request: DriftRequest):
    if _drift_detector is None:
        raise HTTPException(status_code=503, detail="Drift detector not initialized")

    rows = [c.model_dump() for c in request.customers]
    df = pd.DataFrame(rows)
    df = normalize_input(df)

    try:
        stage1 = get_stage1_model()
        X_transformed = stage1.named_steps["preprocess"].transform(df)
        result = _drift_detector.detect_drift(X_transformed)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Drift detection failed: {str(e)}")

    return DriftResponse(**result)


# Timed prediction (for performance testing)
@app.post("/predict/timed", tags=["Performance"])
def predict_timed(customer: CustomerInput):
    df = build_dataframe(customer)
    df = normalize_input(df)

    start = time.perf_counter()
    prediction, prob, risk, review, stage = cascade_predict_single(df)
    elapsed_ms = round((time.perf_counter() - start) * 1000, 3)

    return {
        "churn_prediction": prediction,
        "churn_probability": round(prob, 4),
        "risk_label": risk,
        "needs_review": review,
        "stage_used": stage,
        "inference_latency_ms": elapsed_ms,
    }