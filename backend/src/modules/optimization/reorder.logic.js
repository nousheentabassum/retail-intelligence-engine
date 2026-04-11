export function calculateSafetyStock({ demandStdDev, leadTimeDays, serviceFactor }) {
  return serviceFactor * demandStdDev * Math.sqrt(leadTimeDays);
}

export function calculateReorderPoint({ avgDailyDemand, leadTimeDays, safetyStock }) {
  return avgDailyDemand * leadTimeDays + safetyStock;
}

export function calculateEoq({ annualDemand, orderCost, holdingCostPerUnit }) {
  if (!annualDemand || !orderCost || !holdingCostPerUnit) return null;
  return Math.sqrt((2 * annualDemand * orderCost) / holdingCostPerUnit);
}

export function estimateProfitImpact({ unitMargin, forecastDemand, currentStock }) {
  const potentialSales = Math.min(forecastDemand, currentStock);
  const unsatisfiedDemand = Math.max(forecastDemand - currentStock, 0);
  const realizedProfit = potentialSales * unitMargin;
  const lostProfit = unsatisfiedDemand * unitMargin;
  return { realizedProfit, lostProfit };
}

