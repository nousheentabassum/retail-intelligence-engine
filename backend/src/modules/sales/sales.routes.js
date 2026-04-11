import { Router } from "express";
import { createSale, getSeries, getSalesByProduct, getSalesMetrics, getTopSellingProducts } from "./sales.controller.js";
import { authMiddleware } from "../auth/auth.middleware.js";

export const salesRouter = Router();

// Public routes (if needed for demo purposes)
salesRouter.post("/", createSale); // Consider protecting this in production
salesRouter.get("/series/:productId", getSeries);

// Protected routes
salesRouter.use(authMiddleware);

salesRouter.get("/product/:productId", getSalesByProduct);
salesRouter.get("/metrics/:productId", getSalesMetrics);
salesRouter.get("/top-products", getTopSellingProducts);

