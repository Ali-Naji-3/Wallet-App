import { NextResponse } from 'next/server';
import { getPool, ensureNotificationTable } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

function getIdFromParams(req, params) {
  if (params?.id) {
    const parsed = parseInt(params.id, 10);
    if (!Number.isNaN(parsed)) return parsed;
  }
  const url = new URL(req.url);
  const segments = url.pathname.split('/').filter(Boolean);
  for (let i = segments.length - 1; i >= 0; i--) {
    const parsed = parseInt(segments[i], 10);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return null;
}

/**
 * Ensure user has suspension_reason column
 */
async function ensureSuspensionColumn(pool) {
  try {
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS suspension_reason TEXT DEFAULT NULL
    `);
  } catch (err) {
    // Column might already exist or MySQL version doesn't support IF NOT EXISTS
    try {
      const [cols] = await pool.query(`SHOW COLUMNS FROM users LIKE 'suspension_reason'`);
      if (cols.length === 0) {
        await pool.query(`ALTER TABLE users ADD COLUMN suspension_reason TEXT DEFAULT NULL`);
      }
    } catch (innerErr) {
      console.log('[KYC Reject] suspension_reason column check:', innerErr.message);
    }
  }
}

export async function POST(req, { params }) {
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
    
    // Get admin info
    const [adminRows] = await pool.query('SELECT id, email, full_name, role FROM users WHERE id = ?', [decoded.id]);
    const adminName = adminRows[0]?.full_name || adminRows[0]?.email || 'Admin';
    
    const kycId = getIdFromParams(req, params);
    if (!kycId) {
      return NextResponse.json({ message: 'Invalid KYC ID' }, { status: 400 });
    }
    
    const body = await req.json();
    const { rejectionReason, notes, suspendAccount = true } = body; // Default to true - auto-suspend on rejection
    
    if (!rejectionReason) {
      return NextResponse.json({ message: 'Rejection reason is required' }, { status: 400 });
    }
    
    // Get KYC with user info
    const [kyc] = await pool.query(
      `SELECT kv.*, u.email as user_email, u.full_name as user_name, u.role as user_role
       FROM kyc_verifications kv
       JOIN users u ON kv.user_id = u.id
       WHERE kv.id = ?`,
      [kycId]
    );
    
    if (!kyc.length) {
      return NextResponse.json({ message: 'KYC verification not found' }, { status: 404 });
    }
    
    const kycData = kyc[0];
    
    if (!['pending', 'under_review'].includes(kycData.status)) {
      return NextResponse.json({ message: 'Only pending or under review verifications can be rejected' }, { status: 400 });
    }
    
    // Ensure suspension_reason column exists
    await ensureSuspensionColumn(pool);
    
    // Update KYC status
    await pool.query(
      `UPDATE kyc_verifications 
       SET status = 'rejected', 
           rejection_reason = ?,
           admin_notes = ?,
           reviewed_by = ?,
           reviewed_at = NOW()
       WHERE id = ?`,
      [rejectionReason, notes || null, decoded.id, kycId]
    );
    
    // SECURITY: Admin accounts are NEVER suspended, even if suspendAccount is true
    // Auto-suspend account on KYC rejection (ONLY for non-admin users)
    if (suspendAccount && kycData.user_role !== 'admin') {
      const suspensionMessage = `KYC verification rejected: ${rejectionReason}. Your account has been suspended. Please contact support for reinstatement.`;
      
      await pool.query(
        `UPDATE users 
         SET is_active = 0, 
             suspension_reason = ?,
             kyc_verified = 0,
             kyc_tier = 0
         WHERE id = ? AND role != 'admin'`,
        [suspensionMessage, kycData.user_id]
      );
      
      console.log(`[KYC Reject] User ${kycData.user_id} (${kycData.user_email}) account SUSPENDED due to KYC rejection`);
    }
    
    // Always log admin protection
    if (kycData.user_role === 'admin') {
      console.log(`[KYC Reject] Admin account ${kycData.user_id} (${kycData.user_email}) - PROTECTED from suspension`);
      // Ensure admin account remains active (double protection)
      await pool.query(
        `UPDATE users SET is_active = 1, suspension_reason = NULL WHERE id = ? AND role = 'admin'`,
        [kycData.user_id]
      );
    }
    
    // Create notification for the user about their rejection
    try {
      await ensureNotificationTable();
      
      const notificationTitle = suspendAccount && kycData.user_role !== 'admin'
        ? 'Account Suspended - KYC Verification Rejected'
        : 'KYC Verification Rejected';
      
      const notificationBody = suspendAccount && kycData.user_role !== 'admin'
        ? `Your KYC verification has been rejected by ${adminName}. Reason: ${rejectionReason}. Your account has been suspended. Please contact support to request account reinstatement.`
        : `Your KYC verification has been rejected by ${adminName}. Reason: ${rejectionReason}. Please submit a new verification with correct documents.`;
      
      await pool.query(
        `INSERT INTO notifications (user_id, type, title, body)
         VALUES (?, 'kyc_rejected', ?, ?)`,
        [kycData.user_id, notificationTitle, notificationBody]
      );
    } catch (notifError) {
      console.error('[KYC Reject] Failed to create notification:', notifError);
    }
    
    
    // Get updated KYC
    const [updated] = await pool.query(
      `SELECT * FROM kyc_verifications WHERE id = ?`,
      [kycId]
    );
    
    return NextResponse.json({
      message: suspendAccount && kycData.user_role !== 'admin'
        ? 'KYC verification rejected and user account suspended'
        : kycData.user_role === 'admin'
        ? 'KYC verification rejected. Admin account protected from suspension.'
        : 'KYC verification rejected',
      kyc: updated[0],
      userSuspended: suspendAccount && kycData.user_role !== 'admin',
      userId: kycData.user_id,
      userEmail: kycData.user_email,
      userRole: kycData.user_role,
    });
    
  } catch (error) {
    console.error('Error rejecting KYC:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}

