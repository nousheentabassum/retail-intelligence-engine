from typing import List
import numpy as np


def moving_average_forecast(series: List[float], horizon: int, window: int = 7) -> List[float]:
    if not series:
        return [1.0 for _ in range(horizon)]  # Default forecast
    
    if len(series) < window:
        window = max(1, len(series))
    avg = float(np.mean(series[-window:]))
    return [avg for _ in range(horizon)]

