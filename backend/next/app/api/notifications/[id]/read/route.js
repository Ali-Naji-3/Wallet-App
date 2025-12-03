import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { parseBearer, verifyToken } from '@/lib/auth';

export async function POST(req, { params }) {
  try {
    const token = parseBearer(req.headers.get('authorization') || undefined);
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const user = verifyToken(token);
    if (!user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const notificationId = parseInt(params.id, 10);
    if (!notificationId) {
      return NextResponse.json({ message: 'Invalid notification ID' }, { status: 400 });
    }

    const pool = getPool();
    await pool.query(
      `UPDATE notifications
       SET is_read = 1
       WHERE id = ? AND user_id = ?`,
      [notificationId, user.id]
    );

    return NextResponse.json({ message: 'Notification marked as read' });
  } catch (err) {
    console.error('Mark notification read error:', err);
    return NextResponse.json(
      { message: err?.message || 'Failed to update notification' },
      { status: 500 }
    );
  }
}

