from typing import List, Tuple

from ..evaluation.metrics import mape, rmse, direction_accuracy
from .moving_average import moving_average_forecast
from .linear_regression import linear_regression_forecast
from .arima_model import arima_forecast


def evaluate_model(name: str, history: List[float], horizon: int) -> Tuple[str, List[float], dict]:
    # Use last `horizon` points as validation when possible
    if len(history) > horizon * 2:
        train = history[:-horizon]
        actual = history[-horizon:]
    else:
        train = history
        actual = history[-min(horizon, len(history)) :]

    if name == "moving_average":
        forecast = moving_average_forecast(train, horizon=horizon)
    elif name == "linear_regression":
        forecast = linear_regression_forecast(train, horizon=horizon)
    elif name == "arima":
        forecast = arima_forecast(train, horizon=horizon)
    else:
        raise ValueError(f"Unknown model {name}")

    # Align lengths for metrics
    k = min(len(actual), len(forecast))
    actual_k = actual[-k:]
    forecast_k = forecast[:k]

    metrics = {
        "mape": mape(actual_k, forecast_k),
        "rmse": rmse(actual_k, forecast_k),
        "forecast_direction_accuracy_pct": direction_accuracy(actual_k, forecast_k),
    }
    return name, forecast, metrics


def select_best_model(history: List[float], horizon: int):
    candidates = ["moving_average", "linear_regression", "arima"]
    results = []
    for name in candidates:
        try:
            results.append(evaluate_model(name, history, horizon))
        except Exception:
            continue

    if not results:
        raise ValueError("No valid model could be fitted")

    # Choose by lowest RMSE
    best = min(results, key=lambda r: r[2]["rmse"])
    return {
        "model_used": best[0],
        "forecasts": best[1],
        "metrics": best[2],
    }

