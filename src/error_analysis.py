import pandas as pd
from sklearn.metrics import confusion_matrix

# Performing the error analysis
def analyze_errors(model, X_val, y_val):
    preds = model.predict(X_val)

    results = X_val.copy()
    results["Actual"] = y_val
    results["Predicted"] = preds
    results["Error"] = results["Actual"] != results["Predicted"]

    errors = results[results["Error"] == True]

    print("Total Misclassifications:", len(errors))

    # Confusion matrix breakdown into tp, tn, fp, fn
    cm = confusion_matrix(y_val, preds)
    tn, fp, fn, tp = cm.ravel()

    print("False Positives:", fp)
    print("False Negatives:", fn)

    print("Churn rate in errors:")
    print(errors["Actual"].value_counts(normalize=True))

    # Checking tenure pattern in false negatives because of strong expected correlation between tenure and churning
    if "tenure" in errors.columns:
        print("Average tenure of False Negatives:",
              errors[(errors["Actual"] == 1) & (errors["Predicted"] == 0)]["tenure"].mean())

    return errors