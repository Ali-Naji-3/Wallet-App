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
    
    // 1. Find user by email (include suspension_reason if exists)
    let userQuery = `SELECT id, email, password_hash, full_name, base_currency, timezone, role, is_active`;
    
    // Check if suspension_reason column exists
    try {
      const [cols] = await pool.query(`SHOW COLUMNS FROM users LIKE 'suspension_reason'`);
      if (cols.length > 0) {
        userQuery += `, suspension_reason`;
      }
    } catch (colErr) {
      // Column doesn't exist, continue without it
    }
    
    userQuery += ` FROM users WHERE email = ? LIMIT 1`;
    
    const [rows] = await pool.query(userQuery, [email]);
    
    const user = rows[0];
    if (!user) {
      console.log(`[Login] User not found for email: ${email}`);
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    console.log(`[Login] User found: ID=${user.id}, Email=${user.email}, Role=${user.role}`);
    
    // SECURITY: Verify the email matches (prevent email injection)
    if (user.email.toLowerCase() !== email.toLowerCase()) {
      console.error(`[Login] SECURITY WARNING: Email mismatch! Query: ${email}, Found: ${user.email}`);
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check if user account is suspended/frozen
    if (!user.is_active) {
      // Professional message for suspended accounts
      const suspensionReason = user.suspension_reason || null;
      
      return NextResponse.json(
        { 
          message: 'Account Suspended',
          error: 'ACCESS_DENIED',
          details: suspensionReason 
            ? `Your account has been suspended. Reason: ${suspensionReason}`
            : 'Your account has been suspended. Please contact support for assistance.',
          contactSupport: true,
          code: 'ACCOUNT_SUSPENDED'
        },
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
        role: user.role || 'user',
      },
      secret,
      { expiresIn: '1d' } // Token expires in 1 day
    );

    // 4. Return token and user info
    const responseData = {
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
    };
    
    console.log(`[Login] Returning user data: Email=${responseData.user.email}, Role=${responseData.user.role}`);
    
    return NextResponse.json(responseData);
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json(
      { message: err?.message || 'Failed to login' },
      { status: 500 }
    );
  }
}

