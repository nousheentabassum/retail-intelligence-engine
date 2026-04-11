"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend
} from "recharts";
import { useAuth } from "../../hooks/useAuth";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export default function ForecastingPage() {
  const [products, setProducts] = useState([]);
  const [productId, setProductId] = useState("");
  const [horizon, setHorizon] = useState(14);
  const [series, setSeries] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [modelUsed, setModelUsed] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { authService } = useAuth();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/inventory/products`, {
        headers: {
          Authorization: authService.getAuthHeader()
        }
      });
      setProducts(res.data);
      if (res.data.length > 0) {
        setProductId(res.data[0].id);
      }
    } catch (err) {
      console.error("Failed to load products:", err);
    }
  };

  async function handleRunForecast(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      // Get sales series first
      let seriesRes;
      try {
        seriesRes = await axios.get(`${BACKEND_URL}/sales/series/${productId}`, {
          params: { limit: 120 },
          headers: {
            Authorization: authService.getAuthHeader()
          }
        });
      } catch (seriesErr) {
        // If no sales data, create dummy data
        seriesRes = {
          data: {
            dates: [],
            quantities: []
          }
        };
      }

      // Generate forecast
      const forecastRes = await axios.post(`${BACKEND_URL}/forecasting`, {
        productId,
        horizon: Number(horizon)
      }, {
        headers: {
          Authorization: authService.getAuthHeader()
        }
      });

      const historicPoints =
        seriesRes.data.dates?.map((d, i) => ({
          date: d,
          actual: seriesRes.data.quantities[i]
        })) || [];

      const forecastPoints = forecastRes.data.forecasts.map((value, idx) => ({
        date: `T+${idx + 1}`,
        forecast: value
      }));

      setSeries([...historicPoints, ...forecastPoints]);
      setMetrics(forecastRes.data.metrics);
      setModelUsed(forecastRes.data.model_used);
    } catch (err) {
      console.error(err);
      setError("Failed to run forecast. Ensure backend and AI engine are running.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Forecasting</h2>
        <p className="text-sm text-slate-400">
          Run forecasts for a given product, powered by the AI engine (moving average,
          linear regression, and ARIMA with automatic model selection).
        </p>
      </div>

      <form
        onSubmit={handleRunForecast}
        className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-4 max-w-xl"
      >
        <div className="grid grid-cols-2 gap-4">
          <label className="text-sm flex flex-col gap-1">
            <span className="text-slate-300">Product</span>
            <select
              className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-sm"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
            >
              <option value="">Select a product</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.sku})
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm flex flex-col gap-1">
            <span className="text-slate-300">Horizon (days)</span>
            <input
              type="number"
              min={1}
              max={60}
              className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-sm"
              value={horizon}
              onChange={(e) => setHorizon(e.target.value)}
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center px-3 py-1.5 text-sm rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 disabled:opacity-60"
        >
          {loading ? "Running forecast..." : "Run forecast"}
        </button>

        {error && <p className="text-xs text-red-400">{error}</p>}
      </form>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-slate-900 rounded-lg border border-slate-800 p-4 h-80">
          <h3 className="text-sm font-medium mb-3 text-slate-200">
            Time-series & forecast
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#020617",
                  borderColor: "#1e293b"
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="actual"
                name="Actual"
                stroke="#22c55e"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="forecast"
                name="Forecast"
                stroke="#eab308"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-3">
          <div className="bg-slate-900 rounded-lg border border-slate-800 p-3">
            <div className="text-xs text-slate-400 mb-1">Model selected</div>
            <div className="text-lg font-semibold">
              {modelUsed || "—"}
            </div>
          </div>
          <div className="bg-slate-900 rounded-lg border border-slate-800 p-3">
            <div className="text-xs text-slate-400 mb-1">MAPE</div>
            <div className="text-lg font-semibold">
              {metrics?.mape != null ? `${metrics.mape.toFixed(2)}%` : "—"}
            </div>
          </div>
          <div className="bg-slate-900 rounded-lg border border-slate-800 p-3">
            <div className="text-xs text-slate-400 mb-1">RMSE</div>
            <div className="text-lg font-semibold">
              {metrics?.rmse != null ? metrics.rmse.toFixed(2) : "—"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

