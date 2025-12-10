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
  const last = segments[segments.length - 1];
  const parsed = parseInt(last, 10);
  if (!Number.isNaN(parsed)) return parsed;
  return null;
}

export async function GET(req, { params }) {
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
    
    // Next.js 16: params is a Promise
    const resolvedParams = await params;
    const kycId = getIdFromParams(req, resolvedParams);
    if (!kycId) {
      return NextResponse.json({ message: 'Invalid KYC ID' }, { status: 400 });
    }
    
    // Get full KYC details
    const [kyc] = await pool.query(
      `SELECT kv.*, u.email, u.full_name, u.created_at as user_created_at,
              reviewer.full_name as reviewer_name, reviewer.email as reviewer_email
       FROM kyc_verifications kv
       JOIN users u ON kv.user_id = u.id
       LEFT JOIN users reviewer ON kv.reviewed_by = reviewer.id
       WHERE kv.id = ?`,
      [kycId]
    );
    
    if (!kyc.length) {
      return NextResponse.json({ message: 'KYC verification not found' }, { status: 404 });
    }
    
    const kycData = kyc[0];
    
    // Get user's KYC history (previous submissions)
    const [history] = await pool.query(
      `SELECT id, status, tier, document_type, submitted_at, reviewed_at, rejection_reason
       FROM kyc_verifications 
       WHERE user_id = ? AND id != ?
       ORDER BY created_at DESC
       LIMIT 5`,
      [kycData.user_id, kycId]
    );
    
    return NextResponse.json({
      kyc: kycData,
      history,
    });
    
  } catch (error) {
    console.error('Error getting KYC:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

