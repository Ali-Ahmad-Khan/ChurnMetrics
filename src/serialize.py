import joblib
import os
from config import MODEL_DIR

# Saving the trained model onto the disk for reproducibility
def save_model(model, model_name):
    os.makedirs(MODEL_DIR, exist_ok=True)
    path = os.path.join(MODEL_DIR, model_name)
    joblib.dump(model, path)
    print(f"Model saved at {path}")


import json

# Loading the trained model from the disk
def load_model(path):
    return joblib.load(path)

# Save metadata (e.g., optimal threshold)
def save_metadata(metadata_dict, filename="metadata.json"):
    os.makedirs(MODEL_DIR, exist_ok=True)
    path = os.path.join(MODEL_DIR, filename)
    with open(path, "w") as f:
        json.dump(metadata_dict, f, indent=4)
    print(f"Metadata saved at {path}")

# Load metadata
def load_metadata(filename="metadata.json"):
    path = os.path.join(MODEL_DIR, filename)
    if os.path.exists(path):
        with open(path, "r") as f:
            return json.load(f)
    return {}