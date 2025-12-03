import { getPool } from '../config/db.js';
import { listWalletsForUser } from '../models/walletModel.js';
import { getLatestRatesForBase } from '../models/fxRateModel.js';
import { performExchange, performTransfer } from '../services/transactionService.js';
import { listTransactionsForUser, ensureTransactionTable } from '../models/transactionModel.js';

export const initTransactions = async () => {
  await ensureTransactionTable();
};

const findWalletById = (wallets, id) => wallets.find((w) => w.id === id);

export const exchange = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { sourceWalletId, targetWalletId, amount, note } = req.body || {};
    const numericAmount = Number(amount);
    if (!sourceWalletId || !targetWalletId || !numericAmount || numericAmount <= 0) {
      return res.status(400).json({ message: 'Invalid exchange request' });
    }

    const wallets = await listWalletsForUser(userId);
    const sourceWallet = findWalletById(wallets, Number(sourceWalletId));
    const targetWallet = findWalletById(wallets, Number(targetWalletId));

    if (!sourceWallet || !targetWallet) {
      return res.status(400).json({ message: 'Wallets not found for this user' });
    }

    if (sourceWallet.currency_code === targetWallet.currency_code) {
      return res.status(400).json({ message: 'Cannot exchange between same currency' });
    }

    const base = sourceWallet.currency_code;
    const latestRates = await getLatestRatesForBase(base);
    const pair = latestRates.find((r) => r.quote_currency === targetWallet.currency_code);
    if (!pair) {
      return res.status(400).json({ message: 'FX rate not available for this pair' });
    }

    const fxRate = Number(pair.rate);

    const { targetAmount } = await performExchange({
      userId,
      sourceWallet,
      targetWallet,
      amount: numericAmount,
      fxRate,
      note,
    });

    return res.status(201).json({
      message: 'Exchange completed',
      sourceCurrency: sourceWallet.currency_code,
      targetCurrency: targetWallet.currency_code,
      sourceAmount: numericAmount,
      targetAmount,
      fxRate,
    });
  } catch (err) {
    console.error('Exchange error:', err);
    return res.status(500).json({ message: 'Failed to perform exchange' });
  }
};

export const transfer = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { sourceWalletId, targetWalletId, amount, note } = req.body || {};
    const numericAmount = Number(amount);
    if (!sourceWalletId || !targetWalletId || !numericAmount || numericAmount <= 0) {
      return res.status(400).json({ message: 'Invalid transfer request' });
    }

    const pool = getPool();
    const [targetRows] = await pool.query(
      `
      SELECT w.*, u.email AS target_user_email
      FROM wallets w
      JOIN users u ON w.user_id = u.id
      WHERE w.id = ?
    `,
      [targetWalletId],
    );
    const targetWallet = targetRows[0];
    if (!targetWallet) {
      return res.status(400).json({ message: 'Target wallet not found' });
    }

    const myWallets = await listWalletsForUser(userId);
    const sourceWallet = findWalletById(myWallets, Number(sourceWalletId));
    if (!sourceWallet) {
      return res.status(400).json({ message: 'Source wallet not found for this user' });
    }

    if (sourceWallet.currency_code !== targetWallet.currency_code) {
      return res.status(400).json({ message: 'This simple transfer only supports same-currency' });
    }

    await performTransfer({
      userId,
      sourceWallet,
      targetWallet,
      amount: numericAmount,
      note,
    });

    return res.status(201).json({
      message: 'Transfer completed',
      sourceCurrency: sourceWallet.currency_code,
      targetCurrency: targetWallet.currency_code,
      amount: numericAmount,
    });
  } catch (err) {
    console.error('Transfer error:', err);
    return res.status(500).json({ message: 'Failed to perform transfer' });
  }
};

export const listMyTransactions = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const txs = await listTransactionsForUser(userId, { limit: 20 });
    return res.json(txs);
  } catch (err) {
    console.error('List transactions error:', err);
    return res.status(500).json({ message: 'Failed to load transactions' });
  }
};


