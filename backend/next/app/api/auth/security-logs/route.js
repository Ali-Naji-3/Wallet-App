import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { parseBearer, verifyToken } from '@/lib/auth';

/**
 * GET /api/auth/security-logs
 * Get user security logs (login history, password changes, etc.)
 */
export async function GET(req) {
  try {
    const token = parseBearer(req.headers.get('authorization') || undefined);
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (tokenError) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    if (!decoded || !decoded.id) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    const userId = decoded.id;
    const pool = getPool();

    // Check if security_logs table exists, if not return empty array
    let logs = [];
    try {
      const [logRows] = await pool.query(
        `SELECT 
          id,
          action,
          ip_address,
          user_agent,
          created_at
         FROM security_logs 
         WHERE user_id = ? 
         ORDER BY created_at DESC 
         LIMIT 50`,
        [userId]
      );
      logs = logRows.map((log) => ({
        id: log.id,
        action: log.action,
        ipAddress: log.ip_address,
        userAgent: log.user_agent,
        createdAt: log.created_at,
      }));
    } catch (tableError) {
      // Table doesn't exist, return empty array
      console.warn('[Security Logs] security_logs table does not exist:', tableError.message);
    }

    return NextResponse.json({
      success: true,
      logs,
      count: logs.length,
    });
  } catch (error) {
    console.error('[Security Logs] Error getting security logs:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to get security logs',
      },
      { status: 500 }
    );
  }
}

