import numpy as np
from data_load import load_data
from preprocess import prepare_data
from train import train_logistic, train_xgboost
from evaluate import evaluate
from serialize import save_model
from error_analysis import analyze_errors
from threshold import optimize_threshold_for_recall, apply_threshold
from uncertainty import apply_cascade
from segment import get_risk_tier, needs_human_review
from config import set_seed

# Overall controller: two-stage cascade pipeline


def main():
    # Setting the seed initially for reproducibility
    set_seed()

    df = load_data()

    X_train, X_val, X_test, y_train, y_val, y_test, preprocessor = prepare_data(df)

    # ── Stage 1: Logistic Regression (high recall primary filter) ──
    print("=" * 60)
    print("Stage 1: Training Logistic Regression (primary filter)")
    print("=" * 60)
    log_model = train_logistic(X_train, y_train, preprocessor)

    print("\nStage 1 — Validation Results (default threshold 0.5):")
    log_metrics = evaluate(log_model, X_val, y_val)

    save_model(log_model, "logistic_model.pkl")

    # ── Stage 2: XGBoost (refinement for uncertain cases) ──
    print("\n" + "=" * 60)
    print("Stage 2: Training XGBoost (refinement model)")
    print("=" * 60)
    xgb_model = train_xgboost(X_train, y_train, preprocessor)

    print("\nStage 2 — Standalone Validation Results:")
    xgb_metrics = evaluate(xgb_model, X_val, y_val)

    save_model(xgb_model, "xgboost_model.pkl")

    # ── Two-Stage Cascade ──
    print("\n" + "=" * 60)
    print("Two-Stage Cascade: Combining Stage 1 + Stage 2")
    print("=" * 60)

    # Get Stage 1 probabilities on validation set
    stage1_probs = log_model.predict_proba(X_val)[:, 1]

    # Apply cascade: uncertain cases (0.30-0.70) get re-evaluated by XGBoost
    cascade_probs = apply_cascade(stage1_probs, log_model, xgb_model, X_val)

    # Count how many were routed to Stage 2
    from segment import is_uncertain
    uncertain_count = sum(1 for p in stage1_probs if is_uncertain(p))
    print(f"\nCascade Stats:")
    print(f"  Total samples: {len(stage1_probs)}")
    print(f"  Routed to Stage 2 (uncertain 0.30-0.70): {uncertain_count}")
    print(f"  Kept from Stage 1 (confident): {len(stage1_probs) - uncertain_count}")

    # ── Threshold Optimization (ROC-based) ──
    print("\n" + "=" * 60)
    print("Threshold Optimization (ROC-based, target recall=0.85)")
    print("=" * 60)

    optimal_threshold, achieved_recall, achieved_fpr = optimize_threshold_for_recall(
        y_val, cascade_probs, target_recall=0.85
    )
    print(f"  Optimal threshold: {optimal_threshold:.4f}")
    print(f"  Achieved recall:   {achieved_recall:.4f}")
    print(f"  FPR at threshold:  {achieved_fpr:.4f}")

    # Apply optimized threshold to cascade probabilities
    cascade_preds = apply_threshold(cascade_probs, threshold=optimal_threshold)

    print("\nCascade + Optimized Threshold — Validation Results:")
    cascade_metrics = evaluate_with_arrays(y_val, cascade_preds, cascade_probs)

    # ── Risk Segmentation Summary ──
    print("\n" + "=" * 60)
    print("Risk Segmentation Summary (Validation Set)")
    print("=" * 60)

    risk_counts = {"Low": 0, "Medium": 0, "High": 0}
    review_count = 0
    for prob in cascade_probs:
        tier = get_risk_tier(prob)
        risk_counts[tier] += 1
        if needs_human_review(prob):
            review_count += 1

    for tier, count in risk_counts.items():
        print(f"  {tier} Risk: {count} ({count/len(cascade_probs)*100:.1f}%)")
    print(f"  Flagged for Human Review (0.45-0.55): {review_count}")

    # ── Error Analysis ──
    print("\n" + "=" * 60)
    print("Error Analysis (Stage 1 — Logistic Regression)")
    print("=" * 60)
    analyze_errors(log_model, X_val, y_val)

    # ── Final Test Set Evaluation ──
    print("\n" + "=" * 60)
    print("FINAL: Test Set Evaluation (Cascade + Optimized Threshold)")
    print("=" * 60)

    test_stage1_probs = log_model.predict_proba(X_test)[:, 1]
    test_cascade_probs = apply_cascade(test_stage1_probs, log_model, xgb_model, X_test)
    test_preds = apply_threshold(test_cascade_probs, threshold=optimal_threshold)

    test_metrics = evaluate_with_arrays(y_test, test_preds, test_cascade_probs)

    from serialize import save_metadata
    save_metadata({"optimal_threshold": optimal_threshold})

    print("\n✓ Pipeline complete. Models saved to models/ directory.")
    print(f"  logistic_model.pkl — Stage 1 (Logistic Regression)")
    print(f"  xgboost_model.pkl  — Stage 2 (XGBoost refinement)")
    print(f"  Optimal threshold: {optimal_threshold:.4f} (saved to metadata.json)")

    return {
        "log_metrics": log_metrics,
        "xgb_metrics": xgb_metrics,
        "cascade_metrics": cascade_metrics,
        "test_metrics": test_metrics,
        "optimal_threshold": optimal_threshold,
    }


def evaluate_with_arrays(y_true, y_pred, y_probs):
    """Evaluate using pre-computed predictions and probabilities."""
    from sklearn.metrics import (
        accuracy_score, precision_score, recall_score,
        f1_score, roc_auc_score, confusion_matrix, classification_report
    )

    acc = accuracy_score(y_true, y_pred)
    precision = precision_score(y_true, y_pred)
    recall = recall_score(y_true, y_pred)
    f1 = f1_score(y_true, y_pred)
    roc_auc = roc_auc_score(y_true, y_probs)
    cm = confusion_matrix(y_true, y_pred)

    print(f"  Accuracy:  {acc:.4f}")
    print(f"  Precision: {precision:.4f}")
    print(f"  Recall:    {recall:.4f}")
    print(f"  F1 Score:  {f1:.4f}")
    print(f"  ROC-AUC:   {roc_auc:.4f}")
    print(f"  Confusion Matrix:\n{cm}")
    print(f"  Classification Report:\n{classification_report(y_true, y_pred)}")

    return {
        "accuracy": acc, "precision": precision, "recall": recall,
        "f1": f1, "roc_auc": roc_auc,
    }


if __name__ == "__main__":
    main()