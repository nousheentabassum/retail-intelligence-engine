import cron from "node-cron";
import { runPrecomputeForecastsJob } from "./precomputeForecasts.job.js";

export function startJobs() {
  // Run nightly at 2 AM server time
  cron.schedule("0 2 * * *", () => {
    runPrecomputeForecastsJob().catch((err) => {
      console.error("Scheduled precompute forecasts job error", err);
    });
  });

  // Optionally warm cache once at startup (commented out for now)
  // runPrecomputeForecastsJob().catch((err) => {
  //   console.error("Initial precompute forecasts job error", err);
  // });
}

