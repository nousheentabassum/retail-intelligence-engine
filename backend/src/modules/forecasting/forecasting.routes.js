import { Router } from "express";
import { 
  createForecast, 
  getForecasts, 
  getLatestForecast, 
  getForecastMetrics 
} from "./forecasting.controller.js";
import { authMiddleware } from "../auth/auth.middleware.js";

export const forecastingRouter = Router();

// Public routes (for demo purposes)
forecastingRouter.post("/", createForecast);

// Protected routes
forecastingRouter.use(authMiddleware);

forecastingRouter.get("/", getForecasts);
forecastingRouter.get("/product/:productId", getForecasts);
forecastingRouter.get("/latest/:productId", getLatestForecast);
forecastingRouter.get("/metrics/:productId", getForecastMetrics);

