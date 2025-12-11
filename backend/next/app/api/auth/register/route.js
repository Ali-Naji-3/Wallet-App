import { NextResponse } from 'next/server';
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
    const { email, password, fullName, phoneNumber, baseCurrency, timezone } = body || {};

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    const pool = getPool();
    
    // Check if user already exists
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

    // Check if phone number already exists
    if (phoneNumber) {
      const [phoneRows] = await pool.query(
        `SELECT id FROM users WHERE phone_number = ? LIMIT 1`,
        [phoneNumber]
      );
      
      if (phoneRows.length > 0) {
        return NextResponse.json(
          { message: 'Phone number is already registered' },
          { status: 409 }
        );
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const [result] = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, phone_number, base_currency, timezone)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        email,
        passwordHash,
        fullName || null,
        phoneNumber || null,
        baseCurrency || 'USD',
        timezone || 'UTC',
      ]
    );

    const userId = result.insertId;

    console.log(`✅ [Register] New user created: ${email} (ID: ${userId})`);

    // Create JWT Token
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET not configured');
    }

    const token = jwt.sign(
      {
        id: userId,
        email: email,
        role: 'user',
      },
      secret,
      { expiresIn: '1d' }
    );

    return NextResponse.json({
      token,
      user: {
        id: userId,
        email: email,
        fullName: fullName || null,
        phoneNumber: phoneNumber || null,
        baseCurrency: baseCurrency || 'USD',
        timezone: timezone || 'UTC',
        role: 'user',
      },
    }, { status: 201 });
    
  } catch (err) {
    console.error('❌ [Register] Error:', err);
    return NextResponse.json(
      { message: err?.message || 'Failed to register' },
      { status: 500 }
    );
  }
}