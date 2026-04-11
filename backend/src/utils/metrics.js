export function mape(actual, forecast) {
  if (!actual.length || actual.length !== forecast.length) {
    throw new Error("MAPE: arrays must be same non-zero length");
  }
  const n = actual.length;
  const sum = actual.reduce((acc, a, i) => {
    if (a === 0) return acc;
    return acc + Math.abs((a - forecast[i]) / a);
  }, 0);
  return (sum / n) * 100;
}

export function rmse(actual, forecast) {
  if (!actual.length || actual.length !== forecast.length) {
    throw new Error("RMSE: arrays must be same non-zero length");
  }
  const n = actual.length;
  const sumSq = actual.reduce((acc, a, i) => {
    const diff = a - forecast[i];
    return acc + diff * diff;
  }, 0);
  return Math.sqrt(sumSq / n);
}

export function forecastAccuracy(actual, forecast) {
  if (!actual.length || actual.length !== forecast.length) {
    throw new Error("Accuracy: arrays must be same non-zero length");
  }
  const n = actual.length;
  let correct = 0;
  for (let i = 1; i < n; i += 1) {
    const actualDir = Math.sign(actual[i] - actual[i - 1]);
    const forecastDir = Math.sign(forecast[i] - forecast[i - 1]);
    if (actualDir === forecastDir) correct += 1;
  }
  return (correct / (n - 1 || 1)) * 100;
}

export function stockoutPrecision(trueStockouts, predictedStockouts) {
  if (!trueStockouts.length || trueStockouts.length !== predictedStockouts.length) {
    throw new Error("Precision: arrays must be same non-zero length");
  }
  let tp = 0;
  let fp = 0;
  for (let i = 0; i < trueStockouts.length; i += 1) {
    if (predictedStockouts[i]) {
      if (trueStockouts[i]) tp += 1;
      else fp += 1;
    }
  }
  if (tp + fp === 0) return 0;
  return (tp / (tp + fp)) * 100;
}

