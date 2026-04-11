import { api } from "./api";

export async function fetchInventory(productId) {
  const { data } = await api.get(`/inventory/${productId}`);
  return data;
}

