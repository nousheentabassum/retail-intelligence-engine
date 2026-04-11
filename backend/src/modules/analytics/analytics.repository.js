import { query } from '../../config/db.js';

export async function getSalesAnalytics(startDate, endDate, category = null, shopLocation = null, advancedFilters = {}) {
  const { minRevenue, maxRevenue, minTransactions, maxTransactions, sortBy = 'date', sortOrder = 'desc' } = advancedFilters;
  
  let queryStr = `
    SELECT 
       DATE(s.sold_at) as date,
       COUNT(s.id) as total_transactions,
       SUM(s.quantity) as total_quantity,
       SUM(s.total_amount) as total_revenue,
       AVG(s.unit_price) as avg_price,
       COUNT(DISTINCT s.product_id) as unique_products
     FROM sales s
     WHERE s.sold_at >= $1 AND s.sold_at <= $2`;
  
  const params = [startDate, endDate];
  let paramIndex = 3;
  
  if (category && category !== 'all') {
    queryStr += ` AND EXISTS (SELECT 1 FROM products p WHERE p.id = s.product_id AND p.category = $${paramIndex})`;
    params.push(category);
    paramIndex++;
  }
  
  if (shopLocation && shopLocation !== 'all') {
    queryStr += ` AND s.store_location = $${paramIndex}`;
    params.push(shopLocation);
    paramIndex++;
  }
  
  queryStr += ` GROUP BY DATE(s.sold_at)`;
  
  // Add HAVING clause for numeric filters
  const havingConditions = [];
  if (minRevenue !== null) {
    havingConditions.push(`SUM(s.total_amount) >= $${paramIndex}`);
    params.push(minRevenue);
    paramIndex++;
  }
  if (maxRevenue !== null) {
    havingConditions.push(`SUM(s.total_amount) <= $${paramIndex}`);
    params.push(maxRevenue);
    paramIndex++;
  }
  if (minTransactions !== null) {
    havingConditions.push(`COUNT(s.id) >= $${paramIndex}`);
    params.push(minTransactions);
    paramIndex++;
  }
  if (maxTransactions !== null) {
    havingConditions.push(`COUNT(s.id) <= $${paramIndex}`);
    params.push(maxTransactions);
    paramIndex++;
  }
  
  if (havingConditions.length > 0) {
    queryStr += ` HAVING ` + havingConditions.join(' AND ');
  }
  
  // Add sorting
  const validSortFields = ['date', 'total_transactions', 'total_revenue', 'total_quantity', 'avg_price'];
  const sortField = validSortFields.includes(sortBy) ? sortBy : 'date';
  const sortDirection = (sortOrder && sortOrder.toLowerCase() === 'asc') ? 'ASC' : 'DESC';
  queryStr += ` ORDER BY ${sortField} ${sortDirection}`;
  
  const result = await query(queryStr, params);
  return result.rows;
}

export async function getProductPerformanceAnalytics(startDate, endDate, limit = 10, category = null, shopLocation = null) {
  let queryStr = `
    SELECT 
       p.id,
       p.sku,
       p.name,
       p.category,
       COUNT(s.id) as transaction_count,
       SUM(s.quantity) as total_quantity,
       SUM(s.total_amount) as total_revenue,
       AVG(s.unit_price) as avg_price,
       p.current_stock,
       p.selling_price,
       (SUM(s.total_amount) - (SUM(s.quantity) * p.unit_cost)) as gross_profit
     FROM products p
     JOIN sales s ON p.id = s.product_id
     WHERE s.sold_at >= $1 AND s.sold_at <= $2`;
  
  const params = [startDate, endDate];
  let paramIndex = 3;
  
  if (category && category !== 'all') {
    queryStr += ` AND p.category = $${paramIndex}`;
    params.push(category);
    paramIndex++;
  }
  
  if (shopLocation && shopLocation !== 'all') {
    queryStr += ` AND s.store_location = $${paramIndex}`;
    params.push(shopLocation);
    paramIndex++;
  }
  
  queryStr += ` GROUP BY p.id, p.sku, p.name, p.category, p.current_stock, p.selling_price, p.unit_cost ORDER BY total_revenue DESC LIMIT $${paramIndex}`;
  params.push(limit);
  
  const result = await query(queryStr, params);
  return result.rows;
}

export async function getCategoryAnalytics(startDate, endDate) {
  const result = await query(
    `SELECT 
       p.category,
       COUNT(DISTINCT p.id) as product_count,
       COUNT(s.id) as transaction_count,
       SUM(s.quantity) as total_quantity,
       SUM(s.total_amount) as total_revenue,
       AVG(s.unit_price) as avg_price
     FROM products p
     JOIN sales s ON p.id = s.product_id
     WHERE s.sold_at >= $1 AND s.sold_at <= $2
     GROUP BY p.category
     ORDER BY total_revenue DESC`,
    [startDate, endDate]
  );
  
  return result.rows;
}

export async function getInventoryAnalytics() {
  const result = await query(
    `SELECT 
       COUNT(*) as total_products,
       SUM(current_stock) as total_inventory_units,
       SUM(current_stock * unit_cost) as total_inventory_value,
       COUNT(CASE WHEN current_stock <= reorder_point THEN 1 END) as low_stock_count,
       COUNT(CASE WHEN current_stock = 0 THEN 1 END) as out_of_stock_count,
       AVG(current_stock) as avg_stock_per_product
     FROM products`,
    []
  );
  
  return result.rows[0];
}

export async function getForecastAccuracyAnalytics(startDate, endDate) {
  const result = await query(
    `SELECT 
       model_name,
       COUNT(*) as forecast_count,
       AVG((metrics->>'mape')::decimal) as avg_mape,
       AVG((metrics->>'rmse')::decimal) as avg_rmse,
       MIN((metrics->>'mape')::decimal) as best_mape,
       MAX((metrics->>'mape')::decimal) as worst_mape
     FROM forecasts
     WHERE created_at >= $1 AND created_at <= $2
     GROUP BY model_name
     ORDER BY avg_mape ASC`,
    [startDate, endDate]
  );
  
  return result.rows;
}

export async function getRevenueTrends(startDate, endDate, groupBy = 'day') {
  let groupClause;
  switch (groupBy) {
    case 'week':
      groupClause = "DATE_TRUNC('week', s.sold_at)";
      break;
    case 'month':
      groupClause = "DATE_TRUNC('month', s.sold_at)";
      break;
    default:
      groupClause = "DATE(s.sold_at)";
  }
  
  const result = await query(
    `SELECT 
       ${groupClause} as period,
       SUM(s.total_amount) as revenue,
       COUNT(s.id) as transactions,
       SUM(s.quantity) as quantity
     FROM sales s
     WHERE s.sold_at >= $1 AND s.sold_at <= $2
     GROUP BY ${groupClause}
     ORDER BY period DESC`,
    [startDate, endDate]
  );
  
  return result.rows.reverse();
}

export async function getTopCustomers(startDate, endDate, limit = 10) {
  // This would require customer data - for now using product-based analytics
  const result = await query(
    `SELECT 
       s.product_id,
       p.name as product_name,
       COUNT(s.id) as purchase_frequency,
       SUM(s.quantity) as total_quantity,
       SUM(s.total_amount) as total_spent
     FROM sales s
     JOIN products p ON s.id = s.product_id
     WHERE s.sold_at >= $1 AND s.sold_at <= $2
     GROUP BY s.product_id, p.name
     ORDER BY total_spent DESC
     LIMIT $3`,
    [startDate, endDate, limit]
  );
  
  return result.rows;
}
