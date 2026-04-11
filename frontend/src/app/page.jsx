"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Retail Intelligence Engine</h2>
        <p className="text-sm text-slate-400 max-w-2xl">
          An AI-driven demand forecasting and procurement optimization engine. Ingest
          raw sales, run time-series models (moving average, linear regression, ARIMA),
          compare metrics, and turn forecasts into reorder and safety stock decisions.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Link href="/dashboard" className="card p-4 hover:border-emerald-500/70">
          <h3 className="text-sm font-semibold mb-1">Executive dashboard</h3>
          <p className="text-xs text-slate-400">
            Combined view of historical sales and model forecasts for a demo product,
            plus core accuracy metrics (MAPE, RMSE).
          </p>
        </Link>
        <Link href="/forecasting" className="card p-4 hover:border-emerald-500/70">
          <h3 className="text-sm font-semibold mb-1">Forecasting lab</h3>
          <p className="text-xs text-slate-400">
            Trigger the AI microservice, which evaluates multiple time-series models
            and selects the best one based on RMSE.
          </p>
        </Link>
        <Link href="/optimization" className="card p-4 hover:border-emerald-500/70">
          <h3 className="text-sm font-semibold mb-1">Optimization sandbox</h3>
          <p className="text-xs text-slate-400">
            Experiment with reorder point, safety stock, EOQ, and profit impact for
            different demand patterns and business parameters.
          </p>
        </Link>
      </div>
    </div>
  );
}

