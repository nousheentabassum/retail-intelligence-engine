import { Server } from 'socket.io';
import { query } from '../config/db.js';

class WebSocketService {
  constructor() {
    this.io = null;
    this.connectedClients = new Map();
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    });

    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);
      this.connectedClients.set(socket.id, socket);

      // Join user to their personal room for targeted alerts
      socket.on('join-user-room', (userId) => {
        socket.join(`user-${userId}`);
        console.log(`User ${userId} joined their room`);
      });

      // Handle stock alert subscriptions
      socket.on('subscribe-stock-alerts', () => {
        socket.join('stock-alerts');
        console.log('Client subscribed to stock alerts');
      });

      // Handle analytics subscriptions
      socket.on('subscribe-analytics', () => {
        socket.join('analytics-updates');
        console.log('Client subscribed to analytics updates');
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        this.connectedClients.delete(socket.id);
      });
    });

    // Start monitoring stock levels
    this.startStockMonitoring();
    this.startAnalyticsMonitoring();
  }

  async startStockMonitoring() {
    // Check stock levels every 30 seconds
    setInterval(async () => {
      try {
        const alerts = await this.getStockAlerts();
        if (alerts.length > 0) {
          this.io.to('stock-alerts').emit('stock-alert', {
            type: 'stock-alert',
            data: alerts,
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('Error in stock monitoring:', error);
      }
    }, 30000);
  }

  async startAnalyticsMonitoring() {
    // Update analytics every 5 minutes
    setInterval(async () => {
      try {
        const analytics = await this.getRealTimeAnalytics();
        this.io.to('analytics-updates').emit('analytics-update', {
          type: 'analytics-update',
          data: analytics,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error in analytics monitoring:', error);
      }
    }, 300000);
  }

  async getStockAlerts() {
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

  async getRealTimeAnalytics() {
    const today = new Date().toISOString().split('T')[0];
    
    const analyticsQuery = `
      SELECT 
        COUNT(*) as total_transactions_today,
        COALESCE(SUM(total_amount), 0) as total_revenue_today,
        COUNT(DISTINCT product_id) as products_sold_today,
        COUNT(DISTINCT s.store_location) as active_stores_today
      FROM sales s
      WHERE DATE(s.sold_at) = $1
    `;

    const result = await query(analyticsQuery, [today]);
    return result.rows[0] || {};
  }

  sendAlertToUser(userId, alert) {
    this.io.to(`user-${userId}`).emit('personal-alert', {
      type: 'personal-alert',
      data: alert,
      timestamp: new Date().toISOString()
    });
  }

  broadcastAlert(alert) {
    this.io.emit('broadcast-alert', {
      type: 'broadcast-alert',
      data: alert,
      timestamp: new Date().toISOString()
    });
  }

  getConnectedClientsCount() {
    return this.connectedClients.size;
  }
}

export const websocketService = new WebSocketService();
