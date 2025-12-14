import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { parseBearer, verifyToken } from '@/lib/auth';

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

    const body = await req.json();
    const { recipientEmail, amount, currency, note } = body;

    // Validation
    if (!recipientEmail || !amount || !currency) {
      return NextResponse.json(
        { message: 'Missing required fields: recipientEmail, amount, currency' },
        { status: 400 }
      );
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return NextResponse.json(
        { message: 'Invalid amount' },
        { status: 400 }
      );
    }

    const pool = getPool();
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      // Find recipient user by email
      const [recipientUsers] = await conn.query(
        `SELECT id, email FROM users WHERE email = ? AND is_active = 1`,
        [recipientEmail]
      );

      if (!recipientUsers.length) {
        await conn.rollback();
        return NextResponse.json(
          { message: 'Recipient not found or inactive' },
          { status: 404 }
        );
      }

      const recipientUser = recipientUsers[0];

      // Prevent self-transfer
      if (recipientUser.id === user.id) {
        await conn.rollback();
        return NextResponse.json(
          { message: 'Cannot transfer to yourself' },
          { status: 400 }
        );
      }

      // Get sender's wallet
      const [senderWallets] = await conn.query(
        `SELECT id, currency_code, balance FROM wallets 
         WHERE user_id = ? AND currency_code = ?`,
        [user.id, currency]
      );

      if (!senderWallets.length) {
        await conn.rollback();
        return NextResponse.json(
          { message: `You don't have a ${currency} wallet` },
          { status: 404 }
        );
      }

      const senderWallet = senderWallets[0];

      // Check balance
      if (parseFloat(senderWallet.balance) < numericAmount) {
        await conn.rollback();
        return NextResponse.json(
          { message: 'Insufficient balance' },
          { status: 400 }
        );
      }

      // Get or create recipient's wallet
      let [recipientWallets] = await conn.query(
        `SELECT id, currency_code, balance FROM wallets 
         WHERE user_id = ? AND currency_code = ?`,
        [recipientUser.id, currency]
      );

      let recipientWallet;
      if (!recipientWallets.length) {
        // Create wallet for recipient
        const address = `FXW-${currency}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
        const [insertResult] = await conn.query(
          `INSERT INTO wallets (user_id, currency_code, address, balance) 
           VALUES (?, ?, ?, 0)`,
          [recipientUser.id, currency, address]
        );
        recipientWallet = {
          id: insertResult.insertId,
          currency_code: currency,
          balance: 0,
        };
      } else {
        recipientWallet = recipientWallets[0];
      }

      const feeAmount = 0; // No fee for now

      // Update sender's balance
      await conn.query(
        `UPDATE wallets SET balance = balance - ? WHERE id = ?`,
        [numericAmount + feeAmount, senderWallet.id]
      );

      // Update recipient's balance
      await conn.query(
        `UPDATE wallets SET balance = balance + ? WHERE id = ?`,
        [numericAmount, recipientWallet.id]
      );

      // Create transaction record
      const [txResult] = await conn.query(
        `INSERT INTO transactions 
         (user_id, type, source_wallet_id, target_wallet_id, source_currency, target_currency, 
          source_amount, target_amount, fee_amount, note)
         VALUES (?, 'transfer', ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user.id,
          senderWallet.id,
          recipientWallet.id,
          currency,
          currency, // Same currency for transfer
          numericAmount,
          numericAmount, // Same amount
          feeAmount,
          note || null,
        ]
      );

      // Create notification for sender
      await conn.query(
        `INSERT INTO notifications (user_id, type, title, body, is_read)
         VALUES (?, 'transaction', ?, ?, 0)`,
        [
          user.id,
          `Sent ${numericAmount} ${currency}`,
          `You sent ${numericAmount} ${currency} to ${recipientEmail}.`,
        ]
      );

      // Create notification for recipient
      await conn.query(
        `INSERT INTO notifications (user_id, type, title, body, is_read)
         VALUES (?, 'transaction', ?, ?, 0)`,
        [
          recipientUser.id,
          `Received ${numericAmount} ${currency}`,
          `You received ${numericAmount} ${currency} from ${user.email}.`,
        ]
      );

      await conn.commit();

      // Get updated balances
      const [updatedSender] = await conn.query(
        `SELECT balance FROM wallets WHERE id = ?`,
        [senderWallet.id]
      );

      return NextResponse.json({
        success: true,
        message: 'Transfer completed successfully',
        transaction: {
          id: txResult.insertId,
          type: 'transfer',
          recipientEmail,
          currency,
          amount: numericAmount,
          createdAt: new Date().toISOString(),
        },
        newBalance: parseFloat(updatedSender[0].balance),
      });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('Transfer error:', err);
    return NextResponse.json(
      { message: err.message || 'Failed to perform transfer' },
      { status: 500 }
    );
  }
}
