## Assignment 3: Model as a Service

### Overview

In this assignment, we built a REST API using FastAPI to serve the Logistic Regression model from Assignment 2. The API accepts customer data in the same format as the IBM Telco dataset, handles preprocessing internally with the saved sklearn Pipeline and returns churn predictions along with probabilities. We also added unit tests for the API and stress tests to check performance.

### What was done in Assignment 3

- Created the `api/` folder with:
  - `main.py`: The FastAPI app with endpoints for predictions, health checks, and model info.
  - `schemas.py`: Pydantic models for request/response validation.
  - `model_loader.py`: For loading the the model once at the server startup.
  - `__init__.py`: Package maker.
- Added `tests/test_api.py`: Unit tests for the API using pytest (this the tests schemas, endpoints, and error handling without needing the server).
- Added `tests/test_stress.py`: Stress tests for latency, throughput, and robustness (this requires the server to be running).

The API normalizes inputs like the training data (e.g., "No internet service" becomes "No") to match the model's expectations.


---

### Explanation of How to Run the API and Tests

For running the whole assignment 3 follow this order from scratch:

**Step 1: Installing the dependencies**
```bash
pip install -r requirements.txt
```


**Step 2: Starting the API server**
```bash
uvicorn api.main:app --reload --host 127.0.0.1 --port 8000
```

**Step 4: Opening the Swagger UI** in browser: http://127.0.0.1:8000/docs
- Use the interactive UI to test `/predict` directly in the browser

**Step 5: Running the unit/API tests** (run in a new terminal within project root)
```bash
pytest tests/test_api.py
```

**Step 6: Running the stress tests** (server should still be running from Step 3)
```bash
python tests/test_stress.py
```

**Step 7: Observing the results**
- Stress test prints the latency stats (including min,max,mean,median,P95) and the throughput 

Example stress test output we got:
```
ChurnMetrics API Stress Test

Target: http://127.0.0.1:8000

Sequential Latency Test  for (50 requests):
  Min:    17.14 ms
  Max:    84.16 ms
  Mean:   22.27 ms
  Median: 18.97 ms
  P95:    35.94 ms

Throughput Test for (100 requests, 10 workers):
  Total time:  21.66s
  Throughput:  4.62 requests/sec
  Mean latency: 96.77 ms
  P95 latency:  324.67 ms

Batch Endpoint Latency Test:
  Batch size    1: 42.52 ms
  Batch size   10: 19.06 ms
  Batch size   50: 28.67 ms
  Batch size  100: 36.65 ms

Malformed Input's Robustness Test:
  Payload 1: HTTP 422 (expected 422)
  Payload 2: HTTP 422 (expected 422)
  Payload 3: HTTP 422 (expected 422)
  Payload 4: HTTP 422 (expected 422)
  Payload 5: HTTP 422 (expected 422)

Stress Test Complete
```

The `--reload` flag enables the server to auto restart on any changes in the code so that we dont have to run it again and again suring development.

Once the server is running, these are the urls used for api validation:
- **Swagger UI (interactive docs):** http://127.0.0.1:8000/docs
- **ReDoc UI:** http://127.0.0.1:8000/redoc
- **OpenAPI JSON:** http://127.0.0.1:8000/openapi.json

---

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Checking if the API and model are ready |
| GET | `/model-info` | Getting the model type and path |
| POST | `/predict` | Used for single customer churn prediction |
| POST | `/predict/batch` | Used for batch prediction (1-500 customers) |
| POST | `/predict/timed` | Used for single prediction and server-side latency ms |

---

### Example Request
```bash
curl -X POST http://127.0.0.1:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "gender": "Female",
    "SeniorCitizen": 0,
    "Partner": "Yes",
    "Dependents": "No",
    "tenure": 12,
    "PhoneService": "Yes",
    "MultipleLines": "No",
    "InternetService": "DSL",
    "OnlineSecurity": "No",
    "OnlineBackup": "Yes",
    "DeviceProtection": "No",
    "TechSupport": "No",
    "StreamingTV": "No",
    "StreamingMovies": "No",
    "Contract": "Month-to-month",
    "PaperlessBilling": "Yes",
    "PaymentMethod": "Electronic check",
    "MonthlyCharges": 65.5,
    "TotalCharges": 786.0
  }'
```

Expected response:
```json
{
  "churn_prediction": 1,
  "churn_probability": 0.67,
  "risk_label": "High"
}
```


