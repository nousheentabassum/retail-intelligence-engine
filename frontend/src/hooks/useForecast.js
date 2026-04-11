"use client";

import { useState } from "react";
import { fetchForecast, fetchSalesSeries } from "../services/forecasting.service";

export function useForecast() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function run(productId, horizon) {
    setLoading(true);
    setError("");
    try {
      const [series, forecast] = await Promise.all([
        fetchSalesSeries(productId, 120),
        fetchForecast(productId, horizon)
      ]);
      return { series, forecast };
    } catch (err) {
      setError("Failed to run forecast");
      throw err;
    } finally {
      setLoading(false);
    }
  }

  return { run, loading, error };
}

