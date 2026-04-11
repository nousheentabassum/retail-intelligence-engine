import { query } from '../../config/db.js';

export async function createProduct(productData) {
  const { sku, name, description, category, leadTimeDays, unitCost, sellingPrice, currentStock, supplierId } = productData;
  
  const result = await query(
    `INSERT INTO products (sku, name, description, category, lead_time_days, unit_cost, selling_price, current_stock, supplier_id) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
     RETURNING *`,
    [sku, name, description, category, leadTimeDays, unitCost, sellingPrice, currentStock, supplierId]
  );
  
  return result.rows[0];
}

export async function getAllProducts(options = {}) {
  const { limit = 50, offset = 0, category } = options;
  
  let whereClause = '';
  const params = [];
  let paramIndex = 1;
  
  if (category) {
    whereClause = 'WHERE category = $1';
    params.push(category);
    paramIndex++;
  }
  
  const result = await query(
    `SELECT p.*, s.name as supplier_name 
     FROM products p 
     LEFT JOIN suppliers s ON p.supplier_id = s.id 
     ${whereClause}
     ORDER BY p.created_at DESC 
     LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    [...params, limit, offset]
  );
  
  return result.rows;
}

export async function getProductById(productId) {
  const result = await query(
    `SELECT p.*, s.name as supplier_name 
     FROM products p 
     LEFT JOIN suppliers s ON p.supplier_id = s.id 
     WHERE p.id = $1`,
    [productId]
  );
  
  return result.rows[0];
}

export async function updateProduct(productId, updateData) {
  const fields = [];
  const values = [];
  let paramIndex = 1;
  
  Object.keys(updateData).forEach(key => {
    if (updateData[key] !== undefined) {
      fields.push(`${key} = $${paramIndex++}`);
      values.push(updateData[key]);
    }
  });
  
  if (fields.length === 0) {
    throw new Error('No fields to update');
  }
  
  values.push(productId);
  
  const result = await query(
    `UPDATE products SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
  
  return result.rows[0];
}

export async function deleteProduct(productId) {
  const result = await query(
    'DELETE FROM products WHERE id = $1 RETURNING *',
    [productId]
  );
  
  return result.rows[0];
}

export async function getProductStock(productId) {
  const result = await query(
    'SELECT current_stock, reorder_point, safety_stock FROM products WHERE id = $1',
    [productId]
  );
  
  return result.rows[0];
}

export async function updateStock(productId, quantity, transactionType, referenceId = null, notes = '') {
  const result = await query(
    'BEGIN',
    []
  );
  
  try {
    // Update product stock
    const updateResult = await query(
      `UPDATE products 
       SET current_stock = current_stock + $1 
       WHERE id = $2 
       RETURNING current_stock`,
      [quantity, productId]
    );
    
    // Record inventory transaction
    await query(
      `INSERT INTO inventory_transactions (product_id, transaction_type, quantity, reference_id, notes) 
       VALUES ($1, $2, $3, $4, $5)`,
      [productId, transactionType, quantity, referenceId, notes]
    );
    
    await query('COMMIT', []);
    return updateResult.rows[0].current_stock;
  } catch (error) {
    await query('ROLLBACK', []);
    throw error;
  }
}

export async function getInventorySnapshot(productId) {
  const result = await query(
    `SELECT sold_at::date AS date, SUM(quantity)::int AS qty
     FROM sales
     WHERE product_id = $1
     GROUP BY date
     ORDER BY date DESC
     LIMIT 60`,
    [productId]
  );
  return result.rows.reverse();
}

export async function getLowStockProducts() {
  const result = await query(
    `SELECT p.*, s.name as supplier_name
     FROM products p
     LEFT JOIN suppliers s ON p.supplier_id = s.id
     WHERE p.current_stock <= p.reorder_point OR p.current_stock <= p.safety_stock
     ORDER BY p.current_stock ASC`,
    []
  );
  
  return result.rows;
}

export async function getInventoryTransactions(productId, options = {}) {
  const { limit = 50, offset = 0 } = options;
  
  const result = await query(
    `SELECT it.*, p.name as product_name
     FROM inventory_transactions it
     JOIN products p ON it.product_id = p.id
     WHERE it.product_id = $1
     ORDER BY it.created_at DESC
     LIMIT $2 OFFSET $3`,
    [productId, limit, offset]
  );
  
  return result.rows;
}

