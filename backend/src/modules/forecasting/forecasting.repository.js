import { query } from '../../config/db.js';

export async function createForecast(forecastData) {
  const { productId, modelName, horizonDays, forecastData: forecastValues, metrics } = forecastData;
  
  const result = await query(
    `INSERT INTO forecasts (product_id, model_name, horizon_days, forecast_data, metrics) 
     VALUES ($1, $2, $3, $4, $5) 
     RETURNING *`,
    [productId, modelName, horizonDays, JSON.stringify(forecastValues), JSON.stringify(metrics)]
  );
  
  return result.rows[0];
}

export async function getForecastsByProduct(productId, options = {}) {
  const { limit = 10, modelName } = options;
  
  let whereClause = 'WHERE product_id = $1';
  const params = [productId];
  let paramIndex = 2;
  
  if (modelName) {
    whereClause += ` AND model_name = $${paramIndex++}`;
    params.push(modelName);
  }
  
  const result = await query(
    `SELECT * FROM forecasts 
     ${whereClause}
     ORDER BY created_at DESC 
     LIMIT $${paramIndex}`,
    [...params, limit]
  );
  
  return result.rows;
}

export async function getLatestForecast(productId) {
  const result = await query(
    `SELECT * FROM forecasts 
     WHERE product_id = $1 
     ORDER BY created_at DESC 
     LIMIT 1`,
    [productId]
  );
  
  return result.rows[0];
}

export async function getForecastMetrics(productId, startDate, endDate) {
  const result = await query(
    `SELECT model_name, 
            AVG((metrics->>'mape')::decimal) as avg_mape,
            AVG((metrics->>'rmse')::decimal) as avg_rmse,
            COUNT(*) as forecast_count
     FROM forecasts 
     WHERE product_id = $1 
       AND created_at >= $2 
       AND created_at <= $3
     GROUP BY model_name
     ORDER BY avg_mape ASC`,
    [productId, startDate, endDate]
  );
  
  return result.rows;
}
