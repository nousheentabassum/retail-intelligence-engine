import { query } from "../config/db.js";
import { redisClient } from "../config/redis.js";
import { generateForecast } from "../modules/forecasting/forecasting.service.js";

const DEFAULT_HORIZON_DAYS = 14;
const CACHE_TTL_SECONDS = 60 * 60 * 6; // 6 hours

export async function runPrecomputeForecastsJob() {
  try {
    const { rows } = await query("SELECT DISTINCT product_id FROM sales;");

    for (const row of rows) {
      const productId = row.product_id;
      if (!productId) continue;

      const forecast = await generateForecast({
        productId,
        horizon: DEFAULT_HORIZON_DAYS
      });

      const cacheKey = `forecast:${productId}:${DEFAULT_HORIZON_DAYS}`;

      if (redisClient.isOpen) {
        await redisClient.set(cacheKey, JSON.stringify(forecast), {
          EX: CACHE_TTL_SECONDS
        });
      }
    }
  } catch (err) {
    console.error("Precompute forecasts job failed", err);
  }
}

