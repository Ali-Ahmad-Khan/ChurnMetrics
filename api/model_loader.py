import joblib
import os
import urllib.request

# This module holds both cascade models in memory, loaded once at API startup
_store = {
    "stage1": None,
    "stage2": None,
    "stage1_path": None,
    "stage2_path": None,
    "optimal_threshold": 0.5,
}


def load_models_at_startup(stage1_path: str, stage2_path: str, optimal_threshold: float = 0.5):
    """Load both cascade models at startup."""
    os.makedirs(os.path.dirname(os.path.abspath(stage1_path)), exist_ok=True)
    
    # Download Stage 1 model if missing
    abs1 = os.path.abspath(stage1_path)
    if not os.path.exists(abs1):
        print(f"[model_loader] Downloading Stage 1 model from Hugging Face to {abs1}...")
        try:
            urllib.request.urlretrieve("https://huggingface.co/datasets/AliAhmadKhan/ChurnMetrics-Models/resolve/main/logistic_model.pkl", abs1)
        except Exception as e:
            raise FileNotFoundError(f"Failed to download Stage 1 model: {e}")
            
    if not os.path.exists(abs1):
        raise FileNotFoundError(f"Stage 1 model not found and could not be downloaded: {abs1}")
    _store["stage1"] = joblib.load(abs1)
    _store["stage1_path"] = abs1
    print(f"[model_loader] Stage 1 (Logistic) loaded from {abs1}")

    # Download Stage 2 model if missing
    abs2 = os.path.abspath(stage2_path)
    if not os.path.exists(abs2):
        print(f"[model_loader] Downloading Stage 2 model from Hugging Face to {abs2}...")
        try:
            urllib.request.urlretrieve("https://huggingface.co/datasets/AliAhmadKhan/ChurnMetrics-Models/resolve/main/xgboost_model.pkl", abs2)
        except Exception as e:
            print(f"[model_loader] Failed to download Stage 2 model: {e}")

    if os.path.exists(abs2):
        _store["stage2"] = joblib.load(abs2)
        _store["stage2_path"] = abs2
        print(f"[model_loader] Stage 2 (XGBoost) loaded from {abs2}")
    else:
        print(f"[model_loader] Stage 2 model not found at {abs2}, running Stage 1 only")

    _store["optimal_threshold"] = optimal_threshold
    print(f"[model_loader] Optimal threshold set to {optimal_threshold}")


def get_stage1_model():
    """Return the primary Logistic Regression model."""
    if _store["stage1"] is None:
        raise RuntimeError("Stage 1 model not loaded. Check server startup logs.")
    return _store["stage1"]


def get_stage2_model():
    """Return the XGBoost refinement model (may be None if not available)."""
    return _store["stage2"]


def get_model_path():
    return _store["stage1_path"]


def get_optimal_threshold():
    return _store["optimal_threshold"]


def get_model_type():
    model = get_stage1_model()
    return type(model.named_steps["classifier"]).__name__


# Legacy compatibility
def load_model_at_startup(model_path: str):
    """Legacy single-model loader."""
    load_models_at_startup(model_path, model_path.replace("logistic", "xgboost"))

def get_model():
    return get_stage1_model()