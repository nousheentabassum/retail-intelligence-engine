from typing import List

import numpy as np
from statsmodels.tsa.arima.model import ARIMA


def arima_forecast(series: List[float], horizon: int) -> List[float]:
    if not series or len(series) < 2:
        return [1.0 for _ in range(horizon)]  # Default forecast
        
    if len(series) < 10:
        # Not enough data; fall back to naive repeat
        return [float(series[-1])] * horizon
    model = ARIMA(series, order=(1, 1, 1))
    fitted = model.fit()
    forecast = fitted.forecast(steps=horizon)
    return np.asarray(forecast, dtype=float).tolist()

