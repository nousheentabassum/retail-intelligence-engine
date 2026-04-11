from fastapi import FastAPI
from .api.forecast import router as forecast_router


app = FastAPI(title="Retail AI Engine")

app.include_router(forecast_router)


@app.get("/health")
def health():
    return {"status": "ok"}

