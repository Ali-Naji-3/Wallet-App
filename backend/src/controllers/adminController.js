import { getPool } from '../config/db.js';
import {
  listAllUsers,
  countAllUsers,
  findUserById,
  setUserActiveStatus,
  setUserRole,
} from '../models/userModel.js';
import { listWalletsForUser } from '../models/walletModel.js';
import { createNotification } from '../models/notificationModel.js';

/**
 * List all users (with pagination and search)
 */
export const listUsers = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    const users = await listAllUsers(limit, offset, search);
    const total = await countAllUsers(search);

    return res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('Admin list users error:', err);
    return res.status(500).json({ message: 'Failed to list users' });
  }
};

/**
 * Get single user details with their wallets
 */
export const getUserDetails = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (!userId) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const user = await findUserById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const wallets = await listWalletsForUser(userId);

    // Get transaction stats
    const pool = getPool();
    const [txStats] = await pool.query(
      `SELECT 
         COUNT(*) as totalTransactions,
         SUM(CASE WHEN type = 'exchange' THEN 1 ELSE 0 END) as exchanges,
         SUM(CASE WHEN type = 'transfer' THEN 1 ELSE 0 END) as transfers
       FROM transactions
       WHERE user_id = ?`,
      [userId]
    );

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        baseCurrency: user.base_currency,
        timezone: user.timezone,
        role: user.role,
        isVerified: !!user.is_verified,
        isActive: !!user.is_active,
        createdAt: user.created_at,
      },
      wallets,
      stats: {
        totalTransactions: txStats[0]?.totalTransactions || 0,
        exchanges: txStats[0]?.exchanges || 0,
        transfers: txStats[0]?.transfers || 0,
      },
    });
  } catch (err) {
    console.error('Admin get user details error:', err);
    return res.status(500).json({ message: 'Failed to get user details' });
  }
};

/**
 * Freeze a user account (set is_active = 0)
 */
export const freezeUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (!userId) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Prevent admin from freezing themselves
    if (userId === req.user.id) {
      return res.status(400).json({ message: 'Cannot freeze your own account' });
    }

    const user = await setUserActiveStatus(userId, false);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Notify user about freeze
    await createNotification({
      userId,
      type: 'security',
      title: 'Account frozen',
      body: 'Your account has been frozen by an administrator. Please contact support if this is unexpected.',
    });

    return res.json({
      message: 'User account frozen',
      user: {
        id: user.id,
        email: user.email,
        isActive: !!user.is_active,
      },
    });
  } catch (err) {
    console.error('Admin freeze user error:', err);
    return res.status(500).json({ message: 'Failed to freeze user' });
  }
};

/**
 * Unfreeze a user account (set is_active = 1)
 */
export const unfreezeUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (!userId) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const user = await setUserActiveStatus(userId, true);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await createNotification({
      userId,
      type: 'security',
      title: 'Account unfrozen',
      body: 'Your account has been unfrozen and is now active again.',
    });

    return res.json({
      message: 'User account unfrozen',
      user: {
        id: user.id,
        email: user.email,
        isActive: !!user.is_active,
      },
    });
  } catch (err) {
    console.error('Admin unfreeze user error:', err);
    return res.status(500).json({ message: 'Failed to unfreeze user' });
  }
};

/**
 * List all transactions (admin view)
 */
export const listAllTransactions = async (req, res) => {
  try {
    const pool = getPool();
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const offset = (page - 1) * limit;
    const type = req.query.type; // optional filter

    let sql = `
      SELECT t.*, u.email as user_email
      FROM transactions t
      LEFT JOIN users u ON t.user_id = u.id
    `;
    const params = [];

    if (type) {
      sql += ` WHERE t.type = ?`;
      params.push(type);
    }

    sql += ` ORDER BY t.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [rows] = await pool.query(sql, params);

    // Get total count
    let countSql = `SELECT COUNT(*) as count FROM transactions`;
    const countParams = [];
    if (type) {
      countSql += ` WHERE type = ?`;
      countParams.push(type);
    }
    const [countResult] = await pool.query(countSql, countParams);
    const total = countResult[0]?.count || 0;

    return res.json({
      transactions: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('Admin list transactions error:', err);
    return res.status(500).json({ message: 'Failed to list transactions' });
  }
};

/**
 * Get admin dashboard stats
 */
export const getAdminStats = async (req, res) => {
  try {
    const pool = getPool();

    // User stats
    const [userStats] = await pool.query(`
      SELECT 
        COUNT(*) as totalUsers,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as activeUsers,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as adminUsers,
        SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as newUsersLast7Days
      FROM users
    `);

    // Transaction stats
    const [txStats] = await pool.query(`
      SELECT 
        COUNT(*) as totalTransactions,
        SUM(CASE WHEN type = 'exchange' THEN 1 ELSE 0 END) as totalExchanges,
        SUM(CASE WHEN type = 'transfer' THEN 1 ELSE 0 END) as totalTransfers,
        SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 ELSE 0 END) as txLast24Hours
      FROM transactions
    `);

    // Wallet stats
    const [walletStats] = await pool.query(`
      SELECT 
        COUNT(*) as totalWallets,
        SUM(balance) as totalBalance
      FROM wallets
    `);

    return res.json({
      users: userStats[0],
      transactions: txStats[0],
      wallets: walletStats[0],
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    return res.status(500).json({ message: 'Failed to get admin stats' });
  }
};

/**
 * Promote user to admin role
 */
export const promoteToAdmin = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (!userId) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const user = await setUserRole(userId, 'admin');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({
      message: 'User promoted to admin',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Admin promote user error:', err);
    return res.status(500).json({ message: 'Failed to promote user' });
  }
};

/**
 * Credit user wallet with test/fake money (DEMO ONLY)
 * Admin can add balance to any user's wallet for testing purposes
 */
export const creditUserWallet = async (req, res) => {
  try {
    const { userId, currency, amount } = req.body;

    // Validation
    if (!userId || !currency || !amount) {
      return res.status(400).json({ 
        message: 'Missing required fields: userId, currency, amount' 
      });
    }

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ 
        message: 'Amount must be a positive number' 
      });
    }

    const numericUserId = parseInt(userId);
    if (!numericUserId) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Check if user exists
    const user = await findUserById(numericUserId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const pool = getPool();

    // Check if wallet exists for this user and currency
    const [wallets] = await pool.query(
      `SELECT id, balance FROM wallets WHERE user_id = ? AND currency_code = ?`,
      [numericUserId, currency]
    );

    let newBalance;
    
    if (wallets.length === 0) {
      // Create wallet if it doesn't exist
      await pool.query(
        `INSERT INTO wallets (user_id, currency_code, address, balance) 
         VALUES (?, ?, ?, ?)`,
        [numericUserId, currency, `FXW-${currency}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`, numericAmount]
      );
      newBalance = numericAmount;
    } else {
      // Update existing wallet
      const currentBalance = Number(wallets[0].balance) || 0;
      newBalance = currentBalance + numericAmount;
      
      await pool.query(
        `UPDATE wallets SET balance = ? WHERE id = ?`,
        [newBalance, wallets[0].id]
      );
    }

    // Create notification for the user
    await createNotification({
      userId: numericUserId,
      type: 'transaction',
      title: `Test Balance Added`,
      body: `Admin credited your ${currency} wallet with ${numericAmount.toFixed(2)} ${currency} for testing purposes.`,
    });

    // Log the admin action
    console.log(`[ADMIN] User ${req.user.email} credited ${numericAmount} ${currency} to user ${user.email} (ID: ${numericUserId})`);

    return res.json({
      message: 'Wallet credited successfully',
      data: {
        userId: numericUserId,
        userEmail: user.email,
        currency,
        amountAdded: numericAmount,
        newBalance: newBalance,
      },
    });
  } catch (err) {
    console.error('Admin credit wallet error:', err);
    return res.status(500).json({ message: 'Failed to credit wallet' });
  }
};

