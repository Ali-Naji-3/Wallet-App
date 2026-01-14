/**
 * CSR Example - Client-Side Rendering
 * This page loads in the browser and fetches data with JavaScript
 * Perfect for interactive, real-time features
 */

'use client';

import { useState, useEffect } from 'react';
import { getStoredToken } from '@/lib/auth/storage';

export default function DashboardCSRPage() {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch data in the browser using the per-tab session token
    const token = getStoredToken();
    
    fetch('http://localhost:3000/api/wallets/my', {
      headers: token
        ? {
            'Authorization': `Bearer ${token}`,
          }
        : {},
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then(data => {
        setWallets(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">Dashboard (CSR)</h1>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">Dashboard (CSR)</h1>
          <p className="text-red-500">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">Dashboard (CSR)</h1>
        <p className="mb-4 text-gray-600">
          This page uses CSR - data fetched in the browser
        </p>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Your Wallets</h2>
          {wallets.map((wallet) => (
            <div key={wallet.id} className="p-4 border rounded-lg">
              <div className="flex justify-between">
                <span className="font-bold">{wallet.currency_code}</span>
                <span>{Number(wallet.balance).toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

