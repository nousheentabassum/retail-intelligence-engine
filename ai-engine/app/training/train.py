from typing import List, Dict
from ..models.model_selector import select_best_model
from ..preprocessing.clean_data import clean_series


def train_and_select(history: List[float], horizon: int) -> Dict:
    cleaned = clean_series(history)
    return select_best_model(cleaned, horizon)

