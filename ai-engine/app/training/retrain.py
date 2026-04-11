from typing import List, Dict
from .train import train_and_select


def retrain_with_latest(history: List[float], horizon: int) -> Dict:
    # Baseline strategy: retrain on latest full history.
    return train_and_select(history, horizon)

