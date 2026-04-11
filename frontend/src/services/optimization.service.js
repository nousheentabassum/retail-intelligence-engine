import { api } from "./api";

export async function computeOptimization(payload) {
  const { data } = await api.post("/optimization", payload);
  return data;
}

