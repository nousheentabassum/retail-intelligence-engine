export class Forecast {
  constructor({ productId, modelUsed, horizon, forecasts, metrics }) {
    this.productId = productId;
    this.modelUsed = modelUsed;
    this.horizon = horizon;
    this.forecasts = forecasts;
    this.metrics = metrics;
  }
}

