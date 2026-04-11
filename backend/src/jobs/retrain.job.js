import { runPrecomputeForecastsJob } from "./precomputeForecasts.job.js";

export async function runRetrainJob() {
  // In this baseline, retraining means refreshing models via latest data and warming cache.
  await runPrecomputeForecastsJob();
}

