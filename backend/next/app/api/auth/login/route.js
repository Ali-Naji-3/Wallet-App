import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

/**
 * POST /api/auth/login
 * Creates a JWT token for authenticated user
 */
export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, password } = body || {};

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    const pool = getPool();
    
    // 1. Find user by email
    const [rows] = await pool.query(
      `SELECT id, email, password_hash, full_name, base_currency, timezone, role, is_active
       FROM users WHERE email = ? LIMIT 1`,
      [email]
    );
    
    const user = rows[0];
    if (!user) {
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.is_active) {
      return NextResponse.json(
        { message: 'Account is frozen. Please contact support.' },
        { status: 403 }
      );
    }

    // 2. Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // 3. Create JWT Token
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET not configured');
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
      },
      secret,
      { expiresIn: '1d' } // Token expires in 1 day
    );

    // 4. Return token and user info
    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        baseCurrency: user.base_currency,
        timezone: user.timezone,
        role: user.role || 'user',
        isActive: !!user.is_active,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json(
      { message: err?.message || 'Failed to login' },
      { status: 500 }
    );
  }
}

