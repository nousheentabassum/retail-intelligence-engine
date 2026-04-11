import { optimizeReorder } from "./optimization.service.js";

export async function getOptimization(req, res, next) {
  try {
    const {
      demandStdDev,
      leadTimeDays,
      serviceFactor,
      unitMargin,
      annualDemand,
      orderCost,
      holdingCostPerUnit,
      currentStock
    } = req.body;

    const { forecast } = req.body;

    const result = optimizeReorder({
      forecast,
      demandStdDev,
      leadTimeDays,
      serviceFactor,
      unitMargin,
      annualDemand,
      orderCost,
      holdingCostPerUnit,
      currentStock
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
}

