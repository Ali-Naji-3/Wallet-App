import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { parseBearer, verifyToken } from '@/lib/auth';

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

    const pool = getPool();
    
    // Mark all notifications as read for this user
    await pool.query(
      `UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0`,
      [user.id]
    );
    
    return NextResponse.json({ 
      message: 'All notifications marked as read',
      success: true 
    });
  } catch (err) {
    console.error('Mark all read error:', err);
    return NextResponse.json(
      { message: err?.message || 'Failed to mark notifications as read' },
      { status: 500 }
    );
  }
}

