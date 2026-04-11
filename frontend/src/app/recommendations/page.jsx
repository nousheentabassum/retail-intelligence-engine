'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    type: 'all',
    priority: 'all',
    category: 'all'
  });
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  
  const { authService } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }
    loadRecommendations();
  }, [dateRange, filters]);

  const loadRecommendations = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/recommendations?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`,
        {
          headers: {
            Authorization: authService.getAuthHeader()
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to load recommendations');
      }
      
      const data = await response.json();
      setRecommendations(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecommendations = recommendations?.recommendations?.filter(rec => {
    if (filters.type !== 'all' && rec.type !== filters.type) return false;
    if (filters.priority !== 'all' && rec.priority !== filters.priority) return false;
    if (filters.category !== 'all' && rec.product?.category !== filters.category) return false;
    return true;
  }) || [];

  const handleRefreshRecommendations = () => {
    loadRecommendations();
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-900/20 border-red-800';
      case 'medium': return 'text-yellow-400 bg-yellow-900/20 border-yellow-800';
      case 'low': return 'text-green-400 bg-green-900/20 border-green-800';
      default: return 'text-slate-400 bg-slate-900/20 border-slate-800';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'restock': return '📦';
      case 'investigate': return '🔍';
      case 'discount': return '🏷️';
      case 'expand': return '📈';
      default: return '📋';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">Loading recommendations...</div>
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
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-semibold mb-2">AI Recommendations</h2>
          <p className="text-sm text-slate-400">
            Intelligent recommendations based on sales trends, inventory levels, and profitability
          </p>
        </div>
        <button
          onClick={handleRefreshRecommendations}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Updating...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </>
          )}
        </button>
      </div>

      {/* Summary Cards */}
      {recommendations?.summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <div className="text-sm text-slate-400 mb-1">Total Recommendations</div>
            <div className="text-2xl font-bold text-white">
              {recommendations.summary.totalRecommendations}
            </div>
          </div>
          
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
            <div className="text-sm text-red-400 mb-1">High Priority</div>
            <div className="text-2xl font-bold text-red-400">
              {recommendations.summary.highPriority}
            </div>
          </div>
          
          <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-4">
            <div className="text-sm text-yellow-400 mb-1">Medium Priority</div>
            <div className="text-2xl font-bold text-yellow-400">
              {recommendations.summary.mediumPriority}
            </div>
          </div>
          
          <div className="bg-green-900/20 border border-green-800 rounded-lg p-4">
            <div className="text-sm text-green-400 mb-1">Low Priority</div>
            <div className="text-2xl font-bold text-green-400">
              {recommendations.summary.lowPriority}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-sm text-white w-full"
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
              className="bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-sm text-white w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Type
            </label>
            <select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              className="bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-sm text-white w-full"
            >
              <option value="all">All Types</option>
              <option value="restock">Restock</option>
              <option value="investigate">Investigate</option>
              <option value="discount">Discount</option>
              <option value="expand">Expand</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Priority
            </label>
            <select
              value={filters.priority}
              onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
              className="bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-sm text-white w-full"
            >
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Recommendations List */}
      <div className="space-y-4">
        {filteredRecommendations.map((recommendation) => (
          <div
            key={recommendation.id}
            className={`border rounded-lg p-4 ${getPriorityColor(recommendation.priority)}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{getTypeIcon(recommendation.type)}</span>
                  <div>
                    <h3 className="font-semibold text-white">
                      {recommendation.action}
                    </h3>
                    <p className="text-sm text-slate-300">
                      {recommendation.product?.name} ({recommendation.product?.sku})
                    </p>
                  </div>
                </div>
                
                <p className="text-sm text-slate-400 mb-3">
                  {recommendation.reason}
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-slate-400">Urgency:</span>
                    <span className="ml-2 text-white">{recommendation.urgency}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Impact:</span>
                    <span className="ml-2 text-white">{recommendation.estimatedImpact}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Confidence:</span>
                    <span className="ml-2 text-white">{recommendation.confidence}</span>
                  </div>
                </div>
                
                {recommendation.quantity && (
                  <div className="mt-3 text-sm">
                    <span className="text-slate-400">Recommended Quantity:</span>
                    <span className="ml-2 text-white font-medium">{recommendation.quantity} units</span>
                  </div>
                )}
                
                {recommendation.discount && (
                  <div className="mt-3 text-sm">
                    <span className="text-slate-400">Recommended Discount:</span>
                    <span className="ml-2 text-white font-medium">{recommendation.discount}</span>
                  </div>
                )}
              </div>
              
              <div className="ml-4 text-right">
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(recommendation.priority)}`}>
                  {recommendation.priority.toUpperCase()}
                </div>
                <div className="mt-2 text-sm text-slate-400">
                  Score: {recommendation.priorityScore}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredRecommendations.length === 0 && (
        <div className="text-center py-8 text-slate-400">
          No recommendations found for the selected filters.
        </div>
      )}
    </div>
  );
}
