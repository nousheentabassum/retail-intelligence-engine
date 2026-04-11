import * as salesService from "./sales.service.js";

export async function createSale(req, res, next) {
  try {
    const { productId, quantity, price, soldAt } = req.body;
    const sale = await salesService.recordSale({
      productId,
      quantity,
      price,
      soldAt: soldAt || new Date().toISOString()
    });
    res.status(201).json(sale);
  } catch (err) {
    next(err);
  }
}

export async function getSeries(req, res, next) {
  try {
    const { productId } = req.params;
    const { limit } = req.query;
    const data = await salesService.getSalesTimeSeries(productId, {
      limit: limit ? Number(limit) : undefined
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function getSalesByProduct(req, res, next) {
  try {
    const { productId } = req.params;
    const { limit, offset } = req.query;
    const data = await salesService.getSalesByProduct(productId, {
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function getSalesMetrics(req, res, next) {
  try {
    const { productId } = req.params;
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        error: "startDate and endDate query parameters are required" 
      });
    }
    
    const metrics = await salesService.getSalesMetrics(productId, startDate, endDate);
    res.json(metrics);
  } catch (err) {
    next(err);
  }
}

export async function getTopSellingProducts(req, res, next) {
  try {
    const { limit, startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        error: "startDate and endDate query parameters are required" 
      });
    }
    
    const products = await salesService.getTopSellingProducts(
      limit ? Number(limit) : 10,
      startDate,
      endDate
    );
    res.json(products);
  } catch (err) {
    next(err);
  }
}

