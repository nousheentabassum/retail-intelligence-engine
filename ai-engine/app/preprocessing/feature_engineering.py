from typing import List, Dict


def build_features(series: List[float]) -> Dict[str, float]:
    n = len(series) or 1
    avg = sum(series) / n
    last = series[-1] if series else 0.0
    trend = (last - series[0]) / n if len(series) > 1 else 0.0
    return {"mean": avg, "last": last, "trend": trend}

