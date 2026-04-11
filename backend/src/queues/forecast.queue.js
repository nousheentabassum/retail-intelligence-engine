const tasks = [];

export function enqueueForecastTask(task) {
  tasks.push({ ...task, enqueuedAt: new Date().toISOString() });
}

export function drainForecastTasks() {
  const copy = [...tasks];
  tasks.length = 0;
  return copy;
}

