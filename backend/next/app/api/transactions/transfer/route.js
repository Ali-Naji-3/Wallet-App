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

    const body = await req.json();
    const { recipient, amount, currency, note } = body;

    if (!recipient || !amount || !currency) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      return NextResponse.json({ message: 'Invalid amount' }, { status: 400 });
    }

    await conn.beginTransaction();

    try {
      // Get user's wallets
      const [myWallets] = await conn.query(
        `SELECT id, currency_code, balance, address
         FROM wallets
         WHERE user_id = ? AND currency_code = ? AND status = 'active'`,
        [user.id, currency]
      );

      if (myWallets.length === 0) {
        await conn.rollback();
        return NextResponse.json({ message: 'Source wallet not found' }, { status: 400 });
      }

      const sourceWallet = myWallets[0];
      const sourceBalance = Number(sourceWallet.balance);

      if (sourceBalance < numericAmount) {
        await conn.rollback();
        return NextResponse.json({ message: 'Insufficient funds' }, { status: 400 });
      }

      // Find recipient wallet by email
      const [recipientUsers] = await conn.query(
        `SELECT id FROM users WHERE email = ? LIMIT 1`,
        [recipient]
      );

      if (recipientUsers.length === 0) {
        await conn.rollback();
        return NextResponse.json({ message: 'Recipient not found' }, { status: 400 });
      }

      const recipientUserId = recipientUsers[0].id;

      // Get recipient's wallet for the same currency
      const [targetWallets] = await conn.query(
        `SELECT id, currency_code, balance, address
         FROM wallets
         WHERE user_id = ? AND currency_code = ? AND status = 'active'`,
        [recipientUserId, currency]
      );

      if (targetWallets.length === 0) {
        await conn.rollback();
        return NextResponse.json({ message: 'Recipient wallet not found for this currency' }, { status: 400 });
      }

      const targetWallet = targetWallets[0];

      // Update balances
      await conn.query(
        `UPDATE wallets SET balance = balance - ? WHERE id = ? AND user_id = ?`,
        [numericAmount, sourceWallet.id, user.id]
      );

      await conn.query(
        `UPDATE wallets SET balance = balance + ? WHERE id = ?`,
        [numericAmount, targetWallet.id]
      );

      // Create transaction record
      const [txResult] = await conn.query(
        `INSERT INTO transactions 
         (user_id, type, source_wallet_id, target_wallet_id, source_currency, target_currency, 
          source_amount, target_amount, fx_rate, fee_amount, note)
         VALUES (?, 'transfer', ?, ?, ?, ?, ?, ?, 1, 0, ?)`,
        [
          user.id,
          sourceWallet.id,
          targetWallet.id,
          sourceWallet.currency_code,
          targetWallet.currency_code,
          numericAmount,
          numericAmount,
          note || null,
        ]
      );

      // Create notification for sender
      await conn.query(
        `INSERT INTO notifications (user_id, type, title, body, is_read, created_at)
         VALUES (?, 'transaction', ?, ?, 0, NOW())`,
        [
          user.id,
          `Transfer ${numericAmount} ${currency}`,
          `You transferred ${numericAmount} ${currency} to ${recipient}.`,
        ]
      );

      // Create notification for recipient
      await conn.query(
        `INSERT INTO notifications (user_id, type, title, body, is_read, created_at)
         VALUES (?, 'transaction', ?, ?, 0, NOW())`,
        [
          recipientUserId,
          `Received ${numericAmount} ${currency}`,
          `You received ${numericAmount} ${currency} from ${user.email}.`,
        ]
      );

      await conn.commit();

      return NextResponse.json({
        message: 'Transfer completed successfully',
        transactionId: txResult.insertId,
        amount: numericAmount,
        currency,
      });
    } catch (error) {
      await conn.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Transfer error:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to process transfer' },
      { status: 500 }
    );
  } finally {
    conn.release();
  }
}



