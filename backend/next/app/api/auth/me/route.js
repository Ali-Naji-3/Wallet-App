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
      `SELECT id, email, full_name AS fullName, base_currency AS baseCurrency, timezone
       FROM users WHERE id = ? LIMIT 1`,
      [user.id]
    );
    const found = rows[0];
    if (!found) {
      return NextResponse.json({ message: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(found);
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

