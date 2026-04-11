import * as forecastingService from "./forecasting.service.js";

export async function createForecast(req, res, next) {
  try {
    const { productId, horizon } = req.body;
    const forecast = await forecastingService.generateForecast({
      productId,
      horizon: horizon ? Number(horizon) : 14
    });
    res.json(forecast);
  } catch (err) {
    next(err);
  }
}

export async function getForecasts(req, res, next) {
  try {
    const { productId } = req.params;
    const { limit, modelName } = req.query;
    
    const forecasts = await forecastingService.getForecastsByProduct(productId, {
      limit: limit ? Number(limit) : undefined,
      modelName
    });
    
    res.json(forecasts);
  } catch (err) {
    next(err);
  }
}

export async function getLatestForecast(req, res, next) {
  try {
    const { productId } = req.params;
    const forecast = await forecastingService.getLatestForecast(productId);
    
    if (!forecast) {
      return res.status(404).json({ error: 'No forecast found for this product' });
    }
    
    res.json(forecast);
  } catch (err) {
    next(err);
  }
}

export async function getForecastMetrics(req, res, next) {
  try {
    const { productId } = req.params;
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        error: 'startDate and endDate query parameters are required' 
      });
    }
    
    const metrics = await forecastingService.getForecastMetrics(productId, startDate, endDate);
    res.json(metrics);
  } catch (err) {
    next(err);
  }
}

