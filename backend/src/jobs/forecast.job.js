import { runPrecomputeForecastsJob } from "./precomputeForecasts.job.js";

export async function runForecastJob() {
  await runPrecomputeForecastsJob();
}

