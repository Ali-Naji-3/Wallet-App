/**
 * SSR Example - Server-Side Rendering
 * This page is generated on each request
 * Perfect for user-specific, authenticated content
 */

import { cookies } from 'next/headers';
import { getPool } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export const metadata = {
  title: 'Dashboard (SSR)',
  description: 'User dashboard with server-side rendering',
};

async function getDashboardData(userId) {
  const pool = getPool();
  
  // Get user profile
  const [userRows] = await pool.query(
    `SELECT base_currency FROM users WHERE id = ? LIMIT 1`,
    [userId]
  );
  const baseCurrency = userRows[0]?.base_currency || 'USD';

  // Get wallets
  const [wallets] = await pool.query(
    `SELECT id, currency_code, balance, status
     FROM wallets WHERE user_id = ? ORDER BY id DESC`,
    [userId]
  );

  // Get transaction count
  const [txCount] = await pool.query(
    `SELECT COUNT(*) as count FROM transactions WHERE user_id = ?`,
    [userId]
  );

  return {
    baseCurrency,
    wallets,
    transactionCount: txCount[0]?.count || 0,
  };
}

export default async function DashboardSSRPage() {
  // Get token from cookies (you'll need to set this in your auth flow)
  const cookieStore = cookies();
  const token = cookieStore.get('fxwallet_token')?.value;

  if (!token) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">Dashboard (SSR)</h1>
          <p className="text-red-500">Please login to view your dashboard</p>
        </div>
      </div>
    );
  }

  try {
    const user = verifyToken(token);
    const data = await getDashboardData(user.id);

    return (
      <div className="min-h-screen p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">Dashboard (SSR)</h1>
          <p className="mb-4 text-gray-600">
            This page uses SSR - generated fresh on each request
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-gray-500">Base Currency</div>
              <div className="text-2xl font-bold">{data.baseCurrency}</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-gray-500">Wallets</div>
              <div className="text-2xl font-bold">{data.wallets.length}</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-gray-500">Transactions</div>
              <div className="text-2xl font-bold">{data.transactionCount}</div>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Your Wallets</h2>
            {data.wallets.map((wallet) => (
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
  } catch (err) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">Dashboard (SSR)</h1>
          <p className="text-red-500">Invalid token. Please login again.</p>
        </div>
      </div>
    );
  }
}

