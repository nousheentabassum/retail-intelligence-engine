import { drainForecastTasks } from "./forecast.queue.js";
import { generateForecast } from "../modules/forecasting/forecasting.service.js";

export async function processQueueOnce() {
  const tasks = drainForecastTasks();
  const results = [];
  for (const task of tasks) {
    const output = await generateForecast(task);
    results.push(output);
  }
  return results;
}

