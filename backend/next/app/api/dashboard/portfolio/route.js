import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { parseBearer, verifyToken } from '@/lib/auth';

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

    const pool = getPool();
    
    // Get user profile to get base currency
    const [userRows] = await pool.query(
      `SELECT base_currency FROM users WHERE id = ? LIMIT 1`,
      [user.id]
    );
    const baseCurrency = userRows[0]?.base_currency || 'USD';

    // Get user wallets
    const [wallets] = await pool.query(
      `SELECT id, currency_code, balance, status
       FROM wallets
       WHERE user_id = ?
       ORDER BY id DESC`,
      [user.id]
    );

    // Get latest FX rates
    const [fxRates] = await pool.query(
      `SELECT quote_currency, rate
       FROM fx_rates
       WHERE base_currency = ?
       ORDER BY created_at DESC
       LIMIT 50`,
      [baseCurrency]
    );

    const rates = {};
    fxRates.forEach(r => {
      rates[r.quote_currency] = Number(r.rate);
    });

    // Calculate total portfolio value in base currency
    let totalInBase = 0;
    const walletBreakdown = wallets.map((w) => {
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

    // Get transaction counts (last 30 days)
    const [txStats] = await pool.query(
      `SELECT 
        COUNT(*) AS totalTransactions,
        SUM(CASE WHEN type = 'exchange' THEN 1 ELSE 0 END) AS totalExchanges,
        SUM(CASE WHEN type = 'transfer' THEN 1 ELSE 0 END) AS totalTransfers
      FROM transactions
      WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`,
      [user.id]
    );

    return NextResponse.json({
      totalPortfolioValue: Math.round(totalInBase * 100) / 100,
      baseCurrency: baseCurrency,
      walletBreakdown: walletBreakdown,
      stats: {
        last30Days: {
          totalTransactions: txStats[0]?.totalTransactions || 0,
          totalExchanges: txStats[0]?.totalExchanges || 0,
          totalTransfers: txStats[0]?.totalTransfers || 0,
        },
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

