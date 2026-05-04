# Risk Segmentation: converts raw churn probability into business-readable tier


LOW_THRESHOLD = 0.30
HIGH_THRESHOLD = 0.80

# Human-in-the-loop review band (boundary cases that need manual inspection)
REVIEW_LOWER = 0.45
REVIEW_UPPER = 0.55


def get_risk_tier(probability: float) -> str:
    if probability < LOW_THRESHOLD:
        return "Low"
    elif probability < HIGH_THRESHOLD:
        return "Medium"
    return "High"


def needs_human_review(probability: float) -> bool:
    return REVIEW_LOWER <= probability <= REVIEW_UPPER


def is_uncertain(probability: float) -> bool:
    """Cases in the 0.30-0.70 band are routed to Stage 2 for refinement."""
    return LOW_THRESHOLD <= probability <= HIGH_THRESHOLD
