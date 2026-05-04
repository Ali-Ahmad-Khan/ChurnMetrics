from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from xgboost import XGBClassifier
from config import RANDOM_STATE


# Stage 1: Logistic Regression primary filter (balanced for high recall on imbalanced churn data)
def train_logistic(X_train, y_train, preprocessor):
    model = Pipeline([
        ("preprocess", preprocessor),
        ("classifier", LogisticRegression(
            max_iter=1000,
            class_weight="balanced",
            random_state=RANDOM_STATE
        ))
    ])
    model.fit(X_train, y_train)
    return model


# Stage 2: XGBoost refinement model (applied only to uncertain cases from Stage 1)
def train_xgboost(X_train, y_train, preprocessor):
    model = Pipeline([
        ("preprocess", preprocessor),
        ("classifier", XGBClassifier(
            n_estimators=400,
            max_depth=4,
            learning_rate=0.01,
            subsample=0.8,
            colsample_bytree=0.8,
            min_child_weight=5,
            gamma=0.2,
            # Prioritize precision (less aggressive than balanced)
            scale_pos_weight=1.0,
            eval_metric="logloss",
            random_state=RANDOM_STATE
        ))
    ])
    model.fit(X_train, y_train)
    return model
