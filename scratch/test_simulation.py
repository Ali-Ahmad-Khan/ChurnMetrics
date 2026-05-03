import requests
import json

url = "http://localhost:8000/predict/simulate-global"
payload = {
    "shifts": [
        {"feature": "MonthlyCharges", "percentage_change": 10.0}
    ]
}

try:
    response = requests.post(url, json=payload)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
except Exception as e:
    print(f"Error: {e}")
