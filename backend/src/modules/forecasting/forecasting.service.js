import { getSalesTimeSeries } from "../sales/sales.service.js";
import { requestForecast } from "./forecasting.client.js";
import * as forecastingRepository from "./forecasting.repository.js";
import { redisClient } from "../../config/redis.js";

const CACHE_TTL_SECONDS = 60 * 60; // 1 hour

export async function generateForecast({ productId, horizon = 14 }) {
  console.log(`Generating forecast for productId: ${productId}, horizon: ${horizon}`);
  
  const cacheKey = `forecast:${productId}:${horizon}`;

  if (redisClient?.isOpen) {
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      console.log(`Returning cached forecast for ${productId}`);
      return JSON.parse(cached);
    }
  }

  const series = await getSalesTimeSeries(productId, { limit: 120 });
  console.log(`Sales series for ${productId}:`, series);

  // If no sales data, create a simple forecast without calling AI Engine
  if (!series.dates || series.dates.length === 0 || !series.quantities || series.quantities.length === 0) {
    console.log(`No sales data for ${productId}, using baseline forecast`);
    const fallbackForecast = {
      product_id: productId,
      horizon,
      model_used: "baseline",
      forecasts: Array.from({length: horizon}, () => 1), // Default to 1 unit per day
      metrics: {
        mape: 0,
        rmse: 0,
        forecast_direction_accuracy_pct: 0
      }
    };

    // Cache the fallback forecast
    if (redisClient?.isOpen) {
      await redisClient.set(cacheKey, JSON.stringify(fallbackForecast), {
        EX: CACHE_TTL_SECONDS
      });
    }

    console.log(`Returning baseline forecast for ${productId}:`, fallbackForecast);
    return fallbackForecast;
  }

  const aiResponse = await requestForecast({
    productId,
    dates: series.dates,
    quantities: series.quantities,
    horizon
  });

  // Save forecast to database
  await forecastingRepository.createForecast({
    productId,
    modelName: aiResponse.model_used,
    horizonDays: horizon,
    forecastData: aiResponse.forecasts,
    metrics: aiResponse.metrics
  });

  if (redisClient?.isOpen) {
    await redisClient.set(cacheKey, JSON.stringify(aiResponse), {
      EX: CACHE_TTL_SECONDS
    });
  }

  return aiResponse;
}

export async function getForecastsByProduct(productId, options) {
  return await forecastingRepository.getForecastsByProduct(productId, options);
}

export async function getLatestForecast(productId) {
  return await forecastingRepository.getLatestForecast(productId);
}

export async function getForecastMetrics(productId, startDate, endDate) {
  return await forecastingRepository.getForecastMetrics(productId, startDate, endDate);
}


