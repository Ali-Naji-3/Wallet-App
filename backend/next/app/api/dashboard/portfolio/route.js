import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { parseBearer, verifyToken } from '@/lib/auth';
import { unstable_cache } from 'next/cache';

// OPTIMIZATION: Cache portfolio data for 60 seconds
const getCachedPortfolio = unstable_cache(
  async (userId) => {
    const pool = getPool();
    
    // OPTIMIZATION: Run queries in parallel instead of sequential
    const [userRows, wallets, fxRates, txStats] = await Promise.all([
      // Get user base currency
      pool.query(
        `SELECT base_currency FROM users WHERE id = ? LIMIT 1`,
        [userId]
      ),
      // Get user wallets
      pool.query(
        `SELECT id, currency_code, balance, status
         FROM wallets
         WHERE user_id = ?
         ORDER BY id DESC`,
        [userId]
      ),
      // Get latest FX rates (will get base currency from first query result)
      pool.query(
        `SELECT quote_currency, rate
         FROM fx_rates
         WHERE base_currency = (SELECT base_currency FROM users WHERE id = ? LIMIT 1)
         AND fetched_at = (
           SELECT MAX(fetched_at) 
           FROM fx_rates 
           WHERE base_currency = (SELECT base_currency FROM users WHERE id = ? LIMIT 1)
         )
         ORDER BY quote_currency ASC
         LIMIT 50`,
        [userId, userId]
      ),
      // Get transaction stats
      pool.query(
        `SELECT 
          COUNT(*) AS totalTransactions,
          SUM(CASE WHEN type = 'exchange' THEN 1 ELSE 0 END) AS totalExchanges,
          SUM(CASE WHEN type = 'transfer' THEN 1 ELSE 0 END) AS totalTransfers
        FROM transactions
        WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`,
        [userId]
      ),
    ]);

    const baseCurrency = userRows[0][0]?.base_currency || 'USD';
    const walletList = wallets[0];
    const ratesList = fxRates[0];
    const stats = txStats[0][0];

    // Build rates map
    const rates = {};
    ratesList.forEach(r => {
      rates[r.quote_currency] = Number(r.rate);
    });

    // Calculate total portfolio value in base currency
    let totalInBase = 0;
    const walletBreakdown = walletList.map((w) => {
      const balance = parseFloat(w.balance) || 0;
      let valueInBase = balance;

      if (w.currency_code === baseCurrency) {
        valueInBase = balance;
      } else if (rates[w.currency_code]) {
        valueInBase = balance / rates[w.currency_code];
      }

      totalInBase += valueInBase;

      return {
        currencyCode: w.currency_code,
        balance: balance,
        valueInBase: Math.round(valueInBase * 100) / 100,
        status: w.status,
      };
    });

    return {
      totalPortfolioValue: Math.round(totalInBase * 100) / 100,
      baseCurrency: baseCurrency,
      walletBreakdown: walletBreakdown,
      stats: {
        last30Days: {
          totalTransactions: stats?.totalTransactions || 0,
          totalExchanges: stats?.totalExchanges || 0,
          totalTransfers: stats?.totalTransfers || 0,
        },
      },
    };
  },
  ['portfolio'],
  {
    revalidate: 60, // Cache for 60 seconds
    tags: ['portfolio'],
  }
);

export async function GET(req) {
  try {
    const token = parseBearer(req.headers.get('authorization') || undefined);
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const user = verifyToken(token);
    if (!user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // OPTIMIZATION: Use cached version
    const data = await getCachedPortfolio(user.id);

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (err) {
    console.error('Portfolio error:', err);
    return NextResponse.json(
      { message: err?.message || 'Failed to load portfolio' },
      { status: 500 }
    );
  }
}
