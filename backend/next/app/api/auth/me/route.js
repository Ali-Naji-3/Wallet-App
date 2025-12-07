import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { parseBearer, verifyToken } from '@/lib/auth';

export async function GET(req) {
  try {
    const token = parseBearer(req.headers.get('authorization') || undefined);
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const user = verifyToken(token);
    if (!user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT id, email, full_name AS fullName, base_currency AS baseCurrency, timezone, role, is_active
       FROM users WHERE id = ? LIMIT 1`,
      [user.id]
    );
    const found = rows[0];
    if (!found) {
      return NextResponse.json({ message: 'Not found' }, { status: 404 });
    }
    
    // SECURITY: Check if account is frozen/suspended
    if (!found.is_active) {
      console.log(`[Auth/Me] Blocked frozen account access: ${found.email}`);
      return NextResponse.json({ 
        message: 'Account Suspended',
        error: 'ACCESS_DENIED',
        details: 'Your account has been suspended. Please contact support.',
        code: 'ACCOUNT_SUSPENDED'
      }, { status: 403 });
    }
    
    return NextResponse.json({ 
      user: {
        id: found.id,
        email: found.email,
        fullName: found.fullName,
        baseCurrency: found.baseCurrency,
        timezone: found.timezone,
        role: found.role || 'user',
        isActive: !!found.is_active,
      }
    });
  } catch (err) {
    return NextResponse.json({ message: err?.message || 'Failed to get profile' }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const token = parseBearer(req.headers.get('authorization') || undefined);
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const user = verifyToken(token);
    if (!user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const body = await req.json().catch(() => ({}));
    const { fullName, baseCurrency, timezone } = body || {};

    const pool = getPool();
    await pool.query(
      `UPDATE users
       SET full_name = ?, base_currency = ?, timezone = ?
       WHERE id = ?`,
      [fullName || null, baseCurrency || 'USD', timezone || 'UTC', user.id]
    );

    const [rows] = await pool.query(
      `SELECT id, email, full_name AS fullName, base_currency AS baseCurrency, timezone
       FROM users WHERE id = ? LIMIT 1`,
      [user.id]
    );
    const updated = rows[0];
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ message: err?.message || 'Failed to update profile' }, { status: 500 });
  }
}

