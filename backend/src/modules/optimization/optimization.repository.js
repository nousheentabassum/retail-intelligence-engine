import { query } from '../../config/db.js';

export async function createOptimizationRecommendation(recommendationData) {
  const { 
    productId, 
    recommendationType, 
    currentValue, 
    recommendedValue, 
    potentialSavings, 
    confidenceScore, 
    reasoning 
  } = recommendationData;
  
  const result = await query(
    `INSERT INTO optimization_recommendations 
     (product_id, recommendation_type, current_value, recommended_value, potential_savings, confidence_score, reasoning) 
     VALUES ($1, $2, $3, $4, $5, $6, $7) 
     RETURNING *`,
    [productId, recommendationType, currentValue, recommendedValue, potentialSavings, confidenceScore, reasoning]
  );
  
  return result.rows[0];
}

export async function getRecommendationsByProduct(productId, options = {}) {
  const { limit = 10, recommendationType, implemented } = options;
  
  let whereClause = 'WHERE product_id = $1';
  const params = [productId];
  let paramIndex = 2;
  
  if (recommendationType) {
    whereClause += ` AND recommendation_type = $${paramIndex++}`;
    params.push(recommendationType);
  }
  
  if (implemented !== undefined) {
    whereClause += ` AND implemented_at IS ${implemented ? 'NOT NULL' : 'NULL'}`;
  }
  
  const result = await query(
    `SELECT * FROM optimization_recommendations 
     ${whereClause}
     ORDER BY created_at DESC 
     LIMIT $${paramIndex}`,
    [...params, limit]
  );
  
  return result.rows;
}

export async function calculateReorderPoint(productId, leadTimeDays, avgDailyDemand, serviceLevel = 0.95) {
  // Z-score for service level (simplified)
  const zScore = serviceLevel === 0.95 ? 1.65 : serviceLevel === 0.99 ? 2.33 : 1.28;
  
  // Calculate demand standard deviation (simplified approach)
  const demandVariability = avgDailyDemand * 0.3; // Assume 30% variability
  
  // Safety stock = Z-score * demand variability * sqrt(lead time)
  const safetyStock = Math.ceil(zScore * demandVariability * Math.sqrt(leadTimeDays));
  
  // Reorder point = (avg daily demand * lead time) + safety stock
  const reorderPoint = Math.ceil((avgDailyDemand * leadTimeDays) + safetyStock);
  
  return { reorderPoint, safetyStock };
}

export async function calculateEOQ(unitCost, annualDemand, orderingCost = 50, holdingCostRate = 0.25) {
  // Economic Order Quantity formula
  const holdingCostPerUnit = unitCost * holdingCostRate;
  const eoq = Math.sqrt((2 * annualDemand * orderingCost) / holdingCostPerUnit);
  
  return Math.ceil(eoq);
}

export async function generateStockOptimization(productId) {
  // Get product data and sales history
  const productResult = await query(
    'SELECT * FROM products WHERE id = $1',
    [productId]
  );
  
  if (productResult.rows.length === 0) {
    throw new Error('Product not found');
  }
  
  const product = productResult.rows[0];
  
  // Get recent sales data
  const salesResult = await query(
    `SELECT DATE(sold_at) as date, SUM(quantity) as daily_quantity
     FROM sales 
     WHERE product_id = $1 AND sold_at >= NOW() - INTERVAL '90 days'
     GROUP BY DATE(sold_at)
     ORDER BY date DESC`,
    [productId]
  );
  
  if (salesResult.rows.length === 0) {
    throw new Error('No sales data available for this product');
  }
  
  const dailyDemands = salesResult.rows.map(row => Number(row.daily_quantity));
  const avgDailyDemand = dailyDemands.reduce((a, b) => a + b, 0) / dailyDemands.length;
  const annualDemand = avgDailyDemand * 365;
  
  // Calculate optimal values
  const { reorderPoint, safetyStock } = await calculateReorderPoint(
    productId, 
    product.lead_time_days, 
    avgDailyDemand
  );
  
  const eoq = await calculateEOQ(
    Number(product.unit_cost), 
    annualDemand
  );
  
  // Generate recommendations
  const recommendations = [];
  
  if (product.reorder_point !== reorderPoint) {
    recommendations.push({
      recommendationType: 'reorder_point',
      currentValue: product.reorder_point,
      recommendedValue: reorderPoint,
      potentialSavings: Math.abs((reorderPoint - product.reorder_point) * product.unit_cost * 0.1),
      confidenceScore: 0.85,
      reasoning: `Based on ${avgDailyDemand.toFixed(1)} avg daily demand and ${product.lead_time_days} days lead time`
    });
  }
  
  if (product.safety_stock !== safetyStock) {
    recommendations.push({
      recommendationType: 'safety_stock',
      currentValue: product.safety_stock,
      recommendedValue: safetyStock,
      potentialSavings: Math.abs((safetyStock - product.safety_stock) * product.unit_cost * 0.05),
      confidenceScore: 0.80,
      reasoning: `Calculated based on demand variability and ${product.lead_time_days} days lead time`
    });
  }
  
  return {
    productId,
    currentStock: product.current_stock,
    avgDailyDemand,
    calculatedValues: { reorderPoint, safetyStock, eoq },
    recommendations
  };
}
