# Rule-based recommendation engine
from segment import get_risk_tier


def generate_recommendations(prediction_dict):
    """
    Generate actionable business recommendations based on prediction and customer profile.

    Args:
        prediction_dict: Dict with keys: churn_probability, risk_label, MonthlyCharges, tenure,
                        TechSupport, Contract, InternetService

    Returns:
        List of recommendation dicts with priority and action
    """
    recommendations = []
    prob = prediction_dict.get("churn_probability", 0.5)
    risk = get_risk_tier(prob)
    monthly_charges = prediction_dict.get("MonthlyCharges", 0)
    tenure = prediction_dict.get("tenure", 0)
    tech_support = prediction_dict.get("TechSupport", "No")
    contract = prediction_dict.get("Contract", "Month-to-month")
    internet = prediction_dict.get("InternetService", "No")

    # High-risk + high charges: offer discount
    if risk == "High" and monthly_charges > 65:
        recommendations.append({
            "priority": "high",
            "action": "Offer 15-20% discount on monthly charges",
            "reason": f"High churn risk with charges ${monthly_charges:.2f}/mo",
            "expected_impact": "Reduce churn by improving cost satisfaction"
        })

    # High-risk + low tenure: improve onboarding
    if risk == "High" and tenure < 6:
        recommendations.append({
            "priority": "high",
            "action": "Proactive onboarding + personal outreach",
            "reason": f"Early-tenure customer ({tenure} months) showing high churn signals",
            "expected_impact": "Build relationship before churn decision"
        })

    # No tech support: upsell support plan
    if tech_support == "No" and internet != "No":
        recommendations.append({
            "priority": "medium",
            "action": "Offer technical support plan",
            "reason": "Customer using internet but no support subscribed",
            "expected_impact": "Increase LTV and reduce churn via support",
            "cost": "Low"
        })

    # Month-to-month contract: upsell longer contract
    if contract == "Month-to-month" and risk != "Low":
        recommendations.append({
            "priority": "medium",
            "action": "Incentivize 1-year or 2-year contract commitment",
            "reason": "Month-to-month contracts correlate with higher churn",
            "expected_impact": "Reduce churn by increasing switching cost"
        })

    # Low risk: retain
    if risk == "Low":
        recommendations.append({
            "priority": "low",
            "action": "Loyalty program engagement",
            "reason": "Stable, satisfied customer",
            "expected_impact": "Maintain relationship and increase lifetime value"
        })

    return sorted(recommendations, key=lambda x: {"high": 0, "medium": 1, "low": 2}[x["priority"]])
