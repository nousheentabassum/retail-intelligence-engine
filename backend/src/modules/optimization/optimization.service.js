import * as optimizationRepository from "./optimization.repository.js";
import { calculateSafetyStock, calculateReorderPoint, calculateEoq, estimateProfitImpact } from "./reorder.logic.js";
import { query } from "../../config/db.js";

export function optimizeReorder({ forecast, demandStdDev, leadTimeDays = 7, serviceFactor = 1.65, unitMargin = 5, annualDemand, orderCost, holdingCostPerUnit, currentStock }) {
  const avgDailyDemand = forecast.reduce((a, b) => a + b, 0) / (forecast.length || 1);

  const safetyStock = calculateSafetyStock({ demandStdDev, leadTimeDays, serviceFactor });
  const reorderPoint = calculateReorderPoint({ avgDailyDemand, leadTimeDays, safetyStock });
  const eoq = calculateEoq({ annualDemand, orderCost, holdingCostPerUnit });
  const profitImpact = estimateProfitImpact({
    unitMargin,
    forecastDemand: forecast.reduce((a, b) => a + b, 0),
    currentStock
  });

  return {
    avgDailyDemand,
    safetyStock,
    reorderPoint,
    eoq,
    profitImpact
  };
}

export async function createRecommendation(recommendationData) {
  return await optimizationRepository.createOptimizationRecommendation(recommendationData);
}

export async function getRecommendations(productId, options) {
  return await optimizationRepository.getRecommendationsByProduct(productId, options);
}

export async function generateStockOptimization(productId) {
  const optimization = await optimizationRepository.generateStockOptimization(productId);
  
  // Save recommendations to database
  for (const rec of optimization.recommendations) {
    await createRecommendation({
      ...rec,
      productId
    });
  }
  
  return optimization;
}

export async function implementRecommendation(recommendationId, userId) {
  // This would update the product values and mark recommendation as implemented
  const result = await query(
    `UPDATE optimization_recommendations 
     SET implemented_at = NOW() 
     WHERE id = $1 
     RETURNING *`,
    [recommendationId]
  );
  
  return result.rows[0];
}

