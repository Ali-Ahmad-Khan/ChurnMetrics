import os
import json
import re
import httpx
from google import genai
from dotenv import load_dotenv

load_dotenv()

# Config
OLLAMA_URL = "http://localhost:11434/api/generate"
LOCAL_MODEL = "qwen2.5:0.5b"  # Efficiency King (extremely lightweight)

# Setup Gemini Fallback
api_key = os.getenv("GOOGLE_API_KEY")
if api_key and api_key != "your_gemini_api_key_here":
    client = genai.Client(api_key=api_key)
    gemini_model_name = "gemini-1.5-flash"
else:
    client = None
    gemini_model_name = None

def _generate_with_ollama(prompt):
    """Try generating with local Ollama instance"""
    try:
        payload = {
            "model": LOCAL_MODEL,
            "prompt": prompt,
            "stream": False,
            "format": "json",
            "options": {
                "temperature": 0.3,
                "top_p": 0.9
            }
        }
        response = httpx.post(OLLAMA_URL, json=payload, timeout=30.0)
        if response.status_code == 200:
            return json.loads(response.json()["response"])
    except Exception as e:
        print(f"[LLM] Ollama failed: {e}")
    return None

def _generate_with_gemini(prompt):
    """Fallback to Gemini cloud API"""
    if not client or not gemini_model_name:
        return None
    try:
        response = client.models.generate_content(
            model=gemini_model_name,
            contents=prompt
        )
        text = response.text
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            return json.loads(match.group())
    except Exception as e:
        print(f"[LLM] Gemini failed: {e}")
    return None

def generate_rescue_plan(customer_data, churn_drivers):
    """
    Generate a personalized rescue plan.
    Priority: 1. Local Qwen (Ollama) | 2. Gemini Cloud | 3. Hardcoded Fallback
    """
    
    prompt = f"""
    You are a Senior Customer Retention Specialist.
    Based on the following data for a customer with high churn risk, generate a 'Rescue Plan'.
    
    CUSTOMER PROFILE:
    - Tenure: {customer_data.get('tenure')} months
    - Monthly Charges: ${customer_data.get('MonthlyCharges')}
    - Contract: {customer_data.get('Contract')}
    - Internet Service: {customer_data.get('InternetService')}
    
    PRIMARY CHURN DRIVERS (from SHAP analysis):
    {', '.join([f"{d['feature']} (Impact: {d['impact']:.2f})" for d in churn_drivers])}
    
    TASK:
    1. Identify the 'Core Retention Strategy' (2-3 words).
    2. Provide a 'Personalized Plan' (1-2 sentences).
    3. Draft a short 'Agent Outreach Script' (empathetic, value-driven).
    
    Output in strictly JSON format:
    {{
        "strategy": "...",
        "plan": "...",
        "script": "..."
    }}
    """

    # 1. Try Local Ollama
    result = _generate_with_ollama(prompt)
    if result:
        result["is_ai_generated"] = True
        result["model_used"] = f"Local {LOCAL_MODEL}"
        return result

    # 2. Try Gemini
    result = _generate_with_gemini(prompt)
    if result:
        result["is_ai_generated"] = True
        result["model_used"] = "Gemini 1.5 Flash"
        return result

    # 3. Hardcoded Fallback
    return {
        "strategy": "Dynamic Retention",
        "plan": "Our analysis suggests cost optimization or contract incentives based on the identified drivers.",
        "script": "Hi, I'm calling to see if your current services are meeting your needs at the right price point.",
        "is_ai_generated": False,
        "model_used": "Rule-based Fallback"
    }
