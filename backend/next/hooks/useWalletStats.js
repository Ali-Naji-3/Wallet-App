'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '@/lib/api/client';

/**
 * Hook for fetching wallet statistics with real-time updates
 */
export function useWalletStats(options = {}) {
  const {
    pollingInterval = 10000, // 10 seconds default
    enablePolling = true,
    autoRefresh = true,
  } = options;

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  
  const pollingIntervalRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Fetch wallet stats
  const fetchStats = useCallback(async (signal = null) => {
    try {
      const response = await apiClient.get('/api/wallet/stats', { signal });
      const data = response.data;

      // Ensure all values are valid numbers (prevent NaN)
      const safeStats = {
        totalIncome: parseFloat(data.totalIncome || 0) || 0,
        totalExpenses: parseFloat(data.totalExpenses || 0) || 0,
        netIncome: parseFloat(data.netIncome || 0) || 0,
        avgTransaction: parseFloat(data.avgTransaction || 0) || 0,
        totalTransactions: parseInt(data.totalTransactions || 0) || 0,
        balanceTrend: Array.isArray(data.balanceTrend) ? data.balanceTrend : [],
        categories: Array.isArray(data.categories) ? data.categories : [],
        monthlyData: Array.isArray(data.monthlyData) ? data.monthlyData : [],
      };

      setStats(safeStats);
      setError(null);
      setLastUpdate(new Date());
      return safeStats;
    } catch (err) {
      if (err.name !== 'AbortError' && err.name !== 'CanceledError') {
        console.error('Failed to fetch wallet stats:', err);
        setError(err.response?.data?.message || 'Failed to load wallet statistics');
      }
      throw err;
    }
  }, []);

  // Refresh function
  const refresh = useCallback(async (showToast = false) => {
    try {
      setLoading(true);
      const controller = new AbortController();
      abortControllerRef.current = controller;

      await fetchStats(controller.signal);
    } catch (err) {
      if (err.name !== 'AbortError' && err.name !== 'CanceledError') {
        // Error already set in fetchStats
      }
    } finally {
      setLoading(false);
    }
  }, [fetchStats]);

  // Initial load
  useEffect(() => {
    refresh();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Polling setup
  useEffect(() => {
    if (!enablePolling || !autoRefresh) return;

    pollingIntervalRef.current = setInterval(() => {
      refresh(false); // Silent refresh
    }, pollingInterval);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [enablePolling, autoRefresh, pollingInterval, refresh]);

  return {
    stats,
    loading,
    error,
    lastUpdate,
    refresh,
  };
}

