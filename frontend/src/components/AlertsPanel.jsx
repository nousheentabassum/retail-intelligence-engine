'use client';

import { useState } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';

export const AlertsPanel = ({ userId }) => {
  const { alerts, clearAlerts, isConnected } = useWebSocket(userId);
  const [showAlerts, setShowAlerts] = useState(true);

  const getAlertIcon = (type) => {
    switch (type) {
      case 'low_stock':
        return 'warning';
      case 'out_of_stock':
        return 'error';
      case 'overstock':
        return 'info';
      case 'high_demand':
        return 'trending_up';
      default:
        return 'notification';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-900/20 border-red-800 text-red-400';
      case 'warning':
        return 'bg-yellow-900/20 border-yellow-800 text-yellow-400';
      case 'info':
        return 'bg-blue-900/20 border-blue-800 text-blue-400';
      default:
        return 'bg-slate-900/20 border-slate-800 text-slate-400';
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  if (!isConnected) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 mb-4">
        <div className="flex items-center text-slate-400">
          <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
          Connecting to real-time alerts...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
          <h3 className="text-lg font-semibold text-white">Real-time Alerts</h3>
          <span className="ml-2 text-sm text-slate-400">({alerts.length})</span>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowAlerts(!showAlerts)}
            className="text-xs px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
          >
            {showAlerts ? 'Hide' : 'Show'}
          </button>
          <button
            onClick={clearAlerts}
            className="text-xs px-3 py-1 bg-red-900/20 hover:bg-red-800/30 text-red-400 rounded"
          >
            Clear
          </button>
        </div>
      </div>

      {showAlerts && alerts.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          <div className="text-4xl mb-2">check_circle</div>
          <p>No active alerts</p>
        </div>
      )}

      {showAlerts && alerts.length > 0 && (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {alerts.slice(-10).reverse().map((alert, index) => (
            <div
              key={`${alert.type}-${index}`}
              className={`p-3 rounded-lg border ${getSeverityColor(alert.severity || 'info')}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-1">
                    <span className="text-lg mr-2">{getAlertIcon(alert.alert_type || alert.type)}</span>
                    <span className="font-medium">{alert.product?.name || 'System Alert'}</span>
                    {alert.product?.sku && (
                      <span className="ml-2 text-xs opacity-75">({alert.product.sku})</span>
                    )}
                  </div>
                  <p className="text-sm mb-1">{alert.message}</p>
                  {alert.product && (
                    <div className="text-xs space-x-4">
                      <span>Stock: {alert.product.current_stock}</span>
                      {alert.product.store_location && (
                        <span>Store: {alert.product.store_location}</span>
                      )}
                      {alert.demand && (
                        <span>Demand: {alert.demand} units/7d</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="text-xs opacity-75 ml-4">
                  {formatTimestamp(alert.timestamp)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
