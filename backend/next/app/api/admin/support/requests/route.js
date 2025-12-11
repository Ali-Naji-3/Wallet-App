import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { parseBearer } from '@/lib/auth';
import { requireAdmin } from '@/lib/admin';

/**
 * GET /api/admin/support/requests
 * Get all saved support requests (admin only)
 */
export async function GET(req) {
  try {
    const token = parseBearer(req.headers.get('authorization') || undefined);
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await requireAdmin(token);

    const pool = getPool();

    // Check if support_requests table exists
    let requests = [];
    try {
      // Get all support requests (both admin-entered and user-submitted)
      const [rows] = await pool.query(`
        SELECT id, user_id, email, subject, message, status, created_at
        FROM support_requests
        ORDER BY created_at DESC
        LIMIT 100
      `);
      requests = rows;
    } catch (tableError) {
      // Table doesn't exist yet, that's okay - return empty array
      console.log('[Support Requests] support_requests table does not exist yet');
    }

    const formattedRequests = requests.map((request) => ({
      id: request.id,
      user_id: request.user_id,
      email: request.email,
      subject: request.subject || 'Support Request',
      message: request.message || '',
      status: request.status || 'pending',
      created_at: request.created_at,
    }));

    return NextResponse.json({
      requests: formattedRequests,
      count: formattedRequests.length,
    });
  } catch (error) {
    console.error('Error fetching support requests:', error);
    return NextResponse.json(
      { message: 'Failed to fetch support requests', error: error.message },
      { status: 500 }
    );
  }
}

