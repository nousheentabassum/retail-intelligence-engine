import { jest } from '@jest/globals';
import request from 'supertest';
import { app } from '../src/app.js';
import { initDb, closeDb } from '../src/config/db.js';
            
describe('Inventory Endpoints', () => {
  let authToken;

  beforeAll(async () => {
    await initDb();
    
    const loginResponse = await request(app)
      .post('/auth/login')
      .send({
        email: 'admin@retail-intel.com',
        password: 'admin123'
      });
    
    authToken = loginResponse.body.token;
  });

  afterAll(async () => {
    await closeDb();
  });

  describe('GET /inventory/:productId', () => {
    it('should return inventory view for product', async () => {
      const response = await request(app)
        .get('/inventory/demo-product')
        .expect(200);

      expect(response.body).toHaveProperty('productId');
      expect(response.body).toHaveProperty('avgDailyDemand');
      expect(response.body).toHaveProperty('estimatedCurrentStock');
      expect(response.body).toHaveProperty('daysOfCover');
    });
  });

  describe('POST /inventory/products (protected)', () => {
    it('should create a new product', async () => {
      const productData = {
        sku: 'TEST-001',
        name: 'Test Product',
        description: 'Test Description',
        category: 'Electronics',
        leadTimeDays: 7,
        unitCost: 25.00,
        sellingPrice: 49.99,
        currentStock: 100
      };

      const response = await request(app)
        .post('/inventory/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(productData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('sku', productData.sku);
      expect(response.body).toHaveProperty('name', productData.name);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/inventory/products')
        .send({})
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/inventory/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /inventory/products (protected)', () => {
    it('should return list of products', async () => {
      const response = await request(app)
        .get('/inventory/products')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('id');
        expect(response.body[0]).toHaveProperty('sku');
        expect(response.body[0]).toHaveProperty('name');
      }
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/inventory/products?limit=5&offset=0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.length).toBeLessThanOrEqual(5);
    });
  });

  describe('GET /inventory/products/:productId (protected)', () => {
    it('should return specific product', async () => {
      // First create a product to test
      const createResponse = await request(app)
        .post('/inventory/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sku: 'TEST-002',
          name: 'Test Product 2',
          category: 'Electronics',
          unitCost: 30.00,
          sellingPrice: 59.99,
          currentStock: 50
        });

      const productId = createResponse.body.id;

      const response = await request(app)
        .get(`/inventory/products/${productId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', productId);
      expect(response.body).toHaveProperty('sku', 'TEST-002');
    });

    it('should return 404 for non-existent product', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      
      const response = await request(app)
        .get(`/inventory/products/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Product not found');
    });
  });

  describe('GET /inventory/alerts/low-stock (protected)', () => {
    it('should return low stock alerts', async () => {
      const response = await request(app)
        .get('/inventory/alerts/low-stock')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('POST /inventory/stock/:productId/adjust (protected)', () => {
    let testProductId;

    beforeAll(async () => {
      const createResponse = await request(app)
        .post('/inventory/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sku: 'TEST-003',
          name: 'Test Product 3',
          category: 'Electronics',
          unitCost: 20.00,
          sellingPrice: 39.99,
          currentStock: 100
        });
      
      testProductId = createResponse.body.id;
    });

    it('should adjust stock levels', async () => {
      const adjustmentData = {
        quantity: 10,
        transactionType: 'purchase',
        notes: 'Test stock adjustment'
      };

      const response = await request(app)
        .post(`/inventory/stock/${testProductId}/adjust`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(adjustmentData)
        .expect(200);

      expect(response.body).toHaveProperty('newStock');
      expect(response.body).toHaveProperty('message');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post(`/inventory/stock/${testProductId}/adjust`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.error).toContain('quantity and transactionType are required');
    });
  });
});
