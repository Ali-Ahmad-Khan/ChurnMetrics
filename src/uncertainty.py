# Two-stage cascade: Route uncertain predictions to Stage 2 for refinement
from segment import is_uncertain


def apply_cascade(stage1_probs, stage1_model, stage2_model, X_data):
    """
    Two-stage prediction cascade.
    Stage 1: Logistic Regression (fast primary filter)
    Stage 2: XGBoost (applied only to uncertain cases 0.30-0.70)

    Returns final probabilities after cascade.
    """
    final_probs = stage1_probs.copy()
    uncertain_mask = [is_uncertain(p) for p in stage1_probs]

    if any(uncertain_mask):
        X_uncertain = X_data[uncertain_mask]
        stage2_probs = stage2_model.predict_proba(X_uncertain)[:, 1]
        final_probs[uncertain_mask] = stage2_probs

    return final_probs
