import { listActiveCurrencies } from '../models/currencyModel.js';
import { listWalletsForUser } from '../models/walletModel.js';
import { fetchAndStoreLatestRates } from '../services/fxService.js';
import { getLatestRatesForBase } from '../models/fxRateModel.js';

export const getCurrencies = async (req, res) => {
  try {
    const currencies = await listActiveCurrencies();
    return res.json(currencies);
  } catch (err) {
    console.error('Get currencies error:', err);
    return res.status(500).json({ message: 'Failed to load currencies' });
  }
};

export const getMyWallets = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const wallets = await listWalletsForUser(userId);
    return res.json(wallets);
  } catch (err) {
    console.error('Get wallets error:', err);
    return res.status(500).json({ message: 'Failed to load wallets' });
  }
};

export const getLatestFxRates = async (req, res) => {
  try {
    const base = req.query.base || 'USD';
    // Fetch fresh rates and store them; ignore errors silently in storage
    await fetchAndStoreLatestRates(base).catch((e) => {
      console.error('FX fetch warning:', e);
    });

    const stored = await getLatestRatesForBase(base);
    return res.json({
      baseCurrency: base,
      rates: stored,
    });
  } catch (err) {
    console.error('Get FX rates error:', err);
    return res.status(500).json({ message: 'Failed to load FX rates' });
  }
};


