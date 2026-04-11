import { query } from "../config/db.js";
import { websocketService } from "../services/websocket.service.js";

export async function runStockAlertJob() {
  try {
    console.log('Running stock alert job...');
    
    // Get all stock alerts
    const alerts = await getAllStockAlerts();
    
    // Send real-time alerts
    if (alerts.length > 0) {
      alerts.forEach(alert => {
        websocketService.broadcastAlert(alert);
      });
    }
    
    // Get high demand products
    const { rows } = await query(`
      SELECT product_id, COALESCE(SUM(quantity), 0)::int AS demand_7d
      FROM sales
      WHERE sold_at >= NOW() - INTERVAL '7 days'
      GROUP BY product_id
      ORDER BY demand_7d DESC;
    `);
    
    const highDemandProducts = rows.filter((r) => Number(r.demand_7d) > 100);
    
    if (highDemandProducts.length > 0) {
      const productIds = highDemandProducts.map(p => p.product_id);
      const productDetails = await getProductDetails(productIds);
      
      highDemandProducts.forEach(product => {
        const details = productDetails.find(p => p.id === product.product_id);
        if (details) {
          websocketService.broadcastAlert({
            type: 'high_demand',
            product: details,
            demand: product.demand_7d,
            message: `High demand detected: ${details.name} (${product.demand_7d} units in 7 days)`,
            severity: 'warning'
          });
        }
      });
    }
    
    console.log(`Processed ${alerts.length} stock alerts and ${highDemandProducts.length} high demand products`);
    
    return {
      stockAlerts: alerts,
      highDemandProducts: highDemandProducts,
      processedAt: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Error in stock alert job:', error);
    throw error;
  }
}

async function getAllStockAlerts() {
  const alerts = [];
  
  // Low stock alerts
  const lowStockQuery = `
    SELECT p.id, p.name, p.sku, p.category, p.current_stock, p.reorder_point,
           p.store_location, 'low_stock' as alert_type,
           CASE 
             WHEN p.current_stock <= p.reorder_point * 0.5 THEN 'critical'
             WHEN p.current_stock <= p.reorder_point * 0.8 THEN 'warning'
             ELSE 'info'
           END as severity,
           'Stock level is critically low' as message
    FROM products p
    WHERE p.current_stock <= p.reorder_point
    ORDER BY p.current_stock ASC
  `;
  
  const lowStockResult = await query(lowStockQuery);
  alerts.push(...lowStockResult.rows);
  
  // Out of stock alerts
  const outOfStockQuery = `
    SELECT p.id, p.name, p.sku, p.category, p.current_stock, p.reorder_point,
           p.store_location, 'out_of_stock' as alert_type,
           'critical' as severity,
           'Product is out of stock' as message
    FROM products p
    WHERE p.current_stock = 0
  `;
  
  const outOfStockResult = await query(outOfStockQuery);
  alerts.push(...outOfStockResult.rows);
  
  // Overstock alerts
  const overstockQuery = `
    SELECT p.id, p.name, p.sku, p.category, p.current_stock, p.reorder_point,
           p.store_location, 'overstock' as alert_type,
           'warning' as severity,
           'Stock level is excessive' as message
    FROM products p
    WHERE p.current_stock > p.reorder_point * 3
  `;
  
  const overstockResult = await query(overstockQuery);
  alerts.push(...overstockResult.rows);
  
  return alerts;
}

async function getProductDetails(productIds) {
  const queryStr = `
    SELECT id, name, sku, category, current_stock, selling_price, store_location
    FROM products 
    WHERE id = ANY($1)
  `;
  
  const result = await query(queryStr, [productIds]);
  return result.rows;
}

