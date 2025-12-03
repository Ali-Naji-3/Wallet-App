import { getPool } from '../config/db.js';
import { listWalletsForUser } from '../models/walletModel.js';
import { fetchAndStoreLatestRates } from '../services/fxService.js';

/**
 * Get portfolio summary for the current user
 * - Total balance (converted to base currency)
 * - Wallet breakdown
 * - Recent activity count
 */
export const getPortfolioSummary = async (req, res) => {
  try {
    const userId = req.user?.id;
    const baseCurrency = req.user?.base_currency || 'USD';

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const pool = getPool();

    // Get user wallets
    const wallets = await listWalletsForUser(userId);

    // Get latest FX rates for conversion
    let rates = {};
    try {
      const rateData = await fetchAndStoreLatestRates(baseCurrency);
      rates = rateData.rates || {};
    } catch (e) {
      // If rates fail, we'll show raw balances
      console.warn('Could not fetch rates for portfolio:', e.message);
    }

    // Calculate total portfolio value in base currency
    let totalInBase = 0;
    const walletBreakdown = wallets.map((w) => {
      const balance = parseFloat(w.balance) || 0;
      let valueInBase = balance;

      if (w.currency_code === baseCurrency) {
        valueInBase = balance;
      } else if (rates[w.currency_code]) {
        // rates[X] = how many X per 1 base, so we divide
        valueInBase = balance / rates[w.currency_code];
      }

      totalInBase += valueInBase;

      return {
        currencyCode: w.currency_code,
        balance: balance,
        valueInBase: Math.round(valueInBase * 100) / 100,
        status: w.status,
      };
    });

    // Get transaction counts (last 30 days)
    const [txStats] = await pool.query(
      `SELECT 
         COUNT(*) as totalCount,
         SUM(CASE WHEN type = 'exchange' THEN 1 ELSE 0 END) as exchangeCount,
         SUM(CASE WHEN type = 'transfer' THEN 1 ELSE 0 END) as transferCount
       FROM transactions
       WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`,
      [userId]
    );

    // Get P&L from exchanges (sum of target amounts - source amounts in base currency)
    const [plData] = await pool.query(
      `SELECT 
         SUM(target_amount) as totalReceived,
         SUM(source_amount) as totalSent,
         COUNT(*) as exchangeCount
       FROM transactions
       WHERE user_id = ? AND type = 'exchange'`,
      [userId]
    );

    return res.json({
      baseCurrency,
      totalPortfolioValue: Math.round(totalInBase * 100) / 100,
      walletBreakdown,
      stats: {
        last30Days: {
          totalTransactions: txStats[0]?.totalCount || 0,
          exchanges: txStats[0]?.exchangeCount || 0,
          transfers: txStats[0]?.transferCount || 0,
        },
      },
      exchangeSummary: {
        totalReceived: parseFloat(plData[0]?.totalReceived) || 0,
        totalSent: parseFloat(plData[0]?.totalSent) || 0,
        exchangeCount: plData[0]?.exchangeCount || 0,
      },
    });
  } catch (err) {
    console.error('Portfolio summary error:', err);
    return res.status(500).json({ message: 'Failed to get portfolio summary' });
  }
};

/**
 * Get recent activity feed for dashboard
 */
export const getRecentActivity = async (req, res) => {
  try {
    const userId = req.user?.id;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT id, type, source_currency, source_amount, target_currency, target_amount,
              fx_rate, fee, note, created_at
       FROM transactions
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ?`,
      [userId, limit]
    );

    return res.json({ transactions: rows });
  } catch (err) {
    console.error('Recent activity error:', err);
    return res.status(500).json({ message: 'Failed to get recent activity' });
  }
};

/**
 * Get P&L chart data (daily aggregates for last N days)
 */
export const getPLChartData = async (req, res) => {
  try {
    const userId = req.user?.id;
    const days = Math.min(parseInt(req.query.days) || 30, 90);

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT 
         DATE(created_at) as date,
         SUM(CASE WHEN type = 'exchange' THEN target_amount - source_amount ELSE 0 END) as dailyPL,
         COUNT(*) as txCount
       FROM transactions
       WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [userId, days]
    );

    return res.json({ chartData: rows, days });
  } catch (err) {
    console.error('PL chart error:', err);
    return res.status(500).json({ message: 'Failed to get P&L chart data' });
  }
};

