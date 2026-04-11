import * as inventoryRepository from "./inventory.repository.js";

export async function createProduct(productData) {
  return await inventoryRepository.createProduct(productData);
}

export async function getAllProducts(options) {
  return await inventoryRepository.getAllProducts(options);
}

export async function getProductById(productId) {
  return await inventoryRepository.getProductById(productId);
}

export async function updateProduct(productId, updateData) {
  return await inventoryRepository.updateProduct(productId, updateData);
}

export async function deleteProduct(productId) {
  return await inventoryRepository.deleteProduct(productId);
}

export async function getStockLevels(productId) {
  return await inventoryRepository.getProductStock(productId);
}

export async function adjustStock(productId, quantity, transactionType, referenceId, notes) {
  return await inventoryRepository.updateStock(productId, quantity, transactionType, referenceId, notes);
}

export async function getInventorySnapshot(productId) {
  return await inventoryRepository.getInventorySnapshot(productId);
}

export async function getLowStockAlerts() {
  return await inventoryRepository.getLowStockProducts();
}

export async function getInventoryHistory(productId, options) {
  return await inventoryRepository.getInventoryTransactions(productId, options);
}

export async function buildInventoryView(productId) {
  const series = await inventoryRepository.getInventorySnapshot(productId);
  const demand = series.map((r) => Number(r.qty));
  const recentDemand = demand.reduce((a, b) => a + b, 0);
  const avgDaily = recentDemand / (demand.length || 1);
  const currentStockProxy = Math.round(avgDaily * 14);
  return {
    productId,
    recentDemand,
    avgDailyDemand: avgDaily,
    estimatedCurrentStock: currentStockProxy,
    daysOfCover: avgDaily > 0 ? currentStockProxy / avgDaily : 0
  };
}

