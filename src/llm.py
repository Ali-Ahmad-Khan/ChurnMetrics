import os
import json
import re
from google import genai
from dotenv import load_dotenv

load_dotenv()

# Setup Gemini — primary LLM
api_key = os.getenv("GOOGLE_API_KEY")
if api_key and api_key != "your_gemini_api_key_here":
    client = genai.Client(api_key=api_key)
    gemini_model_name = "gemini-2.0-flash"
else:
    client = None
    gemini_model_name = None

def _generate_with_gemini(prompt):
    """Generate rescue plan via Gemini cloud API."""
    if not client or not gemini_model_name:
        print("[LLM] Gemini client not configured — GOOGLE_API_KEY missing or placeholder.")
        return None
    try:
        response = client.models.generate_content(
            model=gemini_model_name,
            contents=prompt
        )
        text = response.text
        # Strip markdown fences if present
        text = re.sub(r"```(?:json)?", "", text).strip()
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            return json.loads(match.group())
        print(f"[LLM] Gemini response had no JSON object: {text[:200]}")
    except Exception as e:
        print(f"[LLM] Gemini failed: {e}")
    return None

def generate_rescue_plan(customer_data, churn_drivers):
    """
    Generate a personalized rescue plan using Gemini (live AI).
    Falls back to a rule-based response only if Gemini is unavailable.
    """

    prompt = f"""
    You are a Senior Customer Retention Specialist at a telecom company.
    A machine learning model has flagged this customer as HIGH RISK for churning.
    Generate a targeted 'Rescue Plan' based on their profile and churn drivers.

    CUSTOMER PROFILE:
    - Tenure: {customer_data.get('tenure')} months
    - Monthly Charges: ${customer_data.get('MonthlyCharges')}
    - Contract Type: {customer_data.get('Contract')}
    - Internet Service: {customer_data.get('InternetService')}
    - Tech Support: {customer_data.get('TechSupport')}

    PRIMARY CHURN DRIVERS (SHAP analysis, highest impact first):
    {', '.join([f"{d['feature'].replace('_', ' ')} (impact: {d['impact']:.2f})" for d in churn_drivers])}

    INSTRUCTIONS:
    1. Identify the single most impactful retention strategy (2-4 words).
    2. Write a concise personalized action plan (2-3 sentences) addressing the top drivers.
    3. Draft a short empathetic agent outreach script (2-3 sentences).

    Respond ONLY with valid JSON in this exact format:
    {{
        "strategy": "...",
        "plan": "...",
        "script": "..."
    }}
    """

    # Primary: Gemini
    result = _generate_with_gemini(prompt)
    if result:
        result["is_ai_generated"] = True
        result["model_used"] = "Gemini 1.5 Flash"
        return result

    # Fallback: Rule-based
    print("[LLM] All AI providers failed — using rule-based fallback.")
    return {
        "strategy": "Dynamic Retention",
        "plan": "Our analysis suggests cost optimization or contract incentives based on the identified churn drivers.",
        "script": "Hi, I'm reaching out because we value your loyalty. I'd love to explore options to make your experience even better — can we find a plan that better fits your needs?",
        "is_ai_generated": False,
        "model_used": "Rule-based Fallback"
    }
    