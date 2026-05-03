from src.data_load import load_data
from src.preprocess import prepare_data
from src.train import train_logistic

def test_model_training():
    df = load_data()
    X_train, X_val, X_test, y_train, y_val, y_test, preprocessor = prepare_data(df)

    model = train_logistic(X_train, y_train, preprocessor)

    assert model is not None