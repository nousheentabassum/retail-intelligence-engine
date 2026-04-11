from typing import List


def clean_series(values: List[float]) -> List[float]:
    cleaned = []
    for v in values:
        try:
            num = float(v)
            if num < 0:
                num = 0.0
            cleaned.append(num)
        except Exception:
            cleaned.append(0.0)
    return cleaned

