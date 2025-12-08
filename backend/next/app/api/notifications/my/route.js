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

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);

    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT id, user_id, type, title, body, is_read, created_at
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ?`,
      [user.id, limit]
    );

    return NextResponse.json({ notifications: rows });
  } catch (err) {
    console.error('Get notifications error:', err);
    return NextResponse.json(
      { message: err?.message || 'Failed to load notifications' },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const token = parseBearer(req.headers.get('authorization') || undefined);
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const user = verifyToken(token);
    if (!user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { notificationId, markAllRead } = body;

    const pool = getPool();

    if (markAllRead) {
      // Mark all notifications as read
      await pool.query(
        `UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0`,
        [user.id]
      );
      return NextResponse.json({ message: 'All notifications marked as read' });
    }

    if (notificationId) {
      // Mark single notification as read
      const [result] = await pool.query(
        `UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`,
        [notificationId, user.id]
      );
      
      if (result.affectedRows === 0) {
        return NextResponse.json({ 
          message: 'Notification not found or already read',
          error: 'NOT_FOUND'
        }, { status: 404 });
      }
      
      return NextResponse.json({ message: 'Notification marked as read' });
    }

    return NextResponse.json({ message: 'Invalid request' }, { status: 400 });
  } catch (err) {
    console.error('Mark notification read error:', err);
    return NextResponse.json(
      { message: err?.message || 'Failed to update notification' },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    const token = parseBearer(req.headers.get('authorization') || undefined);
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const user = verifyToken(token);
    if (!user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const notificationId = searchParams.get('id');
    const clearAll = searchParams.get('clearAll') === 'true';

    const pool = getPool();

    if (clearAll) {
      // Delete all notifications for this user
      await pool.query(
        `DELETE FROM notifications WHERE user_id = ?`,
        [user.id]
      );
      return NextResponse.json({ message: 'All notifications cleared' });
    }

    if (notificationId) {
      // Delete single notification
      const [result] = await pool.query(
        `DELETE FROM notifications WHERE id = ? AND user_id = ?`,
        [notificationId, user.id]
      );
      
      if (result.affectedRows === 0) {
        return NextResponse.json({ 
          message: 'Notification not found',
          error: 'NOT_FOUND'
        }, { status: 404 });
      }
      
      return NextResponse.json({ message: 'Notification deleted' });
    }

    return NextResponse.json({ message: 'Invalid request' }, { status: 400 });
  } catch (err) {
    console.error('Delete notification error:', err);
    return NextResponse.json(
      { message: err?.message || 'Failed to delete notification' },
      { status: 500 }
    );
  }
}

