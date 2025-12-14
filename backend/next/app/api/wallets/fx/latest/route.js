import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { parseBearer, verifyToken } from '@/lib/auth';

// Exchange rates (USD base)
const exchangeRates = {
  USD: 1,
  EUR: 1.09,
  LBP: 0.0000112,
};

/**
 * POST /api/wallets/fx
 * Exchange currency
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
    const { fromCurrency, toCurrency, fromAmount } = body || {};

    if (!fromCurrency || !toCurrency || !fromAmount) {
      return NextResponse.json(
        { message: 'From currency, to currency, and amount are required' },
        { status: 400 }
      );
    }

    const amount = parseFloat(fromAmount);
    if (amount <= 0) {
      return NextResponse.json(
        { message: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Calculate exchange
    const fromRate = exchangeRates[fromCurrency] || 1;
    const toRate = exchangeRates[toCurrency] || 1;
    const toAmount = (amount * fromRate) / toRate;

    const pool = getPool();

    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Check source wallet balance
      const [sourceWallet] = await connection.query(
        `SELECT balance FROM wallets WHERE user_id = ? AND currency = ? FOR UPDATE`,
        [user.id, fromCurrency]
      );

      if (!sourceWallet || sourceWallet.length === 0) {
        throw new Error('Source wallet not found');
      }

      const currentBalance = parseFloat(sourceWallet[0].balance);

      if (currentBalance < amount) {
        throw new Error('Insufficient balance');
      }

      // Deduct from source currency
      await connection.query(
        `UPDATE wallets SET balance = balance - ? WHERE user_id = ? AND currency = ?`,
        [amount, user.id, fromCurrency]
      );

      // Add to destination currency
      await connection.query(
        `INSERT INTO wallets (user_id, currency, balance) 
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE balance = balance + ?`,
        [user.id, toCurrency, toAmount, toAmount]
      );

      // Record transaction
      await connection.query(
        `INSERT INTO transactions 
         (user_id, type, from_currency, to_currency, from_amount, to_amount, status) 
         VALUES (?, 'exchange', ?, ?, ?, ?, 'completed')`,
        [user.id, fromCurrency, toCurrency, amount, toAmount]
      );

      // Commit transaction
      await connection.commit();

      console.log(`✅ [Exchange] ${user.email} exchanged ${amount} ${fromCurrency} to ${toAmount.toFixed(2)} ${toCurrency}`);

      return NextResponse.json({
        message: 'Exchange successful',
        exchange: {
          fromCurrency,
          toCurrency,
          fromAmount: amount,
          toAmount,
          rate: toAmount / amount,
        },
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (err) {
    console.error('❌ [Exchange] Error:', err);
    return NextResponse.json(
      { message: err?.message || 'Failed to exchange currency' },
      { status: 500 }
    );
  }
}