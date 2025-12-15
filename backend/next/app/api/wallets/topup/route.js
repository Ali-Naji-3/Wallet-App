import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { parseBearer, verifyToken } from '@/lib/auth';

// POST /api/wallets/topup
// body: { currency: "USD", amount: 100 }
export async function POST(req) {
  try {
    // IMPORTANT: dev only (خليه شغال بس بالتست)
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ message: 'Not allowed' }, { status: 403 });
    }

    const token = parseBearer(req.headers.get('authorization') || undefined);
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const user = verifyToken(token);
    if (!user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { currency, amount } = body || {};

    if (!currency || amount == null) {
      return NextResponse.json({ message: 'currency and amount are required' }, { status: 400 });
    }

    const topupAmount = Number(amount);
    if (!Number.isFinite(topupAmount) || topupAmount <= 0) {
      return NextResponse.json({ message: 'amount must be > 0' }, { status: 400 });
    }

    const pool = getPool();
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // زيد الرصيد (create wallet if not exists)
      await connection.query(
        `INSERT INTO wallets (user_id, currency, balance)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE balance = balance + ?`,
        [user.id, currency, topupAmount, topupAmount]
      );

      // سجّل transaction (receive)
      await connection.query(
        `INSERT INTO transactions
         (user_id, type, from_currency, from_amount, recipient_email, recipient_name, note, status)
         VALUES (?, 'receive', ?, ?, ?, ?, ?, 'completed')`,
        [user.id, currency, topupAmount, user.email || null, user.full_name || null, 'Test TopUp', 'completed']
      );

      await connection.commit();

      return NextResponse.json({
        message: 'Topup success',
        topup: { currency, amount: topupAmount },
      });
    } catch (e) {
      await connection.rollback();
      throw e;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error('❌ [TopUp] Error:', err);
    return NextResponse.json({ message: err?.message || 'Failed' }, { status: 500 });
  }
}
