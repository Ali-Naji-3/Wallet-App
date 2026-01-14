/**
 * SWR Example - FX Rates with Real-time Updates
 * Perfect for data that needs frequent updates
 */

'use client';

import { useState } from 'react';
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

export default function FxRatesSWRPage() {
  const [baseCurrency, setBaseCurrency] = useState('USD');
  
  const { data, error, isLoading } = useSWR(
    `http://localhost:3000/api/wallets/fx/latest?base=${baseCurrency}`,
    fetcher,
    {
      refreshInterval: 10000, // Refresh every 10 seconds
      revalidateOnFocus: true,
    }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">FX Rates (SWR)</h1>
          <p>Loading rates...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">FX Rates (SWR)</h1>
          <p className="text-red-500">Error: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold">FX Rates (SWR)</h1>
          <select
            value={baseCurrency}
            onChange={(e) => setBaseCurrency(e.target.value)}
            className="px-4 py-2 border rounded"
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
            <option value="JPY">JPY</option>
          </select>
        </div>
        <p className="mb-4 text-gray-600">
          Auto-updates every 10 seconds using SWR
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data?.rates?.map((rate) => (
            <div key={rate.quote_currency} className="p-4 border rounded-lg">
              <div className="font-bold text-xl">
                {data.baseCurrency} / {rate.quote_currency}
              </div>
              <div className="text-2xl">{Number(rate.rate).toFixed(4)}</div>
              <div className="text-sm text-gray-500">
                Updated: {new Date(rate.fetched_at).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

