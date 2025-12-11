import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { parseBearer, verifyToken } from '@/lib/auth';
import { requireAdmin } from '@/lib/admin';

/**
 * GET /api/admin/support/search
 * Search for users by email or phone number (admin only)
 */
export async function GET(req) {
  try {
    const token = parseBearer(req.headers.get('authorization') || undefined);
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await requireAdmin(token);

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query');
    const type = searchParams.get('type') || 'email';

    if (!query || !query.trim()) {
      return NextResponse.json({ message: 'Search query is required' }, { status: 400 });
    }

    const pool = getPool();
    let sql;
    let params;

    // Check if suspension_reason column exists
    let hasSuspensionReason = false;
    try {
      const [cols] = await pool.query(`SHOW COLUMNS FROM users LIKE 'suspension_reason'`);
      hasSuspensionReason = cols.length > 0;
    } catch (e) {
      // Column doesn't exist
    }

    if (type === 'phone') {
      // Search by phone number (if phone column exists)
      sql = `SELECT id, email, full_name, role, is_verified, is_active, created_at${hasSuspensionReason ? ', suspension_reason' : ''}
             FROM users
             WHERE email LIKE ? OR full_name LIKE ?
             ORDER BY created_at DESC
             LIMIT 20`;
      params = [`%${query}%`, `%${query}%`];
    } else {
      // Search by email
      sql = `SELECT id, email, full_name, role, is_verified, is_active, created_at${hasSuspensionReason ? ', suspension_reason' : ''}
             FROM users
             WHERE email LIKE ?
             ORDER BY created_at DESC
             LIMIT 20`;
      params = [`%${query}%`];
    }

    const [rows] = await pool.query(sql, params);

    // Get KYC status and issues for each user
    const usersWithIssues = await Promise.all(
      rows.map(async (user) => {
        // Get KYC status
        const [kycRows] = await pool.query(
          `SELECT id, status, rejection_reason, submitted_at, created_at
           FROM kyc_verifications
           WHERE user_id = ?
           ORDER BY created_at DESC
           LIMIT 1`,
          [user.id]
        );

        const kyc = kycRows[0] || null;
        
        // Determine issues
        const issues = [];
        
        // Account frozen/suspended
        if (!user.is_active) {
          issues.push({
            type: 'frozen',
            severity: 'high',
            title: 'Account Frozen',
            message: hasSuspensionReason && user.suspension_reason 
              ? `Account is frozen: ${user.suspension_reason}`
              : 'Account is frozen/suspended',
          });
        }

        // KYC rejected
        if (kyc && kyc.status === 'rejected') {
          issues.push({
            type: 'kyc_rejected',
            severity: 'high',
            title: 'KYC Verification Rejected',
            message: kyc.rejection_reason || 'KYC verification was rejected',
            kycId: kyc.id,
            submittedAt: kyc.submitted_at,
          });
        }

        // KYC pending
        if (kyc && (kyc.status === 'pending' || kyc.status === 'under_review')) {
          issues.push({
            type: 'kyc_pending',
            severity: 'medium',
            title: 'KYC Verification Pending',
            message: `KYC verification is ${kyc.status === 'under_review' ? 'under review' : 'pending'}`,
            kycId: kyc.id,
            submittedAt: kyc.submitted_at,
          });
        }

        // Not verified
        if (!user.is_verified && (!kyc || kyc.status !== 'approved')) {
          issues.push({
            type: 'not_verified',
            severity: 'low',
            title: 'Identity Not Verified',
            message: 'User has not completed identity verification',
          });
        }

        return {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          is_verified: user.is_verified === 1,
          is_active: user.is_active === 1,
          created_at: user.created_at,
          suspension_reason: hasSuspensionReason ? user.suspension_reason : null,
          kyc_status: kyc ? kyc.status : null,
          kyc_rejection_reason: kyc && kyc.status === 'rejected' ? kyc.rejection_reason : null,
          issues: issues,
          has_issues: issues.length > 0,
        };
      })
    );

    return NextResponse.json({
      users: usersWithIssues,
      count: usersWithIssues.length,
    });
  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json(
      { message: 'Failed to search users', error: error.message },
      { status: 500 }
    );
  }
}

