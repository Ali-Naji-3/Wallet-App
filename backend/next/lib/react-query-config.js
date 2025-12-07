/**
 * React Query Configuration for Option 4
 * Optimized caching and request deduplication
 */

export const queryClientConfig = {
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Keep unused data in cache for 10 minutes
      gcTime: 10 * 60 * 1000, // Previously cacheTime
      // Retry failed requests 1 time
      retry: 1,
      // Refetch on window focus (but use stale data first)
      refetchOnWindowFocus: true,
      // Don't refetch on reconnect if data is fresh
      refetchOnReconnect: 'always',
      // Use stale data while refetching
      refetchOnMount: true,
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
    },
  },
};

// Specific query configurations for different data types
export const queryConfigs = {
  // User data - cache for 10 minutes
  user: {
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  },
  // Portfolio data - cache for 1 minute (frequently changing)
  portfolio: {
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  },
  // Wallets - cache for 2 minutes
  wallets: {
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  },
  // FX Rates - cache for 30 seconds (very frequently changing)
  fxRates: {
    staleTime: 30 * 1000,
    gcTime: 2 * 60 * 1000,
  },
  // Transactions - cache for 1 minute
  transactions: {
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  },
  // Admin data - cache for 30 seconds
  admin: {
    staleTime: 30 * 1000,
    gcTime: 2 * 60 * 1000,
  },
};

