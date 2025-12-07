import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
  ensureUserTable,
  findUserByEmail,
  findUserById,
  createUser,
  updateUserProfile,
  updateUserPassword,
} from '../models/userModel.js';
import { ensureCurrencyTable, seedDefaultCurrencies } from '../models/currencyModel.js';
import { ensureWalletTable, createDefaultWalletsForUser } from '../models/walletModel.js';
import { ensureFxRateTable } from '../models/fxRateModel.js';
import { ensureNotificationTable } from '../models/notificationModel.js';

const JWT_EXPIRES_IN = '1d';

const buildToken = (user) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT secret not configured');
  }

  return jwt.sign(
    {
      sub: user.id,
      id: user.id,
      email: user.email,
      role: user.role || 'user',
    },
    secret,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

export const initAuth = async () => {
  // Ensure core tables exist before handling any auth requests
  await ensureUserTable();
  await ensureCurrencyTable();
  await ensureWalletTable();
  await ensureFxRateTable();
   await ensureNotificationTable();
  await seedDefaultCurrencies();
};

export const register = async (req, res) => {
  try {
    const { email, password, fullName, baseCurrency, timezone } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ message: 'Email is already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await createUser({
      email,
      passwordHash,
      fullName,
      baseCurrency,
      timezone,
    });

    // Auto-create default wallets for this user (one per active currency)
    await createDefaultWalletsForUser(user.id);

    const token = buildToken(user);

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        baseCurrency: user.base_currency,
        timezone: user.timezone,
        role: user.role || 'user',
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ message: 'Failed to register user' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await findUserByEmail(email);
    
    // Check if user exists
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check if account is frozen/suspended BEFORE password check
    if (!user.is_active) {
      console.log(`[Login] Blocked frozen account: ${email}`);
      return res.status(403).json({ 
        message: 'Account Suspended',
        error: 'ACCESS_DENIED',
        details: 'Your account has been suspended. Please contact support for assistance.',
        contactSupport: true,
        code: 'ACCOUNT_SUSPENDED'
      });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = buildToken(user);

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        baseCurrency: user.base_currency,
        timezone: user.timezone,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Failed to login' });
  }
};

export const getProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await findUserById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // SECURITY: Check if account is frozen
    if (!user.is_active) {
      console.log(`[Profile] Blocked frozen account: ${user.email}`);
      return res.status(403).json({ 
        message: 'Account Suspended',
        error: 'ACCESS_DENIED',
        details: 'Your account has been suspended. Please contact support.',
        code: 'ACCOUNT_SUSPENDED'
      });
    }

    return res.json({
      user: {
      id: user.id,
      email: user.email,
        full_name: user.full_name,
        base_currency: user.base_currency,
      timezone: user.timezone,
        role: user.role,
        is_active: user.is_active,
        is_verified: user.is_verified,
      },
    });
  } catch (err) {
    console.error('Get profile error:', err);
    return res.status(500).json({ message: 'Failed to get profile' });
  }
};

export const updateProfileHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { fullName, baseCurrency, timezone } = req.body || {};
    const updated = await updateUserProfile(userId, { fullName, baseCurrency, timezone });

    return res.json({
      id: updated.id,
      email: updated.email,
      fullName: updated.full_name,
      baseCurrency: updated.base_currency,
      timezone: updated.timezone,
    });
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({ message: 'Failed to update profile' });
  }
};

export const changePassword = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required' });
    }

    const user = await findUserById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);
    await updateUserPassword(userId, passwordHash);

    return res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    return res.status(500).json({ message: 'Failed to change password' });
  }
};


