"use client";

import { useState } from "react";
import axios from "axios";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export default function OptimizationPage() {
  const [form, setForm] = useState({
    forecast: "10,12,15,14,13,16,18",
    demandStdDev: 4,
    leadTimeDays: 7,
    serviceFactor: 1.65,
    unitMargin: 5,
    annualDemand: 2000,
    orderCost: 50,
    holdingCostPerUnit: 2,
    currentStock: 150
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const forecastArray = form.forecast
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean)
        .map((v) => Number(v))
        .filter((v) => !Number.isNaN(v));

      const payload = {
        forecast: forecastArray,
        demandStdDev: Number(form.demandStdDev),
        leadTimeDays: Number(form.leadTimeDays),
        serviceFactor: Number(form.serviceFactor),
        unitMargin: Number(form.unitMargin),
        annualDemand: Number(form.annualDemand),
        orderCost: Number(form.orderCost),
        holdingCostPerUnit: Number(form.holdingCostPerUnit),
        currentStock: Number(form.currentStock)
      };

      const res = await axios.post(`${BACKEND_URL}/optimization`, payload);
      setResult(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to compute optimization. Ensure backend is running.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Optimization</h2>
        <p className="text-sm text-slate-400">
          Compute safety stock, reorder point, EOQ, and profit impact for a
          product given a forecast and a few business parameters.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-4"
      >
        <div className="grid md:grid-cols-2 gap-4">
          <label className="text-sm flex flex-col gap-1">
            <span className="text-slate-300">Forecast horizon values</span>
            <textarea
              className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs min-h-[60px]"
              value={form.forecast}
              onChange={(e) => updateField("forecast", e.target.value)}
              placeholder="Comma-separated daily forecast (e.g. 10,12,15,14)"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs flex flex-col gap-1">
              <span className="text-slate-300">Demand std dev</span>
              <input
                type="number"
                className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs"
                value={form.demandStdDev}
                onChange={(e) => updateField("demandStdDev", e.target.value)}
              />
            </label>
            <label className="text-xs flex flex-col gap-1">
              <span className="text-slate-300">Lead time (days)</span>
              <input
                type="number"
                className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs"
                value={form.leadTimeDays}
                onChange={(e) => updateField("leadTimeDays", e.target.value)}
              />
            </label>
            <label className="text-xs flex flex-col gap-1">
              <span className="text-slate-300">Service factor (z-score)</span>
              <input
                type="number"
                step="0.01"
                className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs"
                value={form.serviceFactor}
                onChange={(e) => updateField("serviceFactor", e.target.value)}
              />
            </label>
            <label className="text-xs flex flex-col gap-1">
              <span className="text-slate-300">Unit margin</span>
              <input
                type="number"
                className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs"
                value={form.unitMargin}
                onChange={(e) => updateField("unitMargin", e.target.value)}
              />
            </label>
            <label className="text-xs flex flex-col gap-1">
              <span className="text-slate-300">Annual demand</span>
              <input
                type="number"
                className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs"
                value={form.annualDemand}
                onChange={(e) => updateField("annualDemand", e.target.value)}
              />
            </label>
            <label className="text-xs flex flex-col gap-1">
              <span className="text-slate-300">Order cost</span>
              <input
                type="number"
                className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs"
                value={form.orderCost}
                onChange={(e) => updateField("orderCost", e.target.value)}
              />
            </label>
            <label className="text-xs flex flex-col gap-1">
              <span className="text-slate-300">Holding cost / unit</span>
              <input
                type="number"
                className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs"
                value={form.holdingCostPerUnit}
                onChange={(e) => updateField("holdingCostPerUnit", e.target.value)}
              />
            </label>
            <label className="text-xs flex flex-col gap-1">
              <span className="text-slate-300">Current stock</span>
              <input
                type="number"
                className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs"
                value={form.currentStock}
                onChange={(e) => updateField("currentStock", e.target.value)}
              />
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center px-3 py-1.5 text-sm rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 disabled:opacity-60"
        >
          {loading ? "Computing..." : "Compute recommendation"}
        </button>

        {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
      </form>

      {result && (
        <div className="grid md:grid-cols-4 gap-4 text-sm">
          <div className="bg-slate-900 rounded-lg border border-slate-800 p-3">
            <div className="text-slate-400 mb-1 text-xs">Avg daily demand</div>
            <div className="text-lg font-semibold">
              {result.avgDailyDemand?.toFixed(2)}
            </div>
          </div>
          <div className="bg-slate-900 rounded-lg border border-slate-800 p-3">
            <div className="text-slate-400 mb-1 text-xs">Safety stock</div>
            <div className="text-lg font-semibold">
              {Math.round(result.safetyStock ?? 0)}
            </div>
          </div>
          <div className="bg-slate-900 rounded-lg border border-slate-800 p-3">
            <div className="text-slate-400 mb-1 text-xs">Reorder point</div>
            <div className="text-lg font-semibold">
              {Math.round(result.reorderPoint ?? 0)}
            </div>
          </div>
          <div className="bg-slate-900 rounded-lg border border-slate-800 p-3">
            <div className="text-slate-400 mb-1 text-xs">EOQ</div>
            <div className="text-lg font-semibold">
              {result.eoq != null ? Math.round(result.eoq) : "—"}
            </div>
          </div>

          <div className="bg-slate-900 rounded-lg border border-slate-800 p-3 md:col-span-4">
            <div className="text-slate-400 mb-1 text-xs">Profit impact (horizon)</div>
            <div className="flex gap-6">
              <div>
                <div className="text-xs text-slate-400">Realized profit</div>
                <div className="text-lg font-semibold">
                  ${Math.round(result.profitImpact?.realizedProfit ?? 0)}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Lost profit</div>
                <div className="text-lg font-semibold">
                  ${Math.round(result.profitImpact?.lostProfit ?? 0)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

