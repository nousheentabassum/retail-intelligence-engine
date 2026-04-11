import { query } from '../../config/db.js';

export async function insertSale(saleData) {
  const { productId, quantity, price, soldAt } = saleData;
  
  const result = await query(
    `INSERT INTO sales (product_id, quantity, unit_price, sold_at) 
     VALUES ($1, $2, $3, $4) 
     RETURNING *`,
    [productId, quantity, price, soldAt || new Date().toISOString()]
  );
  
  return result.rows[0];
}

export async function getSalesSeries(productId, options = {}) {
  const { limit = 100, startDate, endDate } = options;
  
  let whereClause = 'WHERE product_id = $1';
  const params = [productId];
  let paramIndex = 2;
  
  if (startDate) {
    whereClause += ` AND sold_at >= $${paramIndex++}`;
    params.push(startDate);
  }
  
  if (endDate) {
    whereClause += ` AND sold_at <= $${paramIndex++}`;
    params.push(endDate);
  }
  
  const limitClause = limit ? `LIMIT $${paramIndex}` : '';
  if (limit) params.push(limit);
  
  const result = await query(
    `SELECT 
       DATE(sold_at) as date,
       SUM(quantity) as total_quantity,
       AVG(unit_price) as avg_price,
       COUNT(*) as transaction_count
     FROM sales 
     ${whereClause}
     GROUP BY DATE(sold_at)
     ORDER BY date DESC
     ${limitClause}`,
    params
  );
  
  return result.rows.reverse(); // Return in chronological order
}

export async function getSalesByProduct(productId, options = {}) {
  const { limit = 50, offset = 0 } = options;
  
  const result = await query(
    `SELECT * FROM sales 
     WHERE product_id = $1 
     ORDER BY sold_at DESC 
     LIMIT $2 OFFSET $3`,
    [productId, limit, offset]
  );
  
  return result.rows;
}

export async function getSalesMetrics(productId, startDate, endDate) {
  const result = await query(
    `SELECT 
       COUNT(*) as total_transactions,
       SUM(quantity) as total_quantity,
       SUM(total_amount) as total_revenue,
       AVG(unit_price) as avg_price,
       MIN(unit_price) as min_price,
       MAX(unit_price) as max_price
     FROM sales 
     WHERE product_id = $1 
       AND sold_at >= $2 
       AND sold_at <= $3`,
    [productId, startDate, endDate]
  );
  
  return result.rows[0];
}

export async function getTopSellingProducts(limit = 10, startDate, endDate) {
  const result = await query(
    `SELECT 
       p.id,
       p.sku,
       p.name,
       SUM(s.quantity) as total_quantity,
       SUM(s.total_amount) as total_revenue,
       COUNT(s.id) as transaction_count
     FROM sales s
     JOIN products p ON s.product_id = p.id
     WHERE s.sold_at >= $1 AND s.sold_at <= $2
     GROUP BY p.id, p.sku, p.name
     ORDER BY total_revenue DESC
     LIMIT $3`,
    [startDate, endDate, limit]
  );
  
  return result.rows;
}

