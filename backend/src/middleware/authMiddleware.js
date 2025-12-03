import jwt from 'jsonwebtoken';
import { findUserById } from '../models/userModel.js';

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

    if (!user || !user.is_active) {
      return res.status(401).json({ message: 'Invalid or inactive user' });
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


