from typing import List, Dict
from .metrics import mape, rmse, direction_accuracy


def evaluate(actual: List[float], forecast: List[float]) -> Dict[str, float]:
    return {
        "mape": mape(actual, forecast),
        "rmse": rmse(actual, forecast),
        "forecast_direction_accuracy_pct": direction_accuracy(actual, forecast),
    }

