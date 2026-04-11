import { Router } from "express";
import { getRecommendations, getRecommendationHistory } from "./recommendations.controller.js";
import { authMiddleware } from "../auth/auth.middleware.js";

export const recommendationsRouter = Router();

// Protected routes
recommendationsRouter.use(authMiddleware);

recommendationsRouter.get("/", getRecommendations);
recommendationsRouter.get("/history", getRecommendationHistory);
