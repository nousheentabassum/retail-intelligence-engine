import express from "express";
import helmet from "helmet";
import cors from "cors";
import { loggerMiddleware } from "./middlewares/logger.middleware.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import { salesRouter } from "./modules/sales/sales.routes.js";
import { forecastingRouter } from "./modules/forecasting/forecasting.routes.js";
import { optimizationRouter } from "./modules/optimization/optimization.routes.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(loggerMiddleware);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/sales", salesRouter);
app.use("/forecasting", forecastingRouter);
app.use("/optimization", optimizationRouter);

app.use(errorMiddleware);

export { app };

