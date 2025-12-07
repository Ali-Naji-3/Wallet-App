import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { parseBearer, verifyToken } from '@/lib/auth';

export async function GET(req) {
  try {
    // Verify user is authenticated
    const authHeader = req.headers.get('authorization');
    const token = parseBearer(authHeader || undefined);
    
    if (!token) {
      return NextResponse.json({ message: 'No token provided' }, { status: 401 });
    }
    
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (tokenError) {
      return NextResponse.json({ message: 'Invalid or expired token' }, { status: 401 });
    }
    
    if (!decoded || !decoded.id) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
    
    const userId = decoded.id;
    const pool = getPool();
    
    // SECURITY: Check if account is frozen before allowing access
    const [userCheck] = await pool.query(
      `SELECT id, email, is_active FROM users WHERE id = ? LIMIT 1`,
      [userId]
    );
    
    if (!userCheck || userCheck.length === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    
    if (!userCheck[0].is_active) {
      console.log(`[KYC Status] Blocked frozen account: ${userCheck[0].email}`);
      return NextResponse.json({ 
        message: 'Account Suspended',
        error: 'ACCESS_DENIED',
        details: 'Your account has been suspended. Please contact support.',
        code: 'ACCOUNT_SUSPENDED'
      }, { status: 403 });
    }
    
    // Get user's KYC info
    const [user] = await pool.query(
      `SELECT kyc_tier, kyc_verified, kyc_verified_at FROM users WHERE id = ?`,
      [userId]
    );
    
    // Get latest KYC verification
    const [kyc] = await pool.query(
      `SELECT id, status, tier, document_type, submitted_at, reviewed_at, rejection_reason, expires_at
       FROM kyc_verifications 
       WHERE user_id = ? 
       ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );
    
    if (!kyc.length) {
      return NextResponse.json({
        status: 'not_started',
        tier: 0,
        verified: false,
        message: 'You have not submitted any KYC verification yet',
      });
    }
    
    const kycData = kyc[0];
    
    return NextResponse.json({
      id: kycData.id,
      status: kycData.status,
      tier: kycData.tier,
      document_type: kycData.document_type,
      submitted_at: kycData.submitted_at,
      reviewed_at: kycData.reviewed_at,
      rejection_reason: kycData.status === 'rejected' ? kycData.rejection_reason : null,
      expires_at: kycData.expires_at,
      verified: user[0]?.kyc_verified === 1,
      user_tier: user[0]?.kyc_tier || 0,
    });
    
  } catch (error) {
    console.error('Error getting KYC status:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

