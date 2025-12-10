import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { parseBearer } from '@/lib/auth';
import { requireAdmin } from '@/lib/admin';
import bcrypt from 'bcryptjs';

export async function GET(req) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = parseBearer(authHeader || undefined);
    
    if (!token) {
      console.log('[Admin Users] No token provided');
      return NextResponse.json({ message: 'Unauthorized: No token provided' }, { status: 401 });
    }

    // Verify admin access
    try {
      await requireAdmin(token);
    } catch (authError) {
      console.error('[Admin Users] Auth error:', authError.message);
      return NextResponse.json({ 
        message: authError.message || 'Unauthorized' 
      }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const offset = (page - 1) * limit;
    const search = searchParams.get('search') || '';

    const pool = getPool();

    let sql = `
      SELECT id, email, full_name, role, is_active, created_at
      FROM users
      WHERE email NOT LIKE 'deleted_%'
    `;
    const params = [];

    if (search) {
      sql += ` AND (email LIKE ? OR full_name LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [users] = await pool.query(sql, params);

    // Get total count (exclude deleted users)
    let countSql = `SELECT COUNT(*) as count FROM users WHERE email NOT LIKE 'deleted_%'`;
    const countParams = [];
    if (search) {
      countSql += ` AND (email LIKE ? OR full_name LIKE ?)`;
      countParams.push(`%${search}%`, `%${search}%`);
    }
    const [countResult] = await pool.query(countSql, countParams);
    const total = countResult[0]?.count || 0;

    return NextResponse.json({
      users: users.map(u => ({
        id: u.id,
        email: u.email,
        full_name: u.full_name,
        role: u.role,
        is_active: !!u.is_active,
        created_at: u.created_at,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    if (err.message === 'Unauthorized' || err.message.includes('Forbidden')) {
      return NextResponse.json({ message: err.message }, { status: err.message.includes('Forbidden') ? 403 : 401 });
    }
    console.error('Admin list users error:', err);
    return NextResponse.json(
      { message: err?.message || 'Failed to list users' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/users
 * Create a new user (admin only)
 */
export async function POST(req) {
  try {
    const token = parseBearer(req.headers.get('authorization') || undefined);
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await requireAdmin(token);

    const body = await req.json().catch(() => ({}));
    const { email, password, fullName, role, baseCurrency, timezone, isActive } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const pool = getPool();

    // Check if email already exists
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [email]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { message: 'Email is already registered' },
        { status: 409 }
      );
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const [result] = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, role, base_currency, timezone, is_active, is_verified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        email,
        passwordHash,
        fullName || null,
        role === 'admin' ? 'admin' : 'user',
        baseCurrency || 'USD',
        timezone || 'UTC',
        isActive !== false ? 1 : 0,
        1, // Admin-created users are auto-verified
      ]
    );

    const userId = result.insertId;

    // Create default wallets for the user
    const [currencies] = await pool.query(
      'SELECT code FROM currencies WHERE is_active = 1'
    );

    for (const currency of currencies) {
      const address = `FXW-${currency.code}-${userId}-${Date.now().toString(36).toUpperCase()}`;
      await pool.query(
        `INSERT INTO wallets (user_id, currency_code, balance, address, status)
         VALUES (?, ?, 0, ?, 'active')`,
        [userId, currency.code, address]
      );
    }

    // Fetch created user
    const [userRows] = await pool.query(
      'SELECT id, email, full_name, role, base_currency, timezone, is_active, created_at FROM users WHERE id = ?',
      [userId]
    );

    const user = userRows[0];

    return NextResponse.json({
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        baseCurrency: user.base_currency,
        timezone: user.timezone,
        isActive: !!user.is_active,
        createdAt: user.created_at,
      },
    }, { status: 201 });
  } catch (err) {
    if (err.message === 'Unauthorized' || err.message.includes('Forbidden')) {
      return NextResponse.json({ message: err.message }, { status: err.message.includes('Forbidden') ? 403 : 401 });
    }
    console.error('Admin create user error:', err);
    return NextResponse.json(
      { message: err?.message || 'Failed to create user' },
      { status: 500 }
    );
  }
}

