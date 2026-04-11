from typing import List, Tuple


def temporal_split(series: List[float], horizon: int) -> Tuple[List[float], List[float]]:
    if len(series) > horizon * 2:
        return series[:-horizon], series[-horizon:]
    k = min(horizon, len(series))
    return series, series[-k:]

