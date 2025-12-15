import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { parseBearer, verifyToken } from '@/lib/auth';

/**
 * POST /api/wallets/my
 * Send money to another user
 */
export async function POST(req) {
  try {
    const token = parseBearer(req.headers.get('authorization') || undefined);
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { recipient, amount, currency, note } = body || {};

    if (!recipient || !amount || !currency) {
      return NextResponse.json(
        { message: 'Recipient, amount, and currency are required' },
        { status: 400 }
      );
    }

    const sendAmount = parseFloat(amount);
    if (sendAmount <= 0) {
      return NextResponse.json(
        { message: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    const pool = getPool();

    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Get sender's wallet balance
      const [senderWallet] = await connection.query(
        `SELECT balance FROM wallets WHERE user_id = ? AND currency = ? FOR UPDATE`,
        [user.id, currency]
      );

      if (!senderWallet || senderWallet.length === 0) {
        throw new Error('Wallet not found');
      }

      const currentBalance = parseFloat(senderWallet[0].balance);

      if (currentBalance < sendAmount) {
        throw new Error('Insufficient balance');
      }

      // Deduct from sender's balance
      await connection.query(
        `UPDATE wallets SET balance = balance - ? WHERE user_id = ? AND currency = ?`,
        [sendAmount, user.id, currency]
      );

      // Find recipient by email
      const [recipients] = await connection.query(
        `SELECT id, full_name FROM users WHERE email = ? LIMIT 1`,
        [recipient]
      );

      let recipientId = null;
      let recipientName = recipient;

      if (recipients.length > 0) {
        recipientId = recipients[0].id;
        recipientName = recipients[0].full_name || recipient;

        // Add to recipient's balance
        await connection.query(
          `INSERT INTO wallets (user_id, currency, balance) 
           VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE balance = balance + ?`,
          [recipientId, currency, sendAmount, sendAmount]
        );
      }

      // Record transaction
      await connection.query(
        `INSERT INTO transactions 
         (user_id, type, from_currency, from_amount, recipient_email, recipient_name, note, status) 
         VALUES (?, 'send', ?, ?, ?, ?, ?, 'completed')`,
        [user.id, currency, sendAmount, recipient, recipientName, note || null]
      );

      // Commit transaction
      await connection.commit();

      console.log(`✅ [Send Money] ${user.email} sent ${sendAmount} ${currency} to ${recipient}`);

      return NextResponse.json({
        message: 'Money sent successfully',
        transaction: {
          type: 'send',
          amount: sendAmount,
          currency,
          recipient: recipientName,
          note,
        },
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (err) {
    console.error('❌ [Send Money] Error:', err);
    return NextResponse.json(
      { message: err?.message || 'Failed to send money' },
      { status: 500 }
    );
  }
}