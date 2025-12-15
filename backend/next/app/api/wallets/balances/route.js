import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { parseBearer, verifyToken } from '@/lib/auth';

/**
 * GET /api/wallets/balances
 * Get all wallet balances for current user
 */
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

    // Get all wallet balances
    const [wallets] = await pool.query(
      `SELECT currency_code as currency, balance 
       FROM wallets 
       WHERE user_id = ?
       ORDER BY currency_code`,
      [user.id]
    );

    // If user has no wallets, create default ones with 0 balance
    if (wallets.length === 0) {
      const defaultWallets = [
        { currency: 'USD', balance: 0.00 },
        { currency: 'EUR', balance: 0.00 },
        { currency: 'LBP', balance: 0.00 },
      ];

      for (const wallet of defaultWallets) {
        const address = `FXW-${wallet.currency}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
        await pool.query(
          `INSERT INTO wallets (user_id, currency_code, address, balance) VALUES (?, ?, ?, ?)`,
          [user.id, wallet.currency, address, wallet.balance]
        );
      }

      return NextResponse.json({ balances: defaultWallets });
    }

    return NextResponse.json({ balances: wallets });

  } catch (err) {
    console.error('❌ [Balances] Error:', err);
    return NextResponse.json(
      { message: err?.message || 'Failed to fetch balances' },
      { status: 500 }
    );
  }
}