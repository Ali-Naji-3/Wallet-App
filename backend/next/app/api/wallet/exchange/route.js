import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { parseBearer, verifyToken } from '@/lib/auth';
import { getLatestRatesForBase } from '@/lib/fx-rates';

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
    const { sourceCurrency, targetCurrency, amount, note } = body;

    if (!sourceCurrency || !targetCurrency || !amount) {
      return NextResponse.json(
        { message: 'Missing required fields: sourceCurrency, targetCurrency, amount' },
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

    if (sourceCurrency === targetCurrency) {
      return NextResponse.json(
        { message: 'Cannot exchange between same currency' },
        { status: 400 }
      );
    }

    const pool = getPool();
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      // Get user wallets
      const [sourceWallets] = await conn.query(
        `SELECT id, currency_code, balance FROM wallets 
         WHERE user_id = ? AND currency_code = ?`,
        [user.id, sourceCurrency]
      );

      const [targetWallets] = await conn.query(
        `SELECT id, currency_code, balance FROM wallets 
         WHERE user_id = ? AND currency_code = ?`,
        [user.id, targetCurrency]
      );

      if (!sourceWallets.length || !targetWallets.length) {
        await conn.rollback();
        return NextResponse.json(
          { message: 'Wallet not found for one or both currencies' },
          { status: 404 }
        );
      }

      const sourceWallet = sourceWallets[0];
      const targetWallet = targetWallets[0];

      // Check balance
      if (parseFloat(sourceWallet.balance) < numericAmount) {
        await conn.rollback();
        return NextResponse.json(
          { message: 'Insufficient balance' },
          { status: 400 }
        );
      }

      // Get FX rate - try direct lookup first
      const latestRates = await getLatestRatesForBase(sourceCurrency);
      let ratePair = latestRates.find(r => r.quote_currency === targetCurrency);
      
      // If direct rate not found, try inverse (e.g., EUR→USD when only USD→EUR exists)
      if (!ratePair) {
        const inverseRates = await getLatestRatesForBase(targetCurrency);
        const inversePair = inverseRates.find(r => r.quote_currency === sourceCurrency);
        
        if (inversePair) {
          // Calculate inverse rate
          const inverseRate = parseFloat(inversePair.rate);
          ratePair = {
            base_currency: sourceCurrency,
            quote_currency: targetCurrency,
            rate: 1 / inverseRate,
            fetched_at: inversePair.fetched_at,
          };
          console.log(`[Exchange] Using inverse rate: ${sourceCurrency}→${targetCurrency} = ${ratePair.rate} (from inverse ${targetCurrency}→${sourceCurrency} = ${inverseRate})`);
        }
      }
      
      // If still not found, return error
      if (!ratePair) {
        await conn.rollback();
        return NextResponse.json(
          { message: `FX rate not available for ${sourceCurrency} → ${targetCurrency}` },
          { status: 400 }
        );
      }

      const fxRate = parseFloat(ratePair.rate);
      const targetAmount = numericAmount * fxRate;
      const feeAmount = 0; // No fee for now

      // Update source wallet balance
      await conn.query(
        `UPDATE wallets SET balance = balance - ? WHERE id = ?`,
        [numericAmount + feeAmount, sourceWallet.id]
      );

      // Update target wallet balance
      await conn.query(
        `UPDATE wallets SET balance = balance + ? WHERE id = ?`,
        [targetAmount, targetWallet.id]
      );

      // Create transaction record
      const [txResult] = await conn.query(
        `INSERT INTO transactions 
         (user_id, type, source_wallet_id, target_wallet_id, source_currency, target_currency, 
          source_amount, target_amount, fx_rate, fee_amount, note)
         VALUES (?, 'exchange', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user.id,
          sourceWallet.id,
          targetWallet.id,
          sourceCurrency,
          targetCurrency,
          numericAmount,
          targetAmount,
          fxRate,
          feeAmount,
          note || null,
        ]
      );

      // Create notification
      await conn.query(
        `INSERT INTO notifications (user_id, type, title, body, is_read)
         VALUES (?, 'transaction', ?, ?, 0)`,
        [
          user.id,
          `Exchange ${numericAmount} ${sourceCurrency} → ${targetAmount.toFixed(2)} ${targetCurrency}`,
          `You exchanged ${numericAmount} ${sourceCurrency} to ${targetAmount.toFixed(2)} ${targetCurrency} at rate ${fxRate.toFixed(4)}.`,
        ]
      );

      await conn.commit();

      // Get updated balances
      const [updatedSource] = await conn.query(
        `SELECT balance FROM wallets WHERE id = ?`,
        [sourceWallet.id]
      );
      const [updatedTarget] = await conn.query(
        `SELECT balance FROM wallets WHERE id = ?`,
        [targetWallet.id]
      );

      return NextResponse.json({
        success: true,
        message: 'Exchange completed successfully',
        transaction: {
          id: txResult.insertId,
          type: 'exchange',
          sourceCurrency,
          targetCurrency,
          sourceAmount: numericAmount,
          targetAmount,
          fxRate,
          createdAt: new Date().toISOString(),
        },
        balances: {
          [sourceCurrency]: parseFloat(updatedSource[0].balance),
          [targetCurrency]: parseFloat(updatedTarget[0].balance),
        },
      });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('Exchange error:', err);
    return NextResponse.json(
      { message: err.message || 'Failed to perform exchange' },
      { status: 500 }
    );
  }
}

