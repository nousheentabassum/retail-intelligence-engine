'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'next/navigation';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    category: 'all',
    dateRange: '30days',
    storeLocation: 'all'
  });
  const [alerts, setAlerts] = useState([]);
  const [showRevenueAlert, setShowRevenueAlert] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  const { authService } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }
    loadDashboardData();
  }, [filters]);

  useEffect(() => {
    // Check for revenue dip alerts
    checkRevenueAlerts();
  }, [dashboardData]);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = getStartDate(filters.dateRange);
      
      console.log('Loading dashboard data with filters:', { startDate, endDate, filters });
      
      const queryParams = new URLSearchParams({
        startDate,
        endDate,
        ...(filters.category !== 'all' && { category: filters.category }),
        ...(filters.storeLocation !== 'all' && { shopLocation: filters.storeLocation })
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
        throw new Error('Failed to load dashboard data');
      }
      
      const data = await response.json();
      console.log('Dashboard data received:', data);
      setDashboardData(data);
      
      // Check for alerts
      if (data.revenue?.trend === 'decreasing') {
        setShowRevenueAlert(true);
      }
      
    } catch (err) {
      console.error('Dashboard data error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters, authService]);

  const checkRevenueAlerts = () => {
    if (!dashboardData) return;
    
    const newAlerts = [];
    
    // Revenue dip alert
    if (dashboardData.revenue.trend === 'decreasing') {
      newAlerts.push({
        id: 'revenue-dip',
        type: 'warning',
        title: 'Revenue Decline Detected',
        message: 'Revenue has decreased compared to previous period',
        action: 'View detailed analytics'
      });
    }
    
    // Low stock alerts
    if (dashboardData.inventory?.low_stock_count > 0) {
      newAlerts.push({
        id: 'low-stock',
        type: 'critical',
        title: 'Low Stock Alert',
        message: `${dashboardData.inventory.low_stock_count} products below reorder point`,
        action: 'View inventory'
      });
    }
    
    setAlerts(newAlerts);
  };

  const getStartDate = (range) => {
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
    console.log(`Date range ${range}: ${startDate} to ${now.toISOString().split('T')[0]}`);
    return startDate;
  };

  const handleChartClick = (data, type) => {
    // Handle drill-down functionality
    if (type === 'category' && data) {
      setSelectedCategory(data.category);
      setFilters(prev => ({ ...prev, category: data.category }));
    }
    console.log(`Drill down on ${type}:`, data);
  };

  const exportReport = async (format) => {
    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = getStartDate(filters.dateRange);
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/reports/export?startDate=${startDate}&endDate=${endDate}&format=${format}`,
        {
          headers: {
            Authorization: authService.getAuthHeader()
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to export report');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `retail-report-${startDate}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  // Prepare chart data with useMemo for performance
  const revenueChartData = useMemo(() => {
    return dashboardData?.revenue?.daily?.map(day => ({
      date: new Date(day.date).toLocaleDateString(),
      revenue: Number(day.total_revenue),
      transactions: Number(day.total_transactions)
    })) || [];
  }, [dashboardData?.revenue?.daily]);

  // Calculate category data from top products with useMemo
  const categoryData = useMemo(() => {
    if (!dashboardData?.topProducts) return [
      { name: 'Electronics', value: 0, color: '#3b82f6' },
      { name: 'Clothing', value: 0, color: '#10b981' },
      { name: 'Food & Beverage', value: 0, color: '#f59e0b' }
    ];

    return dashboardData.topProducts.reduce((acc, product) => {
      const existingCategory = acc.find(cat => cat.name === product.category);
      if (existingCategory) {
        existingCategory.value += Number(product.total_revenue) || 0;
      } else {
        acc.push({
          name: product.category,
          value: Number(product.total_revenue) || 0,
          color: product.category === 'Electronics' ? '#3b82f6' : 
                 product.category === 'Clothing' ? '#10b981' : 
                 product.category === 'Food & Beverage' ? '#f59e0b' : '#8b5cf6'
        });
      }
      return acc;
    }, []);
  }, [dashboardData?.topProducts]);

  console.log('Chart data prepared:', { revenueChartData, categoryData, topProducts: dashboardData?.topProducts });

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Metrics Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-lg p-4">
              <div className="h-4 bg-slate-700 rounded mb-2 w-3/4"></div>
              <div className="h-8 bg-slate-700 rounded mb-1 w-1/2"></div>
              <div className="h-4 bg-slate-700 rounded w-2/3"></div>
            </div>
          ))}
        </div>
        
        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <div className="h-4 bg-slate-700 rounded mb-4 w-1/3"></div>
            <div className="h-64 bg-slate-700 rounded animate-pulse"></div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <div className="h-4 bg-slate-700 rounded mb-4 w-1/3"></div>
            <div className="h-64 bg-slate-700 rounded animate-pulse"></div>
          </div>
        </div>
        
        {/* Top Products Skeleton */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <div className="h-4 bg-slate-700 rounded mb-4 w-1/4"></div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded bg-slate-800">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-slate-700 rounded-full"></div>
                  <div className="space-y-1">
                    <div className="h-4 bg-slate-700 rounded w-24"></div>
                    <div className="h-3 bg-slate-700 rounded w-32"></div>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <div className="h-4 bg-slate-700 rounded w-20"></div>
                  <div className="h-3 bg-slate-700 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
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
      {/* Header with Export */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold mb-2">Executive Dashboard</h2>
          <p className="text-sm text-slate-400">
            Real-time retail intelligence and insights
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => exportReport('csv')}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-400 text-slate-950 rounded text-sm font-medium"
          >
            Export CSV
          </button>
          <button
            onClick={() => exportReport('pdf')}
            className="px-4 py-2 bg-green-500 hover:bg-green-400 text-slate-950 rounded text-sm font-medium"
          >
            Export PDF
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Date Range
            </label>
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
              className="bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-sm text-white w-full"
            >
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              className="bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-sm text-white w-full"
            >
              <option value="all">All Categories</option>
              <option value="Electronics">Electronics</option>
              <option value="Clothing">Clothing</option>
              <option value="Food & Beverage">Food & Beverage</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Store Location
            </label>
            <select
              value={filters.storeLocation}
              onChange={(e) => setFilters(prev => ({ ...prev, storeLocation: e.target.value }))}
              className="bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-sm text-white w-full"
            >
              <option value="all">All Stores</option>
              <option value="Main Store">Main Store</option>
              <option value="Tech Store">Tech Store</option>
              <option value="Fashion Store">Fashion Store</option>
              <option value="Grocery Store">Grocery Store</option>
            </select>
          </div>
        </div>
      </div>

      {/* Alert Notifications */}
      {showRevenueAlert && (
        <div className="bg-yellow-900/50 border border-yellow-500 text-yellow-200 px-4 py-3 rounded">
          <div className="flex justify-between items-center">
            <div>
              <strong>Revenue Alert:</strong> Revenue has decreased compared to the previous period. 
              Consider reviewing sales strategy or running promotions.
            </div>
            <button
              onClick={() => setShowRevenueAlert(false)}
              className="text-yellow-400 hover:text-yellow-300"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div 
          className="bg-slate-900 border border-slate-800 rounded-lg p-4 cursor-pointer hover:border-emerald-500 transition-colors"
          onClick={() => handleChartClick(dashboardData.revenue, 'revenue')}
        >
          <div className="text-sm text-slate-400 mb-1">Total Revenue</div>
          <div className="text-2xl font-bold text-emerald-400">
            ${dashboardData?.revenue?.total?.toLocaleString() || '0'}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Trend: {dashboardData?.revenue?.trend || 'stable'}
          </div>
        </div>
        
        <div 
          className="bg-slate-900 border border-slate-800 rounded-lg p-4 cursor-pointer hover:border-blue-500 transition-colors"
          onClick={() => handleChartClick(dashboardData.transactions, 'transactions')}
        >
          <div className="text-sm text-slate-400 mb-1">Transactions</div>
          <div className="text-2xl font-bold text-blue-400">
            {dashboardData?.transactions?.total?.toLocaleString() || '0'}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Trend: {dashboardData?.transactions?.trend || 'stable'}
          </div>
        </div>
        
        <div 
          className={`border rounded-lg p-4 cursor-pointer transition-colors ${
            dashboardData?.inventory?.low_stock_count > 0 
              ? 'bg-red-900/20 border-red-500' 
              : 'bg-slate-900 border-slate-800'
          }`}
          onClick={() => handleChartClick(dashboardData.inventory, 'inventory')}
        >
          <div className="text-sm text-slate-400 mb-1">Low Stock Items</div>
          <div className={`text-2xl font-bold ${
            dashboardData?.inventory?.low_stock_count > 0 ? 'text-red-400' : 'text-purple-400'
          }`}>
            {dashboardData?.inventory?.low_stock_count || '0'}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Total Products: {dashboardData?.inventory?.total_products || '0'}
          </div>
        </div>
        
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <div className="text-sm text-slate-400 mb-1">Avg Order Value</div>
          <div className="text-2xl font-bold text-purple-400">
            ${dashboardData?.revenue?.total && dashboardData?.transactions?.total 
              ? (dashboardData.revenue.total / dashboardData.transactions.total).toFixed(2)
              : '0.00'
            }
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Per transaction
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <h3 className="text-lg font-medium mb-4">Revenue Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#020617", borderColor: "#1e293b" }}
                />
                <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <h3 className="text-lg font-medium mb-4">Sales by Category</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  onClick={(data) => handleChartClick(data, 'category')}
                  style={{ cursor: 'pointer' }}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "#020617", borderColor: "#1e293b" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <h3 className="text-lg font-medium mb-4">Top Performing Products</h3>
        <div className="space-y-2">
          {dashboardData?.topProducts?.slice(0, 5).map((product, index) => (
            <div 
              key={product.id}
              className={`flex items-center justify-between p-3 rounded cursor-pointer transition-colors ${
                product.current_stock <= product.reorder_point 
                  ? 'bg-red-900/20 border border-red-500' 
                  : 'bg-slate-800 hover:bg-slate-700'
              }`}
              onClick={() => handleChartClick(product, 'product')}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  product.current_stock <= product.reorder_point 
                    ? 'bg-red-500 text-white' 
                    : 'bg-emerald-500 text-slate-950'
                }`}>
                  {index + 1}
                </div>
                <div>
                  <div className="font-medium">{product.name}</div>
                  <div className="text-sm text-slate-400">{product.category} • {product.sku}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">${Number(product.total_revenue).toLocaleString()}</div>
                <div className="text-sm text-slate-400">{product.transaction_count} sales</div>
                {product.current_stock <= product.reorder_point && (
                  <div className="text-xs text-red-400 mt-1">⚠️ Low Stock</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <h3 className="text-lg font-medium mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => router.push('/forecasting')}
            className="p-3 bg-blue-500/20 border border-blue-500 rounded text-blue-400 hover:bg-blue-500/30 transition-colors"
          >
            <div className="text-2xl mb-1">🔮</div>
            <div className="text-sm">Generate Forecast</div>
          </button>
          <button
            onClick={() => router.push('/inventory')}
            className="p-3 bg-green-500/20 border border-green-500 rounded text-green-400 hover:bg-green-500/30 transition-colors"
          >
            <div className="text-2xl mb-1">📦</div>
            <div className="text-sm">Manage Inventory</div>
          </button>
          <button
            onClick={() => router.push('/recommendations')}
            className="p-3 bg-purple-500/20 border border-purple-500 rounded text-purple-400 hover:bg-purple-500/30 transition-colors"
          >
            <div className="text-2xl mb-1">💡</div>
            <div className="text-sm">View Recommendations</div>
          </button>
          <button
            onClick={() => router.push('/analytics')}
            className="p-3 bg-orange-500/20 border border-orange-500 rounded text-orange-400 hover:bg-orange-500/30 transition-colors"
          >
            <div className="text-2xl mb-1">📊</div>
            <div className="text-sm">Detailed Analytics</div>
          </button>
        </div>
      </div>
    </div>
  );
}

