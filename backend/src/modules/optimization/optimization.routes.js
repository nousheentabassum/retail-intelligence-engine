import { Router } from "express";
import { getOptimization } from "./optimization.controller.js";

export const optimizationRouter = Router();

optimizationRouter.post("/", getOptimization);

