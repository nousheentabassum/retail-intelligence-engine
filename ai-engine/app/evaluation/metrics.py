from typing import List
import numpy as np


def mape(actual: List[float], forecast: List[float]) -> float:
    if not actual or not forecast:
        return 0.0
    
    actual = np.array(actual)
    forecast = np.array(forecast)
    mask = actual != 0
    if mask.sum() == 0:
        return 0.0
    return float(np.mean(np.abs((actual[mask] - forecast[mask]) / actual[mask])) * 100)


def rmse(actual: List[float], forecast: List[float]) -> float:
    if not actual or not forecast:
        return 0.0
        
    actual = np.array(actual)
    forecast = np.array(forecast)
    return float(np.sqrt(np.mean((actual - forecast) ** 2)))


def direction_accuracy(actual: List[float], forecast: List[float]) -> float:
    if len(actual) < 2 or len(forecast) < 2:
        return 0.0
        
    actual_diff = np.sign(np.diff(actual))
    forecast_diff = np.sign(np.diff(forecast))
    return float((actual_diff == forecast_diff).mean() * 100)

