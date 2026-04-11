import { query } from '../../config/db.js';

export async function generateExportReport(startDate, endDate, format = 'json') {
  try {
    // Get comprehensive data for the report
    const [
      salesAnalytics,
      inventoryAnalytics,
      topProducts,
      recommendations,
      forecastMetrics
    ] = await Promise.all([
      getSalesAnalytics(startDate, endDate),
      getInventoryAnalytics(),
      getTopProducts(startDate, endDate, 10),
      getRecommendations(startDate, endDate),
      getForecastMetrics(startDate, endDate)
    ]);

    const reportData = {
      metadata: {
        title: 'Retail Intelligence Engine Report',
        generatedAt: new Date().toISOString(),
        period: { startDate, endDate },
        format
      },
      executiveSummary: {
        totalRevenue: salesAnalytics.reduce((sum, day) => sum + Number(day.total_revenue), 0),
        totalTransactions: salesAnalytics.reduce((sum, day) => sum + Number(day.total_transactions), 0),
        totalProducts: inventoryAnalytics.total_products,
        lowStockAlerts: inventoryAnalytics.low_stock_count,
        recommendationsCount: recommendations.summary.totalRecommendations
      },
      salesAnalytics: salesAnalytics,
      inventoryAnalytics: inventoryAnalytics,
      topProducts: topProducts,
      recommendations: recommendations.recommendations,
      forecastMetrics: forecastMetrics
    };

    if (format === 'csv') {
      return generateCSV(reportData);
    } else if (format === 'pdf') {
      return generatePDF(reportData);
    } else {
      return reportData;
    }
  } catch (error) {
    console.error('Error generating export report:', error);
    throw error;
  }
}

async function getSalesAnalytics(startDate, endDate) {
  const result = await query(
    `SELECT 
       DATE(s.sold_at) as date,
       COUNT(s.id) as total_transactions,
       SUM(s.quantity) as total_quantity,
       SUM(s.total_amount) as total_revenue,
       AVG(s.unit_price) as avg_price,
       COUNT(DISTINCT s.product_id) as unique_products
     FROM sales s
     WHERE s.sold_at >= $1 AND s.sold_at <= $2
     GROUP BY DATE(s.sold_at)
     ORDER BY date DESC`,
    [startDate, endDate]
  );
  
  return result.rows;
}

async function getInventoryAnalytics() {
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

async function getTopProducts(startDate, endDate, limit) {
  const result = await query(
    `SELECT 
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
     WHERE s.sold_at >= $1 AND s.sold_at <= $2
     GROUP BY p.id, p.sku, p.name, p.category, p.current_stock, p.selling_price, p.unit_cost
     ORDER BY total_revenue DESC
     LIMIT $3`,
    [startDate, endDate, limit]
  );
  
  return result.rows;
}

async function getRecommendations(startDate, endDate) {
  // This would integrate with the recommendations service
  // For now, return mock data
  return {
    summary: {
      totalRecommendations: 15,
      highPriority: 5,
      mediumPriority: 7,
      lowPriority: 3
    },
    recommendations: []
  };
}

async function getForecastMetrics(startDate, endDate) {
  const result = await query(
    `SELECT 
       model_name,
       COUNT(*) as forecast_count,
       AVG((metrics->>'mape')::decimal) as avg_mape,
       AVG((metrics->>'rmse')::decimal) as avg_rmse
     FROM forecasts
     WHERE created_at >= $1 AND created_at <= $2
     GROUP BY model_name
     ORDER BY avg_mape ASC`,
    [startDate, endDate]
  );
  
  return result.rows;
}

function generateCSV(data) {
  const csvHeaders = [
    'Date',
    'Revenue',
    'Transactions',
    'Quantity',
    'Avg Price',
    'Unique Products'
  ];

  const csvRows = data.salesAnalytics.map(row => [
    row.date,
    row.total_revenue,
    row.total_transactions,
    row.total_quantity,
    row.avg_price,
    row.unique_products
  ]);

  const csvContent = [
    csvHeaders.join(','),
    ...csvRows.map(row => row.join(','))
  ].join('\n');

  return {
    filename: `retail-report-${data.metadata.period.startDate}.csv`,
    content: csvContent,
    mimeType: 'text/csv'
  };
}

function generatePDF(data) {
  // This would use a PDF library like puppeteer or jsPDF
  // For now, return a formatted text representation
  const pdfContent = `
RETAIL INTELLIGENCE ENGINE REPORT
Generated: ${new Date(data.metadata.generatedAt).toLocaleString()}
Period: ${data.metadata.period.startDate} to ${data.metadata.period.endDate}

EXECUTIVE SUMMARY
================
Total Revenue: $${data.executiveSummary.totalRevenue.toLocaleString()}
Total Transactions: ${data.executiveSummary.totalTransactions.toLocaleString()}
Total Products: ${data.executiveSummary.totalProducts}
Low Stock Alerts: ${data.executiveSummary.lowStockAlerts}
Recommendations: ${data.executiveSummary.recommendationsCount}

TOP PERFORMING PRODUCTS
======================
${data.topProducts.map((product, index) => 
  `${index + 1}. ${product.name} - Revenue: $${product.total_revenue.toLocaleString()}`
).join('\n')}

INVENTORY ANALYTICS
==================
Total Inventory Units: ${data.inventoryAnalytics.total_inventory_units}
Total Inventory Value: $${data.inventoryAnalytics.total_inventory_value.toLocaleString()}
Out of Stock Products: ${data.inventoryAnalytics.out_of_stock_count}
Average Stock per Product: ${Number(data.inventoryAnalytics.avg_stock_per_product || 0).toFixed(1)}

RECOMMENDATIONS
===============
${data.recommendations.map(rec => 
  `- ${rec.action}: ${rec.reason}`
).join('\n')}
  `.trim();

  return {
    filename: `retail-report-${data.metadata.period.startDate}.txt`,
    content: pdfContent,
    mimeType: 'text/plain'
  };
}
