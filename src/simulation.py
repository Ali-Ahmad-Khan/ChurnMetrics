import numpy as np
import pandas as pd
from sklearn.pipeline import Pipeline
from api.model_loader import get_stage1_model, get_optimal_threshold
from data_load import load_data
from preprocess import drop_identifier, normalize_service_categories, convert_total_charges, make_features_target

class GlobalSimulator:
    def __init__(self):
        self.df = None
        self.X_transformed = None
        self.model = None
        self.preprocessor = None
        self.feature_names = None
        self.threshold = get_optimal_threshold()
        self.initialized = False

    def initialize(self):
        try:
            # Load raw data
            df_raw = load_data()
            df = drop_identifier(df_raw)
            df = normalize_service_categories(df)
            df = convert_total_charges(df)
            X, _ = make_features_target(df)
            
            self.df = X
            self.model = get_stage1_model()
            self.preprocessor = self.model.named_steps["preprocess"]
            
            # Transform data once
            self.X_transformed = self.preprocessor.transform(self.df)
            
            # Extract feature names from preprocessor to map back to original columns
            self.feature_names = []
            for name, transformer, columns in self.preprocessor.transformers_:
                if name == "num":
                    self.feature_names.extend(columns)
                elif name == "cat":
                    # Check if transformer is a Pipeline
                    if isinstance(transformer, (Pipeline,)):
                        encoder = transformer.named_steps["encoder"]
                    else:
                        encoder = transformer
                        
                    if hasattr(encoder, "get_feature_names_out"):
                        names = encoder.get_feature_names_out(columns)
                        self.feature_names.extend(names.tolist())
                    else:
                        self.feature_names.extend(columns)
                elif name == "remainder" and columns:
                    self.feature_names.extend(columns)
            
            self.initialized = True
            print(f"[GlobalSimulator] Initialized with {len(self.df)} customers")
        except Exception as e:
            print(f"[GlobalSimulator] Initialization failed: {e}")
            self.initialized = False

    def simulate_shift(self, shifts):
        """
        Calculates global churn change using Logit-shift deduction.
        Formula: P_new = Sigmoid(Logit_old + sum(beta_i * Delta_X_i))
        """
        if not self.initialized:
            self.initialize()
        
        if not self.initialized:
            raise RuntimeError("Global Simulator could not be initialized.")

        # Get Logistic Regression components
        lr = self.model.named_steps["classifier"]
        coefs = lr.coef_[0]
        intercept = lr.intercept_[0]
        
        # Calculate baseline logits: Z = X_transformed * beta + intercept
        if hasattr(self.X_transformed, "toarray"):
            Z = self.X_transformed.dot(coefs) + intercept
        else:
            Z = np.dot(self.X_transformed, coefs) + intercept
            
        probs_orig = 1 / (1 + np.exp(-Z))
        churn_orig = (probs_orig >= self.threshold).astype(int)
        
        print(f"[GlobalSimulator] Threshold: {self.threshold}")
        print(f"[GlobalSimulator] Mean Prob: {probs_orig.mean():.4f}")
        print(f"[GlobalSimulator] Original Churners: {churn_orig.sum()}")
        
        # Calculate logit shift Delta_Z
        delta_Z = np.zeros(len(self.df))
        
        for shift in shifts:
            feature = shift.feature
            percentage = shift.percentage_change / 100.0
            
            if feature in self.df.columns and pd.api.types.is_numeric_dtype(self.df[feature]):
                try:
                    idx = self.feature_names.index(feature)
                    num_pipeline = self.preprocessor.named_transformers_["num"]
                    scaler = num_pipeline.named_steps["scaler"]
                    num_cols = self.preprocessor.transformers_[0][2]
                    num_idx = num_cols.index(feature)
                    
                    scale = scaler.scale_[num_idx]
                    beta = coefs[idx]
                    delta_Z += beta * (percentage * self.df[feature].values / scale)
                    
                except (ValueError, KeyError) as e:
                    print(f"[GlobalSimulator] Skipping shift for {feature}: {e}")
                    continue

        Z_new = Z + delta_Z
        probs_new = 1 / (1 + np.exp(-Z_new))
        churn_new = (probs_new >= self.threshold).astype(int)
        
        orig_count = int(np.sum(churn_orig))
        mod_count = int(np.sum(churn_new))
        total = len(self.df)
        
        return {
            "original_churn_count": orig_count,
            "modified_churn_count": mod_count,
            "original_churn_rate": round(float(orig_count / total), 4) if total > 0 else 0,
            "modified_churn_rate": round(float(mod_count / total), 4) if total > 0 else 0,
            "change_count": mod_count - orig_count,
            "change_percentage": round(float((mod_count - orig_count) / total * 100), 2) if total > 0 else 0,
            "math_details": (
                "Implementation: First-order Logit-Shift Deduction. "
                "Formula: ΔLogit = Σ(β_j * ΔX_scaled_j). "
                "Process: We extracted the feature weights (β) from the Stage 1 Logistic Regression model. "
                "Instead of re-inferencing the entire dataset, we mathematically deduced the change in "
                "classification Log-Odds for every customer based on the input shifts, then re-mapped "
                "through the Sigmoid function and optimized threshold (0.3755)."
            )
        }

# For the imports to work, Pipeline must be available
from sklearn.pipeline import Pipeline

# Global instance (lazy loaded)
_simulator = None

def get_simulator():
    global _simulator
    if _simulator is None:
        _simulator = GlobalSimulator()
    return _simulator
