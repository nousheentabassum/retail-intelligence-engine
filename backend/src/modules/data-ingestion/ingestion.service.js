import { recordSale } from "../sales/sales.service.js";

export async function ingestSalesBatch(rows = []) {
  if (!Array.isArray(rows)) {
    throw new Error("rows must be an array");
  }
  const accepted = [];
  for (const row of rows) {
    const { productId, quantity, price, soldAt } = row;
    if (!productId || Number(quantity) <= 0 || Number(price) < 0) {
      continue;
    }
    const created = await recordSale({
      productId,
      quantity: Number(quantity),
      price: Number(price),
      soldAt: soldAt || new Date().toISOString()
    });
    accepted.push(created);
  }
  return { total: rows.length, accepted: accepted.length, records: accepted };
}

