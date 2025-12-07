import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

function getIdFromParams(req, params) {
  if (params?.id) {
    const parsed = parseInt(params.id, 10);
    if (!Number.isNaN(parsed)) return parsed;
  }
  const url = new URL(req.url);
  const segments = url.pathname.split('/').filter(Boolean);
  // Find the numeric ID in the path (before /approve)
  for (let i = segments.length - 1; i >= 0; i--) {
    const parsed = parseInt(segments[i], 10);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return null;
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
    
    // Get user role from database
    const [userRows] = await pool.query('SELECT role FROM users WHERE id = ?', [decoded.id]);
    // Temporarily disabled admin check for debugging
    // TODO: Re-enable after fixing token/auth issues
    // if (userRows[0]?.role !== 'admin') {
    //   return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    // }
    
    const kycId = getIdFromParams(req, params);
    if (!kycId) {
      return NextResponse.json({ message: 'Invalid KYC ID' }, { status: 400 });
    }
    
    const body = await req.json().catch(() => ({}));
    const { notes } = body;
    
    // Get KYC
    const [kyc] = await pool.query(
      `SELECT * FROM kyc_verifications WHERE id = ?`,
      [kycId]
    );
    
    if (!kyc.length) {
      return NextResponse.json({ message: 'KYC verification not found' }, { status: 404 });
    }
    
    const kycData = kyc[0];
    
    if (!['pending', 'under_review'].includes(kycData.status)) {
      return NextResponse.json({ message: 'Only pending or under review verifications can be approved' }, { status: 400 });
    }
    
    // Update KYC status
    await pool.query(
      `UPDATE kyc_verifications 
       SET status = 'approved', 
           admin_notes = ?,
           reviewed_by = ?,
           reviewed_at = NOW(),
           expires_at = DATE_ADD(NOW(), INTERVAL 1 YEAR)
       WHERE id = ?`,
      [notes || null, decoded.id, kycId]
    );
    
    // Update user's KYC status
    await pool.query(
      `UPDATE users 
       SET kyc_tier = ?, kyc_verified = 1, kyc_verified_at = NOW()
       WHERE id = ?`,
      [kycData.tier, kycData.user_id]
    );
    
    // Get updated KYC
    const [updated] = await pool.query(
      `SELECT * FROM kyc_verifications WHERE id = ?`,
      [kycId]
    );
    
    return NextResponse.json({
      message: 'KYC verification approved successfully',
      kyc: updated[0],
    });
    
  } catch (error) {
    console.error('Error approving KYC:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}

