import { Router } from "express";
import { exportReport } from "./reports.controller.js";
import { authMiddleware } from "../auth/auth.middleware.js";

export const reportsRouter = Router();

// Protected routes
reportsRouter.use(authMiddleware);

reportsRouter.get("/export", exportReport);
