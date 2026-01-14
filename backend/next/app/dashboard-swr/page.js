/**
 * SWR Example - Stale-While-Revalidate
 * Shows cached data instantly, updates in background
 * Perfect for data that needs to stay fresh
 */

'use client';

import useSWR from 'swr';
import { getStoredToken } from '@/lib/auth/storage';

const fetcher = async (url) => {
  const token = getStoredToken();
  const res = await fetch(url, {
    headers: token
      ? {
          'Authorization': `Bearer ${token}`,
        }
      : {},
  });
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

export default function DashboardSWRPage() {
  // SWR automatically handles caching, revalidation, and error states
  const { data, error, isLoading, mutate } = useSWR(
    'http://localhost:3000/api/dashboard/portfolio',
    fetcher,
    {
      refreshInterval: 5000, // Refresh every 5 seconds
      revalidateOnFocus: true, // Revalidate when window gains focus
      revalidateOnReconnect: true, // Revalidate when network reconnects
    }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">Dashboard (SWR)</h1>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">Dashboard (SWR)</h1>
          <p className="text-red-500">Error: {error.message}</p>
          <button
            onClick={() => mutate()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold">Dashboard (SWR)</h1>
          <button
            onClick={() => mutate()}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Refresh
          </button>
        </div>
        <p className="mb-4 text-gray-600">
          This page uses SWR - shows cached data instantly, updates in background every 5 seconds
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="p-4 border rounded-lg">
            <div className="text-sm text-gray-500">Total Portfolio Value</div>
            <div className="text-3xl font-bold">
              {data?.totalPortfolioValue?.toFixed(2) || '0.00'} {data?.baseCurrency || 'USD'}
            </div>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="text-sm text-gray-500">Transactions (30 days)</div>
            <div className="text-3xl font-bold">
              {data?.stats?.last30Days?.totalTransactions || 0}
            </div>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="text-sm text-gray-500">Wallets</div>
            <div className="text-3xl font-bold">
              {data?.walletBreakdown?.length || 0}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Wallet Breakdown</h2>
          {data?.walletBreakdown?.map((wallet, index) => (
            <div key={index} className="p-4 border rounded-lg">
              <div className="flex justify-between">
                <span className="font-bold">{wallet.currencyCode}</span>
                <span>{wallet.balance.toFixed(2)} = {wallet.valueInBase.toFixed(2)} {data.baseCurrency}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

