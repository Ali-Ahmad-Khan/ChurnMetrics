# Drift detection: compare incoming data distribution to training data
import numpy as np
import pandas as pd


class DriftDetector:
    def __init__(self, X_train):
        """
        Initialize drift detector with training data statistics.

        Args:
            X_train: Training data as preprocessed array or DataFrame
        """
        self.train_mean = np.mean(X_train, axis=0)
        self.train_std = np.std(X_train, axis=0)
        self.train_shape = X_train.shape

    def detect_drift(self, X_new, threshold_std=2.0):
        """
        Detect distribution drift using statistical comparison.

        Returns dict with drift_detected (bool), features_drifted (list), metrics (dict)
        """
        new_mean = np.mean(X_new, axis=0)
        new_std = np.std(X_new, axis=0)

        # Z-score test: how many stds away from training mean?
        z_scores = np.abs((new_mean - self.train_mean) / (self.train_std + 1e-8))

        drifted_features = []
        for i, z in enumerate(z_scores):
            if z > threshold_std:
                drifted_features.append({
                    "feature_idx": i,
                    "train_mean": float(self.train_mean[i]),
                    "new_mean": float(new_mean[i]),
                    "z_score": float(z)
                })

        drift_detected = len(drifted_features) > 0

        return {
            "drift_detected": drift_detected,
            "num_drifted_features": len(drifted_features),
            "drifted_features": drifted_features,
            "severity": "high" if len(drifted_features) > 5 else "medium" if len(drifted_features) > 0 else "low"
        }
