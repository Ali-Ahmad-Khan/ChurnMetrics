import os
import numpy as np
import random

RANDOM_STATE = 42
TRAIN_SIZE = 0.7
VAL_SIZE = 0.15
TEST_SIZE = 0.15

# Resolve paths relative to project root (parent of src/)
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

DATA_PATH = os.path.join(PROJECT_ROOT, "data", "raw", "IBM_telco_churn.csv")
MODEL_DIR = os.path.join(PROJECT_ROOT, "models")
MODEL_PATH = os.path.join(PROJECT_ROOT, "models", "churn_model.pkl")

# Adding reproducibility contols (Assignment 2)
def set_seed(seed=RANDOM_STATE):
    np.random.seed(seed)
    random.seed(seed)