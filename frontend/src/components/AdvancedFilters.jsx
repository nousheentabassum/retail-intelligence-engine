'use client';

import { useState } from 'react';

export const AdvancedFilters = ({ onFilterChange, loading = false }) => {
  const [filters, setFilters] = useState({
    minRevenue: '',
    maxRevenue: '',
    minTransactions: '',
    maxTransactions: '',
    sortBy: 'date',
    sortOrder: 'desc'
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleInputChange = (field, value) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const resetFilters = () => {
    const defaultFilters = {
      minRevenue: '',
      maxRevenue: '',
      minTransactions: '',
      maxTransactions: '',
      sortBy: 'date',
      sortOrder: 'desc'
    };
    setFilters(defaultFilters);
    onFilterChange(defaultFilters);
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '' && value !== 'date' && value !== 'desc');

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Advanced Filters</h3>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded flex items-center"
        >
          <span className="mr-1">{showAdvanced ? 'hide' : 'show'}</span>
          <span>{showAdvanced ? 'expand_less' : 'expand_more'}</span>
        </button>
      </div>

      {showAdvanced && (
        <div className="space-y-4">
          {/* Revenue Range */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Revenue Range</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Min Revenue</label>
                <input
                  type="number"
                  placeholder="0"
                  value={filters.minRevenue}
                  onChange={(e) => handleInputChange('minRevenue', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Max Revenue</label>
                <input
                  type="number"
                  placeholder="999999"
                  value={filters.maxRevenue}
                  onChange={(e) => handleInputChange('maxRevenue', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Transaction Range */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Transaction Range</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Min Transactions</label>
                <input
                  type="number"
                  placeholder="0"
                  value={filters.minTransactions}
                  onChange={(e) => handleInputChange('minTransactions', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Max Transactions</label>
                <input
                  type="number"
                  placeholder="999"
                  value={filters.maxTransactions}
                  onChange={(e) => handleInputChange('maxTransactions', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Sorting */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Sort Options</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Sort By</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleInputChange('sortBy', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white focus:outline-none focus:border-blue-500"
                  disabled={loading}
                >
                  <option value="date">Date</option>
                  <option value="total_revenue">Revenue</option>
                  <option value="total_transactions">Transactions</option>
                  <option value="total_quantity">Quantity</option>
                  <option value="avg_price">Average Price</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Order</label>
                <select
                  value={filters.sortOrder}
                  onChange={(e) => handleInputChange('sortOrder', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white focus:outline-none focus:border-blue-500"
                  disabled={loading}
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </div>
            </div>
          </div>

          {/* Reset Button */}
          {hasActiveFilters && (
            <div className="flex justify-end">
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-sm"
                disabled={loading}
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
