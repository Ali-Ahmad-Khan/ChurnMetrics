import joblib
import os
from config import MODEL_DIR

# Saving the trained model onto the disk for reproducibility
def save_model(model, model_name):
    os.makedirs(MODEL_DIR, exist_ok=True)
    path = os.path.join(MODEL_DIR, model_name)
    joblib.dump(model, path)
    print(f"Model saved at {path}")


# Loading the trained model from the disk
def load_model(path):
    return joblib.load(path)