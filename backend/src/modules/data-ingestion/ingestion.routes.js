import { Router } from "express";
import { ingestSales } from "./ingestion.controller.js";

export const ingestionRouter = Router();

ingestionRouter.post("/sales-batch", ingestSales);

