'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';

/**
 * Shared hook for managing wallet data with real-time updates
 * Supports polling, SSE, and WebSocket (extensible)
 */
export function useWalletData(options = {}) {
  const {
    pollingInterval = 5000, // 5 seconds default
    enablePolling = true,
    autoRefresh = true,
  } = options;

  const [wallets, setWallets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  
  const pollingIntervalRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Fetch wallets
  const fetchWallets = useCallback(async (signal = null) => {
    try {
      const response = await apiClient.get('/api/wallets/my', { signal });
      const walletData = response.data || [];
      
      // Transform to match dashboard format
      const transformedWallets = walletData.map(wallet => ({
        id: wallet.id,
        currency: wallet.currency_code,
        symbol: getCurrencySymbol(wallet.currency_code),
        balance: parseFloat(wallet.balance) || 0,
        icon: getCurrencyIcon(wallet.currency_code),
        cardType: getCardType(wallet.currency_code),
        cardNumber: String(wallet.id).slice(-4).padStart(4, '0'),
        cardColor: getCardColor(wallet.currency_code),
        textColor: 'text-white',
        change: '+0.0%', // Can be calculated from history
        trend: 'up',
      }));

      setWallets(transformedWallets);
      setError(null);
      setLastUpdate(new Date());
      return transformedWallets;
    } catch (err) {
      if (err.name !== 'AbortError' && err.name !== 'CanceledError') {
        console.error('Failed to fetch wallets:', err);
        setError(err.response?.data?.message || 'Failed to load wallets');
      }
      throw err;
    }
  }, []);

  // Fetch transactions
  const fetchTransactions = useCallback(async (signal = null) => {
    try {
      const response = await apiClient.get('/api/transactions/my', { signal });
      const txData = response.data || [];
      
      // Transform transactions
      const transformedTransactions = txData.map(tx => ({
        id: tx.id,
        type: tx.type === 'exchange' ? 'exchange' : tx.type === 'transfer' ? 'sent' : 'received',
        name: tx.type === 'exchange' 
          ? `${tx.source_currency} → ${tx.target_currency}`
          : tx.note || 'Transaction',
        amount: formatTransactionAmount(tx),
        time: formatTimeAgo(tx.created_at),
        status: 'completed',
        sourceCurrency: tx.source_currency,
        targetCurrency: tx.target_currency,
        sourceAmount: tx.source_amount,
        targetAmount: tx.target_amount,
      }));

      setTransactions(transformedTransactions);
      return transformedTransactions;
    } catch (err) {
      if (err.name !== 'AbortError' && err.name !== 'CanceledError') {
        console.error('Failed to fetch transactions:', err);
      }
      throw err;
    }
  }, []);

  // Refresh all data
  const refresh = useCallback(async (showToast = false) => {
    try {
      setLoading(true);
      const controller = new AbortController();
      abortControllerRef.current = controller;

      await Promise.all([
        fetchWallets(controller.signal),
        fetchTransactions(controller.signal),
      ]);

      if (showToast) {
        toast.success('Wallet data refreshed');
      }
    } catch (err) {
      if (err.name !== 'AbortError' && err.name !== 'CanceledError') {
        if (showToast) {
          toast.error('Failed to refresh wallet data');
        }
      }
    } finally {
      setLoading(false);
    }
  }, [fetchWallets, fetchTransactions]);

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

  // Update wallet balance after exchange
  const updateWalletBalance = useCallback((currency, newBalance) => {
    setWallets(prev => prev.map(wallet => 
      wallet.currency === currency
        ? { ...wallet, balance: newBalance }
        : wallet
    ));
  }, []);

  // Add new transaction to list
  const addTransaction = useCallback((newTx) => {
    setTransactions(prev => [newTx, ...prev].slice(0, 20)); // Keep latest 20
  }, []);

  return {
    wallets,
    transactions,
    loading,
    error,
    lastUpdate,
    refresh,
    updateWalletBalance,
    addTransaction,
  };
}

// Helper functions
function getCurrencySymbol(currency) {
  const symbols = {
    USD: '$',
    EUR: '€',
    LBP: 'ل.ل',
  };
  return symbols[currency] || currency;
}

function getCurrencyIcon(currency) {
  // This will be imported from lucide-react in the component
  return null;
}

function getCardType(currency) {
  const types = {
    USD: 'PLATINUM',
    EUR: 'GOLD',
    LBP: 'BLACK',
  };
  return types[currency] || 'STANDARD';
}

function getCardColor(currency) {
  const colors = {
    USD: 'from-slate-700 via-slate-600 to-slate-800',
    EUR: 'from-amber-600 via-amber-500 to-yellow-600',
    LBP: 'from-gray-900 via-gray-800 to-black',
  };
  return colors[currency] || 'from-gray-700 via-gray-600 to-gray-800';
}

function formatTransactionAmount(tx) {
  if (tx.type === 'exchange') {
    return `${tx.source_currency} ${tx.source_amount} → ${tx.target_currency} ${tx.target_amount}`;
  }
  const amount = parseFloat(tx.source_amount) || 0;
  const symbol = getCurrencySymbol(tx.source_currency);
  return `${symbol}${amount.toFixed(2)}`;
}

function formatTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
}

