# Retail Intelligence Engine - API Documentation

## Overview
The Retail Intelligence Engine provides a comprehensive REST API for retail analytics, forecasting, and inventory management.

## Base URL
- Development: `http://localhost:4000`
- Production: `https://your-domain.com/api`

## Authentication
The API uses JWT (JSON Web Token) authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### Authentication

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "user"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Get Profile
```http
GET /auth/profile
Authorization: Bearer <token>
```

### Sales Management

#### Create Sale
```http
POST /sales
Content-Type: application/json

{
  "productId": "uuid",
  "quantity": 10,
  "price": 29.99,
  "soldAt": "2024-01-01T12:00:00Z"
}
```

#### Get Sales Time Series
```http
GET /sales/series/{productId}?limit=60
```

#### Get Sales Metrics
```http
GET /sales/metrics/{productId}?startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer <token>
```

#### Get Top Selling Products
```http
GET /sales/top-products?startDate=2024-01-01&endDate=2024-01-31&limit=10
Authorization: Bearer <token>
```

### Inventory Management

#### Create Product
```http
POST /inventory/products
Authorization: Bearer <token>
Content-Type: application/json

{
  "sku": "PROD-001",
  "name": "Product Name",
  "description": "Product description",
  "category": "Electronics",
  "leadTimeDays": 7,
  "unitCost": 25.00,
  "sellingPrice": 49.99,
  "currentStock": 100,
  "supplierId": "uuid"
}
```

#### Get Products
```http
GET /inventory/products?limit=50&offset=0&category=Electronics
Authorization: Bearer <token>
```

#### Get Product Details
```http
GET /inventory/products/{productId}
Authorization: Bearer <token>
```

#### Update Product
```http
PUT /inventory/products/{productId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Product Name",
  "sellingPrice": 59.99
}
```

#### Get Stock Levels
```http
GET /inventory/stock/{productId}
Authorization: Bearer <token>
```

#### Adjust Stock
```http
POST /inventory/stock/{productId}/adjust
Authorization: Bearer <token>
Content-Type: application/json

{
  "quantity": 10,
  "transactionType": "purchase",
  "referenceId": "uuid",
  "notes": "Stock adjustment"
}
```

#### Get Low Stock Alerts
```http
GET /inventory/alerts/low-stock
Authorization: Bearer <token>
```

### Forecasting

#### Generate Forecast
```http
POST /forecasting
Content-Type: application/json

{
  "productId": "uuid",
  "horizon": 14
}
```

#### Get Forecasts
```http
GET /forecasting/product/{productId}?limit=10&modelName=ARIMA
Authorization: Bearer <token>
```

#### Get Latest Forecast
```http
GET /forecasting/latest/{productId}
Authorization: Bearer <token>
```

#### Get Forecast Metrics
```http
GET /forecasting/metrics/{productId}?startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer <token>
```

### Analytics

#### Get Sales Analytics
```http
GET /analytics/sales?startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer <token>
```

#### Get Product Performance
```http
GET /analytics/products/performance?startDate=2024-01-01&endDate=2024-01-31&limit=10
Authorization: Bearer <token>
```

#### Get Category Analytics
```http
GET /analytics/categories?startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer <token>
```

#### Get Inventory Analytics
```http
GET /analytics/inventory
Authorization: Bearer <token>
```

#### Get Dashboard Summary
```http
GET /analytics/dashboard/summary?startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer <token>
```

### Optimization

#### Generate Stock Optimization
```http
POST /optimization/stock/{productId}
Authorization: Bearer <token>
```

#### Get Recommendations
```http
GET /optimization/recommendations/{productId}?limit=10&implemented=false
Authorization: Bearer <token>
```

## Response Formats

### Success Response
```json
{
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "error": "Error message",
  "details": "Additional error details"
}
```

### Validation Error
```json
{
  "error": "Validation failed",
  "fields": {
    "fieldName": "Error message for this field"
  }
}
```

## Rate Limiting
- General API: 10 requests per second
- Authentication endpoints: 5 requests per minute
- Burst allowance: 20 requests

## HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

## SDK Examples

### JavaScript/Node.js
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:4000',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Get products
const products = await api.get('/inventory/products');

// Create sale
const sale = await api.post('/sales', {
  productId: 'uuid',
  quantity: 10,
  price: 29.99
});
```

### Python
```python
import requests

headers = {
  'Authorization': f'Bearer {token}',
  'Content-Type': 'application/json'
}

# Get products
response = requests.get('http://localhost:4000/inventory/products', headers=headers)
products = response.json()

# Create sale
sale_data = {
  'productId': 'uuid',
  'quantity': 10,
  'price': 29.99
}
response = requests.post('http://localhost:4000/sales', json=sale_data, headers=headers)
sale = response.json()
```

## Webhooks
Configure webhooks to receive real-time notifications:

### Low Stock Alert
```json
{
  "event": "low_stock",
  "productId": "uuid",
  "currentStock": 5,
  "reorderPoint": 10,
  "timestamp": "2024-01-01T12:00:00Z"
}
```

### Forecast Generated
```json
{
  "event": "forecast_generated",
  "productId": "uuid",
  "modelUsed": "ARIMA",
  "horizon": 14,
  "accuracy": 0.95,
  "timestamp": "2024-01-01T12:00:00Z"
}
```

## Pagination
List endpoints support pagination:
```http
GET /inventory/products?limit=20&offset=40
```

- `limit`: Number of items per page (max: 100)
- `offset`: Number of items to skip

## Error Handling
Always check the HTTP status code and handle errors appropriately:

```javascript
try {
  const response = await api.get('/inventory/products');
  console.log(response.data);
} catch (error) {
  if (error.response) {
    // Server responded with error status
    console.error('Error:', error.response.data.error);
  } else if (error.request) {
    // Network error
    console.error('Network error:', error.message);
  } else {
    // Other error
    console.error('Error:', error.message);
  }
}
```
