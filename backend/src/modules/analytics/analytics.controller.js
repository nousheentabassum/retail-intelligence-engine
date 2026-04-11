import * as analyticsService from "./analytics.service.js";

export function getMetrics(req, res, next) {
  try {
    const result = analyticsService.computeAnalytics(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getSalesAnalytics(req, res, next) {
  try {
    const { 
      startDate, 
      endDate, 
      category, 
      shopLocation, 
      minRevenue, 
      maxRevenue,
      minTransactions,
      maxTransactions,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        error: 'startDate and endDate query parameters are required' 
      });
    }
    
    const filters = {
      category,
      shopLocation,
      minRevenue: minRevenue ? parseFloat(minRevenue) : null,
      maxRevenue: maxRevenue ? parseFloat(maxRevenue) : null,
      minTransactions: minTransactions ? parseInt(minTransactions) : null,
      maxTransactions: maxTransactions ? parseInt(maxTransactions) : null,
      sortBy,
      sortOrder
    };
    
    const analytics = await analyticsService.getSalesAnalytics(startDate, endDate, filters);
    res.json(analytics);
  } catch (err) {
    next(err);
  }
}

export async function getProductPerformance(req, res, next) {
  try {
    const { startDate, endDate, limit } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        error: 'startDate and endDate query parameters are required' 
      });
    }
    
    const performance = await analyticsService.getProductPerformance(
      startDate, 
      endDate, 
      limit ? Number(limit) : 10
    );
    res.json(performance);
  } catch (err) {
    next(err);
  }
}

export async function getCategoryAnalytics(req, res, next) {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        error: 'startDate and endDate query parameters are required' 
      });
    }
    
    const analytics = await analyticsService.getCategoryAnalytics(startDate, endDate);
    res.json(analytics);
  } catch (err) {
    next(err);
  }
}

export async function getInventoryAnalytics(req, res, next) {
  try {
    const analytics = await analyticsService.getInventoryAnalytics();
    res.json(analytics);
  } catch (err) {
    next(err);
  }
}

export async function getForecastAccuracy(req, res, next) {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        error: 'startDate and endDate query parameters are required' 
      });
    }
    
    const accuracy = await analyticsService.getForecastAccuracy(startDate, endDate);
    res.json(accuracy);
  } catch (err) {
    next(err);
  }
}

export async function getRevenueTrends(req, res, next) {
  try {
    const { startDate, endDate, groupBy } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        error: 'startDate and endDate query parameters are required' 
      });
    }
    
    const trends = await analyticsService.getRevenueTrends(startDate, endDate, groupBy);
    res.json(trends);
  } catch (err) {
    next(err);
  }
}

export async function getDashboardSummary(req, res, next) {
  try {
    const { 
      startDate, 
      endDate, 
      category, 
      shopLocation, 
      minRevenue, 
      maxRevenue,
      minTransactions,
      maxTransactions,
      sortBy,
      sortOrder
    } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        error: 'startDate and endDate query parameters are required' 
      });
    }
    
    const filters = {
      category,
      shopLocation,
      minRevenue: minRevenue ? parseFloat(minRevenue) : null,
      maxRevenue: maxRevenue ? parseFloat(maxRevenue) : null,
      minTransactions: minTransactions ? parseInt(minTransactions) : null,
      maxTransactions: maxTransactions ? parseInt(maxTransactions) : null,
      sortBy,
      sortOrder
    };
    
    const summary = await analyticsService.getDashboardSummary(startDate, endDate, filters);
    res.json(summary);
  } catch (err) {
    next(err);
  }
}

