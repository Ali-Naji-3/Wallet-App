import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(req) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ message: 'No token provided' }, { status: 401 });
    }
    
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
    
    const pool = getPool();
    
    // Get user role from database
    const [userRows] = await pool.query('SELECT id, email, role FROM users WHERE id = ?', [decoded.id]);
    
    if (!userRows || userRows.length === 0) {
      console.log('Notifications API: User not found. User ID:', decoded.id);
      return NextResponse.json({ message: 'User not found' }, { status: 403 });
    }
    
    const userRole = userRows[0]?.role;
    const userEmail = userRows[0]?.email;
    
    console.log('Notifications API: User check - ID:', decoded.id, 'Email:', userEmail, 'Role:', userRole);
    
    // Temporarily allowing any authenticated user for debugging  
    // TODO: Re-enable admin check after fixing auth
    // if (!userRole || userRole !== 'admin') {
    //   return NextResponse.json({ 
    //     message: 'Admin access required', 
    //     role: userRole,
    //     userId: decoded.id,
    //     email: userEmail 
    //   }, { status: 403 });
    // }
    
    // Get notifications for this admin
    const [notifications] = await pool.query(
      `SELECT id, type, title, body, is_read, created_at
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 50`,
      [decoded.id]
    );
    
    // Count unread
    const [unreadCount] = await pool.query(
      `SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0`,
      [decoded.id]
    );
    
    return NextResponse.json({
      notifications,
      unreadCount: unreadCount[0]?.count || 0,
    });
    
  } catch (error) {
    console.error('Error getting notifications:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ message: 'No token provided' }, { status: 401 });
    }
    
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
    
    const pool = getPool();
    
    // Get user role from database
    const [userRows] = await pool.query('SELECT role FROM users WHERE id = ?', [decoded.id]);
    // Temporarily allowing any authenticated user for debugging
    // TODO: Re-enable admin check after fixing auth
    // if (userRows[0]?.role !== 'admin') {
    //   return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    // }
    
    const body = await req.json();
    const { notificationId, markAllRead } = body;
    
    if (markAllRead) {
      // Mark all notifications as read
      await pool.query(
        `UPDATE notifications SET is_read = 1 WHERE user_id = ?`,
        [decoded.id]
      );
      return NextResponse.json({ message: 'All notifications marked as read' });
    }
    
    if (notificationId) {
      // Mark single notification as read
      await pool.query(
        `UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`,
        [notificationId, decoded.id]
      );
      return NextResponse.json({ message: 'Notification marked as read' });
    }
    
    return NextResponse.json({ message: 'Invalid request' }, { status: 400 });
    
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

