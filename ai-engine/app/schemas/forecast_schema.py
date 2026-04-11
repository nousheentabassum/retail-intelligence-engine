from pydantic import BaseModel
from typing import List


class ForecastRequest(BaseModel):
    product_id: str
    dates: List[str]
    quantities: List[float]
    horizon: int = 14


class ForecastResponse(BaseModel):
    product_id: str
    horizon: int
    model_used: str
    forecasts: List[float]
    metrics: dict

