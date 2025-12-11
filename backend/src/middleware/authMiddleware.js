import jwt from 'jsonwebtoken';
import { findUserById } from '../models/userModel.js';

// middleware الأساسي للتحقق من التوكن
export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: 'Authentication token missing' });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ message: 'JWT secret not configured' });
    }

    const decoded = jwt.verify(token, secret);
    const user = await findUserById(decoded.sub);

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // SECURITY: Block frozen/suspended accounts
    if (!user.is_active) {
      console.log(`[Auth Middleware] Blocked frozen account: ${user.email}`);
      return res.status(403).json({
        message: 'Account Suspended',
        error: 'ACCESS_DENIED',
        details: 'Your account has been suspended. Please contact support.',
        code: 'ACCOUNT_SUSPENDED'
      });
    }

    // Attach user to request for downstream handlers
    req.user = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      base_currency: user.base_currency,
      timezone: user.timezone,
      role: user.role || 'user',
    };

    next();
  } catch (err) {
    console.error('Auth error:', err);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// alias حتى routes القديمة اللي تستعمل "protect" تشتغل
export const protect = requireAuth;

// middleware لصلاحيات الأدمن فقط
export const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      message: 'Admin access only',
      error: 'ACCESS_DENIED',
      code: 'ADMIN_ONLY'
    });
  }
  next();
};
