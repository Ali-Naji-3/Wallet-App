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
    const [rows] = await pool.query(
      `SELECT 
        t.id,
        t.type,
        t.source_wallet_id,
        t.target_wallet_id,
        t.source_amount,
        t.source_currency,
        t.target_amount,
        t.target_currency,
        t.fx_rate,
        t.fee_amount,
        t.note,
        t.created_at,
        ws.currency_code AS source_currency_code,
        wt.currency_code AS target_currency_code
      FROM transactions t
      LEFT JOIN wallets ws ON t.source_wallet_id = ws.id
      LEFT JOIN wallets wt ON t.target_wallet_id = wt.id
      WHERE t.user_id = ?
      ORDER BY t.created_at DESC
      LIMIT 20`,
      [user.id]
    );
    
    return NextResponse.json(rows);
  } catch (err) {
    console.error('List transactions error:', err);
    return NextResponse.json(
      { message: err?.message || 'Failed to load transactions' },
      { status: 500 }
    );
  }
}

