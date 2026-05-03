# ROC-based threshold optimization
from sklearn.metrics import roc_curve


def optimize_threshold_for_recall(y_true, y_probs, target_recall=0.85):
    """
    Find optimal threshold that achieves target recall.
    Useful for churn detection where high recall (catching churners) is critical.
    """
    fpr, tpr, thresholds = roc_curve(y_true, y_probs)

    # Find threshold closest to target recall
    idx = min(range(len(tpr)), key=lambda i: abs(tpr[i] - target_recall))
    optimal_threshold = thresholds[idx]

    return optimal_threshold, tpr[idx], fpr[idx]


def apply_threshold(probabilities, threshold=0.5):
    """Convert probabilities to binary predictions using custom threshold."""
    return (probabilities >= threshold).astype(int)
