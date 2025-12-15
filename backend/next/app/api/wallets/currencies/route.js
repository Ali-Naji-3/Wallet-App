import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { parseBearer, verifyToken } from '@/lib/auth';

/**
 * GET /api/wallets/currencies
 * Get currencies with balances
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

    const [wallets] = await pool.query(
      `SELECT currency, balance FROM wallets WHERE user_id = ?`,
      [user.id]
    );

    const currencies = [
      { code: 'USD', name: 'US Dollar', symbol: '$', rate: 1 },
      { code: 'EUR', name: 'Euro', symbol: '€', rate: 0.92 },
      { code: 'LBP', name: 'Lebanese Lira', symbol: 'ل.ل', rate: 89500 },
    ];

    const currenciesWithBalance = currencies.map(curr => {
      const wallet = wallets.find(w => w.currency === curr.code);
      return {
        ...curr,
        balance: wallet ? parseFloat(wallet.balance) : 0,
      };
    });

    return NextResponse.json({ currencies: currenciesWithBalance });

  } catch (err) {
    console.error('❌ [Currencies] Error:', err);
    return NextResponse.json(
      { message: err?.message || 'Failed to fetch currencies' },
      { status: 500 }
    );
  }
}