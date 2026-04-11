import axios from "axios";
import { env } from "../../config/env.js";

export async function requestForecast({ productId, dates, quantities, horizon }) {
  const url = `${env.aiEngineUrl}/forecast`;
  const response = await axios.post(url, {
    product_id: productId,
    dates,
    quantities,
    horizon
  });
  return response.data;
}

