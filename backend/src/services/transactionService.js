import { getPool } from '../config/db.js';
import { createTransaction } from '../models/transactionModel.js';
import { createNotification } from '../models/notificationModel.js';

export const performExchange = async ({
  userId,
  sourceWallet,
  targetWallet,
  amount,
  fxRate,
  feeAmount = 0,
  note,
}) => {
  const pool = getPool();
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const sourceBalance = Number(sourceWallet.balance);
    if (sourceBalance < amount + feeAmount) {
      throw new Error('Insufficient funds');
    }

    const targetAmount = amount * fxRate;

    await conn.query(
      `
      UPDATE wallets
      SET balance = balance - ?
      WHERE id = ? AND user_id = ?
    `,
      [amount + feeAmount, sourceWallet.id, userId],
    );

    await conn.query(
      `
      UPDATE wallets
      SET balance = balance + ?
      WHERE id = ?
    `,
      [targetAmount, targetWallet.id],
    );

    const txId = await createTransaction(
      {
        userId,
        type: 'exchange',
        sourceWalletId: sourceWallet.id,
        targetWalletId: targetWallet.id,
        sourceCurrency: sourceWallet.currency_code,
        targetCurrency: targetWallet.currency_code,
        sourceAmount: amount,
        targetAmount,
        fxRate,
        feeAmount,
        note,
      },
      conn,
    );

    // Notification for user
    await createNotification(
      {
        userId,
        type: 'transaction',
        title: `Exchange ${amount} ${sourceWallet.currency_code} → ${targetAmount.toFixed(2)} ${targetWallet.currency_code}`,
        body: `You exchanged ${amount} ${sourceWallet.currency_code} to ${targetAmount.toFixed(2)} ${targetWallet.currency_code} at rate ${fxRate}.`,
      },
      conn,
    );

    await conn.commit();
    return { targetAmount };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const performTransfer = async ({
  userId,
  sourceWallet,
  targetWallet,
  amount,
  note,
}) => {
  const pool = getPool();
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const sourceBalance = Number(sourceWallet.balance);
    if (sourceBalance < amount) {
      throw new Error('Insufficient funds');
    }

    await conn.query(
      `
      UPDATE wallets
      SET balance = balance - ?
      WHERE id = ? AND user_id = ?
    `,
      [amount, sourceWallet.id, userId],
    );

    await conn.query(
      `
      UPDATE wallets
      SET balance = balance + ?
      WHERE id = ?
    `,
      [amount, targetWallet.id],
    );

    const txId = await createTransaction(
      {
        userId,
        type: 'transfer',
        sourceWalletId: sourceWallet.id,
        targetWalletId: targetWallet.id,
        sourceCurrency: sourceWallet.currency_code,
        targetCurrency: targetWallet.currency_code,
        sourceAmount: amount,
        targetAmount: amount,
        fxRate: 1,
        feeAmount: 0,
        note,
      },
      conn,
    );

    await createNotification(
      {
        userId,
        type: 'transaction',
        title: `Transfer ${amount} ${sourceWallet.currency_code}`,
        body: `You transferred ${amount} ${sourceWallet.currency_code} from wallet ${sourceWallet.address} to wallet ${targetWallet.address}.`,
      },
      conn,
    );

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};


