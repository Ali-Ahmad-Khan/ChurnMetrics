from src.data_load import load_data
from src.preprocess import prepare_data

def test_data_split_shapes():
    df = load_data()
    X_train, X_val, X_test, y_train, y_val, y_test, _ = prepare_data(df)

    assert len(X_train) > 0
    assert len(X_val) > 0
    assert len(X_test) > 0

    assert len(X_train) == len(y_train)
    assert len(X_val) == len(y_val)