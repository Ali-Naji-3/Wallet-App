import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { parseBearer, verifyToken } from '@/lib/auth';

export async function POST(req) {
  const pool = getPool();
  const conn = await pool.getConnection();

  try {
    const token = parseBearer(req.headers.get('authorization') || undefined);
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const user = verifyToken(token);
    if (!user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const [userRows] = await pool.query(
      `SELECT role FROM users WHERE id = ?`,
      [user.id]
    );

    const role = userRows?.[0]?.role;
    const normalizedRole = String(role || '').trim().toLowerCase();
    if (!userRows.length || normalizedRole !== 'admin') {
      return NextResponse.json({ message: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { userId, walletId, amount, currency, note } = body;

    if (!userId && !walletId) {
      return NextResponse.json({ message: 'Either userId or walletId is required' }, { status: 400 });
    }

    if (!amount) {
      return NextResponse.json({ message: 'Amount is required' }, { status: 400 });
    }

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      return NextResponse.json({ message: 'Invalid amount' }, { status: 400 });
    }

    await conn.beginTransaction();

    try {
      let targetWallet;

      if (walletId) {
        // Credit specific wallet
        const [wallets] = await conn.query(
          `SELECT id, user_id, currency_code, balance, address
           FROM wallets
           WHERE id = ?`,
          [walletId]
        );

        if (wallets.length === 0) {
          await conn.rollback();
          return NextResponse.json({ message: 'Wallet not found' }, { status: 400 });
        }

        targetWallet = wallets[0];
      } else if (userId && currency) {
        // Credit user's wallet for specific currency
        const [wallets] = await conn.query(
          `SELECT id, user_id, currency_code, balance, address
           FROM wallets
           WHERE user_id = ? AND currency_code = ? AND status = 'active'`,
          [userId, currency]
        );

        if (wallets.length === 0) {
          await conn.rollback();
          return NextResponse.json({ message: 'Wallet not found for this user and currency' }, { status: 400 });
        }

        targetWallet = wallets[0];
      } else {
        await conn.rollback();
        return NextResponse.json({ message: 'Invalid request: need walletId or (userId + currency)' }, { status: 400 });
      }

      // Update wallet balance
      await conn.query(
        `UPDATE wallets SET balance = balance + ? WHERE id = ?`,
        [numericAmount, targetWallet.id]
      );

      // Get updated balance
      const [updatedWallet] = await conn.query(
        `SELECT balance FROM wallets WHERE id = ?`,
        [targetWallet.id]
      );

      // Create a transaction record (admin credit)
      await conn.query(
        `INSERT INTO transactions 
         (user_id, type, source_wallet_id, target_wallet_id, source_currency, target_currency, 
          source_amount, target_amount, fx_rate, fee_amount, note)
         VALUES (?, 'transfer', NULL, ?, 'ADMIN', ?, 0, ?, 1, 0, ?)`,
        [
          targetWallet.user_id,
          targetWallet.id,
          targetWallet.currency_code,
          numericAmount,
          note || `Admin credit: ${numericAmount} ${targetWallet.currency_code}`,
        ]
      );

      // Create notification for user with special type 'admin_credit'
      // This will trigger customer logout to see fresh balance
      await conn.query(
        `INSERT INTO notifications (user_id, type, title, body, is_read, created_at)
         VALUES (?, 'admin_credit', ?, ?, 0, NOW())`,
        [
          targetWallet.user_id,
          `Account Credited: ${numericAmount} ${targetWallet.currency_code}`,
          `Your ${targetWallet.currency_code} wallet has been credited with ${numericAmount} ${targetWallet.currency_code} by an administrator. Please login again to see your updated balance.`,
        ]
      );

      await conn.commit();

      return NextResponse.json({
        message: 'Wallet credited successfully',
        walletId: targetWallet.id,
        userId: targetWallet.user_id,
        currency: targetWallet.currency_code,
        amount: numericAmount,
        newBalance: parseFloat(updatedWallet[0].balance),
      });
    } catch (error) {
      await conn.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Credit wallet error:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to credit wallet' },
      { status: 500 }
    );
  } finally {
    conn.release();
  }
}








