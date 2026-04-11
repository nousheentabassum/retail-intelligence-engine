import { Router } from "express";
import { 
  getMetrics,
  getSalesAnalytics,
  getProductPerformance,
  getCategoryAnalytics,
  getInventoryAnalytics,
  getForecastAccuracy,
  getRevenueTrends,
  getDashboardSummary
} from "./analytics.controller.js";
import { authMiddleware } from "../auth/auth.middleware.js";

export const analyticsRouter = Router();

// Public routes (for demo purposes)
analyticsRouter.post("/metrics", getMetrics);

// Protected routes
analyticsRouter.use(authMiddleware);

analyticsRouter.get("/sales", getSalesAnalytics);
analyticsRouter.get("/products/performance", getProductPerformance);
analyticsRouter.get("/categories", getCategoryAnalytics);
analyticsRouter.get("/inventory", getInventoryAnalytics);
analyticsRouter.get("/forecast-accuracy", getForecastAccuracy);
analyticsRouter.get("/revenue-trends", getRevenueTrends);
analyticsRouter.get("/dashboard/summary", getDashboardSummary);

