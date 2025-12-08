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

    // Handle params - may be a promise in Next.js 15
    const resolvedParams = params instanceof Promise ? await params : params;
    const notificationId = parseInt(resolvedParams?.id || resolvedParams, 10);
    
    if (!notificationId || isNaN(notificationId)) {
      // Try to get ID from URL as fallback
      const url = new URL(req.url);
      const pathSegments = url.pathname.split('/').filter(Boolean);
      const idFromPath = parseInt(pathSegments[pathSegments.length - 2], 10); // Second to last segment should be ID
      
      if (!idFromPath || isNaN(idFromPath)) {
        return NextResponse.json({ message: 'Invalid notification ID' }, { status: 400 });
      }
      
      // Use ID from path
      const pool = getPool();
      await pool.query(
        `UPDATE notifications
         SET is_read = 1
         WHERE id = ? AND user_id = ?`,
        [idFromPath, user.id]
      );
      
      return NextResponse.json({ message: 'Notification marked as read' });
    }

    const pool = getPool();
    const [result] = await pool.query(
      `UPDATE notifications
       SET is_read = 1
       WHERE id = ? AND user_id = ?`,
      [notificationId, user.id]
    );
    
    // Check if notification was actually updated
    if (result.affectedRows === 0) {
      return NextResponse.json({ 
        message: 'Notification not found or already read',
        error: 'NOT_FOUND'
      }, { status: 404 });
    }

    return NextResponse.json({ message: 'Notification marked as read' });
  } catch (err) {
    console.error('Mark notification read error:', err);
    return NextResponse.json(
      { message: err?.message || 'Failed to update notification' },
      { status: 500 }
    );
  }
}

