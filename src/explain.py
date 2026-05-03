# SHAP-based explainability for individual predictions
import shap
import numpy as np


def compute_shap_values(model, X_sample, num_samples=100):
    """
    Compute SHAP values for prediction explanations.

    Args:
        model: sklearn Pipeline with preprocessor + classifier
        X_sample: Input features (can be single row or batch)
        num_samples: Samples for SHAP kernel explainer (lower = faster)

    Returns:
        shap_values, base_value, feature_names
    """
    try:
        # Get preprocessed features
        X_transformed = model.named_steps["preprocess"].transform(X_sample)
        clf = model.named_steps["classifier"]

        # Use TreeExplainer if XGBoost, else KernelExplainer
        if hasattr(clf, "get_booster"):  # XGBoost
            explainer = shap.TreeExplainer(clf)
        else:  # Logistic Regression or other
            # Use a zero-baseline for KernelExplainer to ensure non-zero relative impact
            background = np.zeros((1, X_transformed.shape[1]))
            explainer = shap.KernelExplainer(
                lambda x: clf.predict_proba(x)[:, 1],
                background
            )

        shap_vals = explainer.shap_values(X_transformed)

        # Handle SHAP output format differences
        if isinstance(shap_vals, list):
            shap_vals = shap_vals[1]  # Class 1 (churn)

        return shap_vals, explainer.expected_value, X_transformed
    except Exception as e:
        raise RuntimeError(f"SHAP computation failed: {str(e)}")


def get_top_features(shap_values, feature_names, top_k=5):
    """
    Extract top contributing features from SHAP values.

    Returns list of (feature_name, shap_value) sorted by absolute impact.
    """
    if len(shap_values.shape) == 1:
        abs_impacts = np.abs(shap_values)
    else:
        abs_impacts = np.abs(shap_values[0])

    top_indices = np.argsort(abs_impacts)[-top_k:][::-1]

    result = []
    for idx in top_indices:
        result.append({
            "feature": feature_names[idx],
            "shap_value": float(shap_values[idx] if len(shap_values.shape) == 1 else shap_values[0][idx]),
            "impact": float(abs_impacts[idx])
        })

    return result
