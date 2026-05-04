import numpy as np
import pandas as pd
from src.data_load import load_data
from src.preprocess import prepare_data
from src.train import train_logistic
from src.segment import LOW_THRESHOLD, HIGH_THRESHOLD

def analyze_stage1():
    df = load_data()
    X_train, X_val, X_test, y_train, y_val, y_test, preprocessor = prepare_data(df)
    log_model = train_logistic(X_train, y_train, preprocessor)
    
    probs = log_model.predict_proba(X_val)[:, 1]
    results = pd.DataFrame({'prob': probs, 'actual': y_val})
    
    confident_high = results[results['prob'] > HIGH_THRESHOLD]
    uncertain = results[(results['prob'] >= LOW_THRESHOLD) & (results['prob'] <= HIGH_THRESHOLD)]
    confident_low = results[results['prob'] < LOW_THRESHOLD]
    
    print(f"Confident High (> {HIGH_THRESHOLD}): {len(confident_high)} samples")
    if len(confident_high) > 0:
        print(f"  Precision in High: {confident_high['actual'].mean():.4f}")
        print(f"  False Positives in High: {(confident_high['actual'] == 0).sum()}")
        
    print(f"\nUncertain ({LOW_THRESHOLD} - {HIGH_THRESHOLD}): {len(uncertain)} samples")
    if len(uncertain) > 0:
        print(f"  Churn Rate in Uncertain: {uncertain['actual'].mean():.4f}")
        
    print(f"\nConfident Low (< {LOW_THRESHOLD}): {len(confident_low)} samples")
    if len(confident_low) > 0:
        print(f"  Recall Missed (Churners in Low): {(confident_low['actual'] == 1).sum()}")

if __name__ == "__main__":
    analyze_stage1()
