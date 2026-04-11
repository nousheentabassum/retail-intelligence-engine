from typing import List
import numpy as np
from sklearn.linear_model import LinearRegression


def linear_regression_forecast(series: List[float], horizon: int) -> List[float]:
    if not series or len(series) < 2:
        return [1.0 for _ in range(horizon)]  # Default forecast
        
    y = np.array(series)
    X = np.arange(len(y)).reshape(-1, 1)
    model = LinearRegression()
    model.fit(X, y)

    future_indices = np.arange(len(y), len(y) + horizon).reshape(-1, 1)
    preds = model.predict(future_indices)
    return preds.tolist()

