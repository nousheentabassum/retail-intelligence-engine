import * as salesRepository from "./sales.repository.js";

export async function recordSale(payload) {
  const sale = await salesRepository.insertSale(payload);
  return sale;
}

export async function getSalesTimeSeries(productId, options) {
  const rows = await salesRepository.getSalesSeries(productId, options);
  const dates = rows.map((r) => r.date);
  const quantities = rows.map((r) => Number(r.total_quantity));
  return { dates, quantities };
}

export async function getSalesByProduct(productId, options) {
  return await salesRepository.getSalesByProduct(productId, options);
}

export async function getSalesMetrics(productId, startDate, endDate) {
  return await salesRepository.getSalesMetrics(productId, startDate, endDate);
}

export async function getTopSellingProducts(limit, startDate, endDate) {
  return await salesRepository.getTopSellingProducts(limit, startDate, endDate);
}

