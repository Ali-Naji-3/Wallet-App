import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { parseBearer } from '@/lib/auth';
import { requireAdmin } from '@/lib/admin';

/**
 * GET /api/admin/support/recent-emails
 * Get recent verification emails sent (admin only)
 */
export async function GET(req) {
  try {
    const token = parseBearer(req.headers.get('authorization') || undefined);
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await requireAdmin(token);

    const pool = getPool();

    // Check if email_logs table exists
    let emailLogs = [];
    try {
      const [rows] = await pool.query(`
        SELECT el.id, el.user_id, el.user_email, el.user_name, el.status, el.sent_at, el.error_message
        FROM email_logs el
        WHERE el.email_type = 'verification'
        ORDER BY el.sent_at DESC
        LIMIT 50
      `);
      emailLogs = rows;
    } catch (tableError) {
      // Table doesn't exist yet, that's okay
      console.log('[Recent Emails] email_logs table does not exist yet');
    }

    // Get stats
    let stats = {
      totalSent: 0,
      todaySent: 0,
      pendingUsers: 0,
    };

    try {
      // Total sent
      const [totalRows] = await pool.query(`
        SELECT COUNT(*) as count FROM email_logs WHERE email_type = 'verification' AND status = 'sent'
      `);
      stats.totalSent = totalRows[0]?.count || 0;

      // Today sent
      const [todayRows] = await pool.query(`
        SELECT COUNT(*) as count FROM email_logs 
        WHERE email_type = 'verification' 
        AND status = 'sent' 
        AND DATE(sent_at) = CURDATE()
      `);
      stats.todaySent = todayRows[0]?.count || 0;

      // Pending users (users without KYC or with pending KYC)
      const [pendingRows] = await pool.query(`
        SELECT COUNT(DISTINCT u.id) as count
        FROM users u
        LEFT JOIN kyc_verifications kyc ON u.id = kyc.user_id AND kyc.status = 'approved'
        WHERE u.role = 'user' AND u.is_active = 1 AND kyc.id IS NULL
      `);
      stats.pendingUsers = pendingRows[0]?.count || 0;
    } catch (statsError) {
      console.error('[Recent Emails] Error getting stats:', statsError);
    }

    const emails = emailLogs.map((log) => ({
      id: log.id,
      user_id: log.user_id,
      user_email: log.user_email,
      user_name: log.user_name,
      status: log.status,
      sent_at: log.sent_at,
      error_message: log.error_message,
    }));

    return NextResponse.json({
      emails,
      stats,
    });
  } catch (error) {
    console.error('Error fetching recent emails:', error);
    return NextResponse.json(
      { message: 'Failed to fetch recent emails', error: error.message },
      { status: 500 }
    );
  }
}


