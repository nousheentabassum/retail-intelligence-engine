import { query } from '../../config/db.js';

export async function generateRecommendations(startDate, endDate) {
  try {
    console.log('Generating recommendations for:', { startDate, endDate });
    
    // Get products with low stock
    const lowStockQuery = `
      SELECT p.*, 
             AVG(s.quantity) as avg_daily_sales,
             COUNT(s.id) as recent_transactions,
             SUM(s.total_amount) as recent_revenue
      FROM products p
      LEFT JOIN sales s ON p.id = s.product_id 
        AND s.sold_at >= $1
      WHERE p.current_stock <= p.reorder_point
      GROUP BY p.id
      ORDER BY p.current_stock ASC
      LIMIT 10
    `;
    
    const lowStockProducts = await query(lowStockQuery, [startDate]);
    
    // Get products with declining sales
    const decliningSalesQuery = `
      SELECT p.*,
             recent_avg.avg_recent_sales,
             previous_avg.avg_previous_sales,
             (recent_avg.avg_recent_sales - previous_avg.avg_previous_sales) / previous_avg.avg_previous_sales * 100 as sales_decline_pct
      FROM products p
      LEFT JOIN (
        SELECT product_id, AVG(quantity) as avg_recent_sales
        FROM sales 
        WHERE sold_at >= $1
        GROUP BY product_id
      ) recent_avg ON p.id = recent_avg.product_id
      LEFT JOIN (
        SELECT product_id, AVG(quantity) as avg_previous_sales
        FROM sales 
        WHERE sold_at >= $2 AND sold_at < $1
        GROUP BY product_id
      ) previous_avg ON p.id = previous_avg.product_id
      WHERE recent_avg.avg_recent_sales < previous_avg.avg_previous_sales * 0.8
      ORDER BY sales_decline_pct ASC
      LIMIT 10
    `;
    
    const previousPeriodStart = new Date(new Date(startDate).getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const decliningSalesProducts = await query(decliningSalesQuery, [startDate, previousPeriodStart]);
    
    // Get overstocked products
    const overstockQuery = `
      SELECT p.*,
             AVG(s.quantity) as avg_daily_sales,
             COALESCE(p.current_stock / NULLIF(AVG(s.quantity), 0), 0)::numeric as days_of_supply
      FROM products p
      LEFT JOIN sales s ON p.id = s.product_id 
        AND s.sold_at >= $1
      WHERE p.current_stock > p.reorder_point * 2
      GROUP BY p.id
      HAVING AVG(s.quantity) > 0
      ORDER BY days_of_supply DESC
      LIMIT 10
    `;
    
    const overstockedProducts = await query(overstockQuery, [startDate]);
    
    // Get high performing products
    const topPerformersQuery = `
      SELECT p.*,
             SUM(s.quantity) as total_quantity,
             SUM(s.total_amount) as total_revenue,
             AVG(s.quantity) as avg_daily_sales,
             (SUM(s.total_amount) - (SUM(s.quantity) * p.unit_cost)) as gross_profit
      FROM products p
      JOIN sales s ON p.id = s.product_id
      WHERE s.sold_at >= $1 AND s.sold_at <= $2
      GROUP BY p.id
      ORDER BY gross_profit DESC
      LIMIT 10
    `;
    
    const topPerformers = await query(topPerformersQuery, [startDate, endDate]);
    
    // Generate recommendations
    const recommendations = [];
    
    // Low stock recommendations
    if (lowStockProducts && lowStockProducts.rows && lowStockProducts.rows.length > 0) {
      lowStockProducts.rows.forEach((product, index) => {
      const priorityScore = calculatePriorityScore('restock', product);
      recommendations.push({
        id: 'restock-' + product.id,
        type: 'restock',
        priority: priorityScore.level,
        priorityScore: priorityScore.score,
        product: {
          id: product.id,
          name: product.name,
          sku: product.sku,
          category: product.category,
          currentStock: product.current_stock,
          reorderPoint: product.reorder_point
        },
        action: 'Immediate restock recommended',
        quantity: Math.ceil(product.avg_daily_sales * 21), // 3 weeks supply
        urgency: priorityScore.level === 'high' ? 'immediate' : priorityScore.level === 'medium' ? 'within 3 days' : 'within 7 days',
        reason: 'Stock critically low at ' + product.current_stock + ' units (reorder point: ' + product.reorder_point + ')',
        estimatedImpact: 'Prevents ' + Math.ceil(product.avg_daily_sales * 7) + ' potential lost sales',
        confidence: 'high'
      });
    });
    }
    
    // Declining sales recommendations
    if (decliningSalesProducts && decliningSalesProducts.rows && decliningSalesProducts.rows.length > 0) {
      decliningSalesProducts.rows.forEach((product, index) => {
      const priorityScore = calculatePriorityScore('investigate', product);
      recommendations.push({
        id: 'investigate-' + product.id,
        type: 'investigate',
        priority: priorityScore.level,
        priorityScore: priorityScore.score,
        product: {
          id: product.id,
          name: product.name,
          sku: product.sku,
          category: product.category
        },
        action: 'Investigate sales decline',
        urgency: priorityScore.level === 'high' ? 'immediate investigation' : 'review this week',
        reason: 'Sales declined by ' + Math.abs(product.sales_decline_pct || 0).toFixed(1) + '% compared to previous period',
        estimatedImpact: 'Could recover ' + Math.ceil(product.avg_recent_sales * 7) + ' sales with intervention',
        confidence: 'medium'
      });
    });
    }
    
    // Overstock recommendations
    if (overstockedProducts && overstockedProducts.rows && overstockedProducts.rows.length > 0) {
      overstockedProducts.rows.forEach((product, index) => {
      const priorityScore = calculatePriorityScore('discount', product);
      const daysOfSupply = Number(product.days_of_supply || 0);
      recommendations.push({
        id: 'discount-' + product.id,
        type: 'discount',
        priority: priorityScore.level,
        priorityScore: priorityScore.score,
        product: {
          id: product.id,
          name: product.name,
          sku: product.sku,
          category: product.category,
          currentStock: product.current_stock,
          sellingPrice: product.selling_price
        },
        action: 'Promotional pricing recommended',
        discount: '15-25%',
        urgency: priorityScore.level === 'high' ? 'immediate promotion' : 'plan promotion',
        reason: 'Excess inventory with ' + daysOfSupply.toFixed(1) + ' days of supply',
        estimatedImpact: 'Could increase sales velocity by ' + Math.min(30, daysOfSupply * 2) + '%',
        confidence: 'medium'
      });
    });
    }
    
    // Top performer recommendations
    if (topPerformers && topPerformers.rows && topPerformers.rows.length > 0) {
      topPerformers.rows.forEach((product, index) => {
      const priorityScore = calculatePriorityScore('expand', product);
      const profit = Number(product.gross_profit || 0);
      recommendations.push({
        id: 'expand-' + product.id,
        type: 'expand',
        priority: priorityScore.level,
        priorityScore: priorityScore.score,
        product: {
          id: product.id,
          name: product.name,
          sku: product.sku,
          category: product.category
        },
        action: 'Expand inventory or marketing',
        urgency: 'opportunity',
        reason: 'Top performer with $' + profit.toFixed(2) + ' gross profit',
        estimatedImpact: 'Could increase revenue by $' + (profit * 0.3).toFixed(2) + ' with expanded inventory',
        confidence: 'high'
      });
    });
    }
    
    // Sort by priority score
    recommendations.sort((a, b) => b.priorityScore - a.priorityScore);
    
    return {
      summary: {
        totalRecommendations: recommendations.length,
        highPriority: recommendations.filter(r => r.priority === 'high').length,
        mediumPriority: recommendations.filter(r => r.priority === 'medium').length,
        lowPriority: recommendations.filter(r => r.priority === 'low').length,
        types: {
          restock: recommendations.filter(r => r.type === 'restock').length,
          investigate: recommendations.filter(r => r.type === 'investigate').length,
          discount: recommendations.filter(r => r.type === 'discount').length,
          expand: recommendations.filter(r => r.type === 'expand').length
        }
      },
      recommendations: recommendations.slice(0, 20), // Top 20 recommendations
      generatedAt: new Date().toISOString(),
      period: { startDate, endDate }
    };
    
  } catch (error) {
    console.error('Error generating recommendations:', error);
    throw error;
  }
}

function calculatePriorityScore(type, product) {
  let score = 0;
  let level = 'low';
  
  switch (type) {
    case 'restock':
      if (product.current_stock <= product.reorder_point * 0.5) {
        score = 90 + (product.reorder_point - product.current_stock);
        level = 'high';
      } else if (product.current_stock <= product.reorder_point * 0.8) {
        score = 60 + (product.reorder_point - product.current_stock);
        level = 'medium';
      } else {
        score = 30 + (product.reorder_point - product.current_stock);
        level = 'low';
      }
      break;
      
    case 'investigate':
      const declinePct = Math.abs(product.sales_decline_pct || 0);
      if (declinePct > 30) {
        score = 85 + declinePct;
        level = 'high';
      } else if (declinePct > 15) {
        score = 55 + declinePct;
        level = 'medium';
      } else {
        score = 25 + declinePct;
        level = 'low';
      }
      break;
      
    case 'discount':
      const daysOfSupply = Number(product.days_of_supply || 0);
      if (daysOfSupply > 60) {
        score = 80 + (daysOfSupply - 60);
        level = 'high';
      } else if (daysOfSupply > 30) {
        score = 50 + (daysOfSupply - 30);
        level = 'medium';
      } else {
        score = 20 + daysOfSupply;
        level = 'low';
      }
      break;
      
    case 'expand':
      const profit = Number(product.gross_profit || 0);
      if (profit > 1000) {
        score = 75 + (profit / 100);
        level = 'high';
      } else if (profit > 500) {
        score = 45 + (profit / 50);
        level = 'medium';
      } else {
        score = 15 + (profit / 25);
        level = 'low';
      }
      break;
      
    default:
      score = 50;
      level = 'medium';
  }
  
  return { score: Math.min(100, Math.round(score)), level };
}

export async function getRecommendationHistory(limit = 50) {
  const result = await query(
    `SELECT * FROM optimization_recommendations 
     ORDER BY created_at DESC 
     LIMIT $1`,
    [limit]
  );
  
  return result.rows;
}
