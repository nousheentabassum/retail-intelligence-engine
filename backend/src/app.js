import express from "express";
import helmet from "helmet";
import cors from "cors";
import { loggerMiddleware } from "./middlewares/logger.middleware.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import { apiRateLimiter } from "./middlewares/rateLimit.middleware.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { salesRouter } from "./modules/sales/sales.routes.js";
import { forecastingRouter } from "./modules/forecasting/forecasting.routes.js";
import { optimizationRouter } from "./modules/optimization/optimization.routes.js";
import { ingestionRouter } from "./modules/data-ingestion/ingestion.routes.js";
import { inventoryRouter } from "./modules/inventory/inventory.routes.js";
import { analyticsRouter } from "./modules/analytics/analytics.routes.js";
import { recommendationsRouter } from "./modules/recommendations/recommendations.routes.js";
import { reportsRouter } from "./modules/reports/reports.routes.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(loggerMiddleware);
app.use(apiRateLimiter);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Authentication routes
app.use("/auth", authRouter);

// API routes
app.use("/sales", salesRouter);
app.use("/ingestion", ingestionRouter);
app.use("/inventory", inventoryRouter);
app.use("/forecasting", forecastingRouter);
app.use("/optimization", optimizationRouter);
app.use("/analytics", analyticsRouter);
app.use("/recommendations", recommendationsRouter);
app.use("/reports", reportsRouter);

app.use(errorMiddleware);

export { app };

