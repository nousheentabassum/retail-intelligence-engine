import * as analyticsRepository from "./analytics.repository.js";
import { mape, rmse, forecastAccuracy, stockoutPrecision } from "../../utils/metrics.js";

export function computeAnalytics({ actual, forecast, trueStockouts, predictedStockouts }) {
  return {
    mape: mape(actual, forecast),
    rmse: rmse(actual, forecast),
    forecastAccuracyPct: forecastAccuracy(actual, forecast),
    stockoutPrecisionPct: stockoutPrecision(trueStockouts, predictedStockouts)
  };
}

export async function getSalesAnalytics(startDate, endDate, filters = {}) {
  const { category = null, shopLocation = null, minRevenue = null, maxRevenue = null, minTransactions = null, maxTransactions = null, sortBy = null, sortOrder = null } = filters || {};
  return await analyticsRepository.getSalesAnalytics(startDate, endDate, category, shopLocation, {
    minRevenue,
    maxRevenue,
    minTransactions,
    maxTransactions,
    sortBy: sortBy || 'date',
    sortOrder: sortOrder || 'desc'
  });
}

export async function getProductPerformance(startDate, endDate, limit = 10, category = null, shopLocation = null) {
  return await analyticsRepository.getProductPerformanceAnalytics(startDate, endDate, limit, category, shopLocation);
}

export async function getCategoryAnalytics(startDate, endDate) {
  return await analyticsRepository.getCategoryAnalytics(startDate, endDate);
}

export async function getInventoryAnalytics() {
  return await analyticsRepository.getInventoryAnalytics();
}

export async function getForecastAccuracy(startDate, endDate) {
  return await analyticsRepository.getForecastAccuracyAnalytics(startDate, endDate);
}

export async function getRevenueTrends(startDate, endDate, groupBy) {
  return await analyticsRepository.getRevenueTrends(startDate, endDate, groupBy);
}

export async function getTopCustomers(startDate, endDate, limit) {
  return await analyticsRepository.getTopCustomers(startDate, endDate, limit);
}

export async function getDashboardSummary(startDate, endDate, filters = {}) {
  const { category = null, shopLocation = null, minRevenue = null, maxRevenue = null, minTransactions = null, maxTransactions = null, sortBy = null, sortOrder = null } = filters || {};
  
  const [salesAnalytics, inventoryAnalytics, topProducts] = await Promise.all([
    getSalesAnalytics(startDate, endDate, {
      category,
      shopLocation,
      minRevenue,
      maxRevenue,
      minTransactions,
      maxTransactions,
      sortBy: sortBy || 'date',
      sortOrder: sortOrder || 'desc'
    }),
    getInventoryAnalytics(),
    getProductPerformance(startDate, endDate, 5, category, shopLocation)
  ]);
  
  const totalRevenue = salesAnalytics.reduce((sum, day) => sum + Number(day.total_revenue), 0);
  const totalTransactions = salesAnalytics.reduce((sum, day) => sum + Number(day.total_transactions), 0);
  const totalQuantity = salesAnalytics.reduce((sum, day) => sum + Number(day.total_quantity), 0);

  return {
    revenue: {
      total: totalRevenue,
      daily: salesAnalytics,
      trend: calculateTrend(salesAnalytics.map(d => Number(d.total_revenue)))
    },
    transactions: {
      total: totalTransactions,
      daily: salesAnalytics.map(d => ({
        date: d.date,
        count: Number(d.total_transactions)
      })),
      trend: calculateTrend(salesAnalytics.map(d => Number(d.total_transactions)))
    },
    inventory: inventoryAnalytics,
    topProducts,
    period: { startDate, endDate }
  };
}

function calculateTrend(values) {
  if (values.length < 2) return 'insufficient_data';
  
  const firstHalf = values.slice(0, Math.floor(values.length / 2));
  const secondHalf = values.slice(Math.floor(values.length / 2));
  
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  
  const change = ((secondAvg - firstAvg) / firstAvg) * 100;
  
  if (change > 5) return 'increasing';
  if (change < -5) return 'decreasing';
  return 'stable';
}

