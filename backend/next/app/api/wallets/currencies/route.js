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
      `SELECT code, name, symbol, is_active
       FROM currencies
       WHERE is_active = 1
       ORDER BY code ASC`
    );

    return NextResponse.json(rows);
  } catch (err) {
    console.error('Get currencies error:', err);
    return NextResponse.json(
      { message: err?.message || 'Failed to load currencies' },
      { status: 500 }
    );
  }
}

