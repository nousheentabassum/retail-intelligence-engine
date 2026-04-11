import { jest } from '@jest/globals';
import request from 'supertest';
import { app } from '../src/app.js';
import { initDb, closeDb } from '../src/config/db.js';

describe('Sales Endpoints', () => {
  beforeAll(async () => {
    await initDb();
  });

  afterAll(async () => {
    await closeDb();
  });

  describe('POST /sales', () => {
    it('should create a new sale', async () => {
      const saleData = {
        productId: 'demo-product',
        quantity: 10,
        price: 29.99,
        soldAt: new Date().toISOString()
      };

      const response = await request(app)
        .post('/sales')
        .send(saleData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('productId', saleData.productId);
      expect(response.body).toHaveProperty('quantity', saleData.quantity);
      expect(response.body).toHaveProperty('unit_price', saleData.price);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/sales')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /sales/series/:productId', () => {
    it('should return sales time series for product', async () => {
      const response = await request(app)
        .get('/sales/series/demo-product')
        .expect(200);

      expect(response.body).toHaveProperty('dates');
      expect(response.body).toHaveProperty('quantities');
      expect(Array.isArray(response.body.dates)).toBe(true);
      expect(Array.isArray(response.body.quantities)).toBe(true);
    });

    it('should support limit parameter', async () => {
      const response = await request(app)
        .get('/sales/series/demo-product?limit=10')
        .expect(200);

      expect(response.body.dates.length).toBeLessThanOrEqual(10);
    });
  });

  describe('GET /sales/product/:productId (protected)', () => {
    let authToken;

    beforeAll(async () => {
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'admin@retail-intel.com',
          password: 'admin123'
        });
      
      authToken = loginResponse.body.token;
    });

    it('should return sales for product with authentication', async () => {
      const response = await request(app)
        .get('/sales/product/demo-product')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should reject request without authentication', async () => {
      const response = await request(app)
        .get('/sales/product/demo-product')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /sales/metrics/:productId (protected)', () => {
    let authToken;

    beforeAll(async () => {
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'admin@retail-intel.com',
          password: 'admin123'
        });
      
      authToken = loginResponse.body.token;
    });

    it('should return sales metrics for product', async () => {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = new Date().toISOString();

      const response = await request(app)
        .get(`/sales/metrics/demo-product?startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('total_transactions');
      expect(response.body).toHaveProperty('total_quantity');
      expect(response.body).toHaveProperty('total_revenue');
    });

    it('should require date parameters', async () => {
      const response = await request(app)
        .get('/sales/metrics/demo-product')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.error).toContain('startDate and endDate query parameters are required');
    });
  });
});
