'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'next/navigation';
import { AlertsPanel } from '../../components/AlertsPanel';
import { AdvancedFilters } from '../../components/AdvancedFilters';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [quickRange, setQuickRange] = useState('30days');
  const [advancedFilters, setAdvancedFilters] = useState({
    minRevenue: '',
    maxRevenue: '',
    minTransactions: '',
    maxTransactions: '',
    sortBy: 'date',
    sortOrder: 'desc'
  });

  const getQuickDateRange = (range) => {
    const now = new Date();
    let startDate;
    switch (range) {
      case '7days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case '30days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case '90days':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    }
    return { startDate, endDate: now.toISOString().split('T')[0] };
  };

  const handleQuickRangeChange = (range) => {
    setQuickRange(range);
    const newRange = getQuickDateRange(range);
    setDateRange(newRange);
  };
  
  const { authService } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }
    loadAnalytics();
  }, [dateRange, advancedFilters]);

  const loadAnalytics = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Build query string with advanced filters
      const queryParams = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        ...Object.fromEntries(
          Object.entries(advancedFilters).filter(([key, value]) => value !== '')
        )
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/analytics/dashboard/summary?${queryParams}`,
        {
          headers: {
            Authorization: authService.getAuthHeader()
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to load analytics');
      }
      
      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Business Analytics</h2>
        <p className="text-sm text-slate-400">
          Comprehensive insights into your retail performance with real-time alerts
        </p>
      </div>

      {/* Real-time Alerts */}
      <AlertsPanel userId={authService.getUser()?.id} />

      {/* Date Range Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Quick Range
            </label>
            <select
              value={quickRange}
              onChange={(e) => handleQuickRangeChange(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-sm text-white w-full"
            >
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-sm text-white"
            />
          </div>
          <div>
            <button
              onClick={loadAnalytics}
              className="px-4 py-1.5 bg-blue-500 hover:bg-blue-400 text-slate-950 rounded text-sm font-medium"
            >
              Update Analytics
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      <AdvancedFilters 
        onFilterChange={setAdvancedFilters}
        loading={loading}
      />

      {analytics && (
        <>
          {/* Revenue Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <h3 className="text-lg font-medium mb-4">Revenue Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.revenue.daily}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  stroke="#9ca3af"
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis 
                  stroke="#9ca3af"
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '6px'
                  }}
                  labelStyle={{ color: '#f3f4f6' }}
                  formatter={(value, name) => [`$${Number(value).toLocaleString()}`, name]}
                />
                <Line 
                  type="monotone" 
                  dataKey="total_revenue" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ fill: '#10b981', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Transactions Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <h3 className="text-lg font-medium mb-4">Transactions Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.transactions.daily}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  stroke="#9ca3af"
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis 
                  stroke="#9ca3af"
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '6px'
                  }}
                  labelStyle={{ color: '#f3f4f6' }}
                  formatter={(value, name) => [Number(value).toLocaleString(), name]}
                />
                <Bar 
                  dataKey="count" 
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
              <div className="text-sm text-slate-400 mb-1">Total Revenue</div>
              <div className="text-2xl font-bold text-emerald-400">
                ${analytics.revenue.total.toLocaleString()}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Trend: {analytics.revenue.trend}
              </div>
            </div>
            
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
              <div className="text-sm text-slate-400 mb-1">Total Transactions</div>
              <div className="text-2xl font-bold text-blue-400">
                {analytics.transactions.total.toLocaleString()}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Trend: {analytics.transactions.trend}
              </div>
            </div>
            
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
              <div className="text-sm text-slate-400 mb-1">Total Products</div>
              <div className="text-2xl font-bold text-purple-400">
                {analytics.inventory.total_products}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Low stock: {analytics.inventory.low_stock_count}
              </div>
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <h3 className="text-lg font-medium mb-3">Top Performing Products</h3>
            <div className="space-y-2">
              {analytics.topProducts.map((product, index) => (
                <div key={product.id} className="flex items-center justify-between p-2 bg-slate-800 rounded">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-500 text-slate-950 rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-xs text-slate-400">{product.sku}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">${Number(product.total_revenue).toLocaleString()}</div>
                    <div className="text-xs text-slate-400">{product.transaction_count} sales</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
