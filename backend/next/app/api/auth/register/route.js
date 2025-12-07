import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

/**
 * POST /api/auth/register
 * Creates a new user and returns JWT token
 */
export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, password, fullName, baseCurrency, timezone } = body || {};

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    const pool = getPool();
    
    // 1. Check if user already exists
    const [existingRows] = await pool.query(
      `SELECT id FROM users WHERE email = ? LIMIT 1`,
      [email]
    );
    
    if (existingRows.length > 0) {
      return NextResponse.json(
        { message: 'Email is already registered' },
        { status: 409 }
      );
    }

    // 2. Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 3. Create user
    const [result] = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, base_currency, timezone)
       VALUES (?, ?, ?, ?, ?)`,
      [
        email,
        passwordHash,
        fullName || null,
        baseCurrency || 'USD',
        timezone || 'UTC',
      ]
    );

    const userId = result.insertId;

    // 4. Create JWT Token
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET not configured');
    }

    const token = jwt.sign(
      {
        id: userId,
        email: email,
        role: 'user', // New users are always regular users
      },
      secret,
      { expiresIn: '1d' } // Token expires in 1 day
    );

    // 5. Return token and user info
    return NextResponse.json({
      token,
      user: {
        id: userId,
        email: email,
        fullName: fullName || null,
        baseCurrency: baseCurrency || 'USD',
        timezone: timezone || 'UTC',
      },
    }, { status: 201 });
  } catch (err) {
    console.error('Register error:', err);
    return NextResponse.json(
      { message: err?.message || 'Failed to register' },
      { status: 500 }
    );
  }
}

