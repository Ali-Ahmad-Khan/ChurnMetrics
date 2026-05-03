import time
import statistics
import httpx
import concurrent.futures

# Base URL of the running server
BASE_URL = "http://127.0.0.1:8000"

VALID_CUSTOMER = {
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
}

def single_request(client: httpx.Client) -> float:
    # Sending one /predict request and then returning the elapsed time in ms
    start = time.perf_counter()
    response = client.post(f"{BASE_URL}/predict", json=VALID_CUSTOMER)
    elapsed = (time.perf_counter() - start) * 1000
    assert response.status_code == 200, f"Unexpected status: {response.status_code}"
    return elapsed


def run_sequential_latency_test(n: int = 50):
    # Measuring the latency of n sequential requests
    print(f"\nSequential Latency Test  for ({n} requests):")
    latencies = []
    with httpx.Client(timeout=30.0) as client:
        for i in range(n):
            ms = single_request(client)
            latencies.append(ms)

    print(f"  Min:    {min(latencies):.2f} ms")
    print(f"  Max:    {max(latencies):.2f} ms")
    print(f"  Mean:   {statistics.mean(latencies):.2f} ms")
    print(f"  Median: {statistics.median(latencies):.2f} ms")
    print(f"  P95:    {sorted(latencies)[int(0.95 * len(latencies))]:.2f} ms")
    return latencies


def run_throughput_test(n: int = 100, workers: int = 10):
    # Measuring the requests per second using asynchronous threads
    print(f"\nThroughput Test for ({n} requests, {workers} workers):")
    latencies = []

    def task(_):
        with httpx.Client(timeout=30.0) as client:
            return single_request(client)

    wall_start = time.perf_counter()
    with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as executor:
        results = list(executor.map(task, range(n)))
    wall_elapsed = time.perf_counter() - wall_start

    latencies = results
    rps = n / wall_elapsed

    print(f"  Total time:  {wall_elapsed:.2f}s")
    print(f"  Throughput:  {rps:.2f} requests/sec")
    print(f"  Mean latency: {statistics.mean(latencies):.2f} ms")
    print(f"  P95 latency:  {sorted(latencies)[int(0.95 * len(latencies))]:.2f} ms")
    return rps, latencies


def run_batch_latency_test(batch_sizes: list = [1, 10, 50, 100]):
    # Measuring how batch size affects latency for the /predict/batch endpoint
    print("\nBatch Endpoint Latency Test:")
    with httpx.Client(timeout=60.0) as client:
        for size in batch_sizes:
            payload = {"customers": [VALID_CUSTOMER] * size}
            start = time.perf_counter()
            response = client.post(f"{BASE_URL}/predict/batch", json=payload)
            elapsed = (time.perf_counter() - start) * 1000
            assert response.status_code == 200
            print(f"  Batch size {size:>4}: {elapsed:.2f} ms")


def run_malformed_input_test():
    # Confirming the robustness that API never crashes on bad input but instead always returns 422
    print("\nMalformed Input's Robustness Test:")
    bad_payloads = [
        {},                                           # empty
        {"tenure": -99},                             # invalid single field
        {**VALID_CUSTOMER, "gender": "Robot"},       # invalid enum
        {**VALID_CUSTOMER, "MonthlyCharges": None},  # null for required numeric
        "not a json object",                          # wrong type entirely
    ]
    with httpx.Client(timeout=10.0) as client:
        for i, payload in enumerate(bad_payloads):
            try:
                resp = client.post(f"{BASE_URL}/predict", json=payload)
                status = resp.status_code
            except Exception as e:
                status = f"exception: {e}"
            print(f"  Payload {i+1}: HTTP {status} (expected 422)")


if __name__ == "__main__":
    print("ChurnMetrics API Stress Test\n")
    print(f"Target: {BASE_URL}")

    # Running all the tests in sequence
    run_sequential_latency_test(n=50)
    run_throughput_test(n=100, workers=10)
    run_batch_latency_test(batch_sizes=[1, 10, 50, 100])
    run_malformed_input_test()

    print("\nStress Test Complete")
