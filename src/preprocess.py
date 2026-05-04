from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
import pandas as pd
from config import TEST_SIZE, VAL_SIZE, TRAIN_SIZE, RANDOM_STATE


def drop_identifier(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()

    # Custimer ID identifier cant be used as feature
    if "customerID" in df.columns:
        df.drop("customerID", axis=1, inplace=True)

    return df


def normalize_service_categories(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()

    # From EDA we discovered 'No Internet Service' and 'No Phone Service' columns
    # Converting them to 'No' to be consistent
    internet_related = [
        "OnlineSecurity", "OnlineBackup", "DeviceProtection",
        "TechSupport", "StreamingTV", "StreamingMovies"
    ]
    phone_related = ["MultipleLines"]

    for col in internet_related:
        if col in df.columns:
            df[col] = df[col].replace("No internet service", "No")

    for col in phone_related:
        if col in df.columns:
            df[col] = df[col].replace("No phone service", "No")

    return df


def convert_total_charges(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()

    # Stripping the extra strings in 'TotalCharges' found during EDA
    if "TotalCharges" in df.columns:
        df["TotalCharges"] = df["TotalCharges"].astype(str).str.strip()
        df["TotalCharges"] = pd.to_numeric(df["TotalCharges"], errors="coerce").astype(float)

    # Adding interaction features for better precision
    if "tenure" in df.columns and "MonthlyCharges" in df.columns:
        df["Tenure_Monthly"] = df["tenure"] * df["MonthlyCharges"]
        
    if "Contract" in df.columns and "MonthlyCharges" in df.columns:
        # Simple encoding for contract to use in interaction
        contract_map = {"Month-to-month": 1, "One year": 12, "Two year": 24}
        df["Contract_Value"] = df["Contract"].map(contract_map)
        df["Contract_Monthly"] = df["Contract_Value"] * df["MonthlyCharges"]

    return df


def make_features_target(df: pd.DataFrame):
    # Explicitly changing 'churn' no/yes to 0/1
    X = df.drop("Churn", axis=1)
    y = df["Churn"].map({"No": 0, "Yes": 1})
    return X, y

def split_data(X, y):
    # First split
    X_train, X_temp, y_train, y_temp = train_test_split(
        X,
        y,
        test_size=VAL_SIZE + TEST_SIZE,
        stratify=y,
        random_state=RANDOM_STATE
    )

    # Computing relative test size from temp
    relative_test_size = TEST_SIZE / (VAL_SIZE + TEST_SIZE)

    # Second split
    X_val, X_test, y_val, y_test = train_test_split(
        X_temp,
        y_temp,
        test_size=relative_test_size,
        stratify=y_temp,
        random_state=RANDOM_STATE
    )

    return X_train, X_val, X_test, y_train, y_val, y_test



def impute_total_charges_train_median(X_train: pd.DataFrame, X_val: pd.DataFrame):
    # Replacing median of column at missing values in 'TotalCharges'
    if "TotalCharges" in X_train.columns:
        median_total = X_train["TotalCharges"].median()
        X_train = X_train.copy()
        X_val = X_val.copy()
        X_train["TotalCharges"] = X_train["TotalCharges"].fillna(median_total)
        X_val["TotalCharges"] = X_val["TotalCharges"].fillna(median_total)

    return X_train, X_val


def build_preprocessor(X_train: pd.DataFrame) -> ColumnTransformer:
    # Dataset is mix of numerical and categorical
    num_cols = X_train.select_dtypes(include=["int64", "float64"]).columns.tolist()
    cat_cols = X_train.select_dtypes(include=["object"]).columns.tolist()

    # 'SeniorCitizen' should be categorical as discovered during EDA
    if "SeniorCitizen" in num_cols:
        num_cols.remove("SeniorCitizen")
        cat_cols.append("SeniorCitizen")

    # For numerical features pipeline filling missing values then scaling
    # The imputer in this pipeline automatically covers replacing 
    # median of column at missing values in 'TotalCharges' 
    num_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler())
    ])

    # For categorical features pipeline filling missing values then encoding
    cat_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("encoder", OneHotEncoder(handle_unknown="ignore"))
    ])

    return ColumnTransformer(
        transformers=[
            ("num", num_pipeline, num_cols),
            ("cat", cat_pipeline, cat_cols),
        ]
    )


def prepare_data(df: pd.DataFrame):
    # Applying cleaning steps driven by EDA
    df = drop_identifier(df)
    df = normalize_service_categories(df)
    df = convert_total_charges(df)

    # Separating features and target
    X, y = make_features_target(df)

    # Splitting before any statistical processing to avoid leakage
    X_train, X_val, X_test, y_train, y_val, y_test = split_data(X, y)

    # Filling missing TotalCharges using training median only
    X_train, X_val = impute_total_charges_train_median(X_train, X_val)

    # Building preprocessor based on training dtypes/columns only
    preprocessor = build_preprocessor(X_train)

    return X_train, X_val, X_test, y_train, y_val, y_test, preprocessor
