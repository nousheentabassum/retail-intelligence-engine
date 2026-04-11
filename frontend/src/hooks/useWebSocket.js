'use client';

import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

export const useWebSocket = (userId = null) => {
  const [isConnected, setIsConnected] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000', {
      transports: ['websocket', 'polling']
    });

    const socket = socketRef.current;

    // Connection events
    socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      setIsConnected(true);
      
      // Join user room if userId provided
      if (userId) {
        socket.emit('join-user-room', userId);
      }
      
      // Subscribe to alerts and analytics
      socket.emit('subscribe-stock-alerts');
      socket.emit('subscribe-analytics');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      setIsConnected(false);
    });

    // Stock alerts
    socket.on('stock-alert', (data) => {
      console.log('Stock alert received:', data);
      setAlerts(prev => [...prev, data]);
    });

    // Personal alerts
    socket.on('personal-alert', (data) => {
      console.log('Personal alert received:', data);
      setAlerts(prev => [...prev, data]);
    });

    // Broadcast alerts
    socket.on('broadcast-alert', (data) => {
      console.log('Broadcast alert received:', data);
      setAlerts(prev => [...prev, data]);
    });

    // Analytics updates
    socket.on('analytics-update', (data) => {
      console.log('Analytics update received:', data);
      setAnalytics(data.data);
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, [userId]);

  const clearAlerts = () => {
    setAlerts([]);
  };

  const sendAlert = (alert) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('send-alert', alert);
    }
  };

  return {
    isConnected,
    alerts,
    analytics,
    clearAlerts,
    sendAlert
  };
};
