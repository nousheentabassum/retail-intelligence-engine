import { api } from "./api";

export async function fetchForecast(productId, horizon = 14) {
  const { data } = await api.post("/forecasting", { productId, horizon });
  return data;
}

export async function fetchSalesSeries(productId, limit = 120) {
  const { data } = await api.get(`/sales/series/${productId}`, { params: { limit } });
  return data;
}

