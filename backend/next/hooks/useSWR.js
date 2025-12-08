'use client';

import useSWR from 'swr';
import apiClient from '@/lib/api/client';

/**
 * SWR Fetcher function
 */
const fetcher = (url) => apiClient.get(url).then(res => res.data);

/**
 * Custom hook for admin stats with automatic caching and revalidation
 */
export function useAdminStats(options = {}) {
  const { refreshInterval = 30000 } = options; // Refresh every 30s by default
  
  const { data, error, isLoading, mutate } = useSWR(
    '/api/admin/stats',
    fetcher,
    {
      refreshInterval,
      revalidateOnFocus: false, // Don't revalidate on tab focus
      revalidateOnReconnect: true,
      dedupingInterval: 10000, // Dedupe requests within 10s
    }
  );
  
  return {
    stats: data,
    isLoading,
    isError: error,
    refresh: mutate,
  };
}

/**
 * Custom hook for admin users with caching
 */
export function useAdminUsers(params = {}, options = {}) {
  const { refreshInterval = 0 } = options; // No auto-refresh by default
  
  // Build query string
  const queryString = new URLSearchParams(params).toString();
  const url = `/api/admin/users${queryString ? `?${queryString}` : ''}`;
  
  const { data, error, isLoading, mutate } = useSWR(
    url,
    fetcher,
    {
      refreshInterval,
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  );
  
  return {
    users: data?.users || [],
    total: data?.total || 0,
    isLoading,
    isError: error,
    refresh: mutate,
  };
}

/**
 * Custom hook for KYC submissions with caching
 */
export function useKYCSubmissions(status = null, options = {}) {
  const { refreshInterval = 10000 } = options; // Refresh every 10s
  
  const url = status ? `/api/admin/kyc?status=${status}` : '/api/admin/kyc';
  
  const { data, error, isLoading, mutate } = useSWR(
    url,
    fetcher,
    {
      refreshInterval,
      revalidateOnFocus: true, // Revalidate when user comes back
      dedupingInterval: 3000,
    }
  );
  
  return {
    submissions: data?.verifications || data?.kyc || [],
    isLoading,
    isError: error,
    refresh: mutate,
  };
}

/**
 * Custom hook for single KYC details
 */
export function useKYCDetails(id, options = {}) {
  const { refreshInterval = 0 } = options;
  
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/admin/kyc/${id}` : null,
    fetcher,
    {
      refreshInterval,
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  );
  
  return {
    kyc: data?.kyc,
    history: data?.history || [],
    isLoading,
    isError: error,
    refresh: mutate,
  };
}

/**
 * Custom hook for wallet data with caching
 */
export function useWallets(options = {}) {
  const { refreshInterval = 15000 } = options; // Refresh every 15s
  
  const { data, error, isLoading, mutate } = useSWR(
    '/api/wallets/my',
    fetcher,
    {
      refreshInterval,
      revalidateOnFocus: true,
      dedupingInterval: 5000,
    }
  );
  
  return {
    wallets: data?.wallets || [],
    isLoading,
    isError: error,
    refresh: mutate,
  };
}

/**
 * Custom hook for transactions with caching
 */
export function useTransactions(params = {}, options = {}) {
  const { refreshInterval = 0 } = options;
  
  const queryString = new URLSearchParams(params).toString();
  const url = `/api/transactions/my${queryString ? `?${queryString}` : ''}`;
  
  const { data, error, isLoading, mutate } = useSWR(
    url,
    fetcher,
    {
      refreshInterval,
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  );
  
  return {
    transactions: data?.transactions || [],
    total: data?.total || 0,
    isLoading,
    isError: error,
    refresh: mutate,
  };
}




