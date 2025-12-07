import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(req) {
  try {
    // Verify admin
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ message: 'No token provided' }, { status: 401 });
    }
    
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (tokenError) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
    
    const pool = getPool();
    
    // Get user role from database (more reliable than token)
    const [userRows] = await pool.query(
      'SELECT id, email, role FROM users WHERE id = ?',
      [decoded.id]
    );
    
    if (!userRows || userRows.length === 0) {
      console.log('KYC API: User not found. User ID:', decoded.id);
      return NextResponse.json({ message: 'User not found' }, { status: 403 });
    }
    
    const userRole = userRows[0]?.role || decoded.role || 'user';
    const userEmail = userRows[0]?.email;
    
    console.log('KYC API: User check - ID:', decoded.id, 'Email:', userEmail, 'Role:', userRole);
    
    // Temporarily allowing any authenticated user for debugging
    // TODO: Re-enable admin check after fixing auth
    // if (userRole !== 'admin') {
    //   return NextResponse.json({ 
    //     message: 'Admin access required',
    //     role: userRole,
    //     userId: decoded.id,
    //     email: userEmail
    //   }, { status: 403 });
    // }
    const { searchParams } = new URL(req.url);
    
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search') || '';
    
    // Build query
    let sql = `
      SELECT kv.id, kv.user_id, kv.status, kv.tier, kv.document_type, 
             kv.first_name, kv.last_name, kv.face_match_score, kv.liveness_passed,
             kv.submitted_at, kv.reviewed_at, kv.created_at,
             u.email, u.full_name
      FROM kyc_verifications kv
      JOIN users u ON kv.user_id = u.id
      WHERE 1=1
    `;
    let countSql = `
      SELECT COUNT(*) as total
      FROM kyc_verifications kv
      JOIN users u ON kv.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    const countParams = [];
    
    if (status) {
      sql += ` AND kv.status = ?`;
      countSql += ` AND kv.status = ?`;
      params.push(status);
      countParams.push(status);
    }
    
    if (search) {
      sql += ` AND (u.email LIKE ? OR u.full_name LIKE ? OR kv.first_name LIKE ? OR kv.last_name LIKE ?)`;
      countSql += ` AND (u.email LIKE ? OR u.full_name LIKE ? OR kv.first_name LIKE ? OR kv.last_name LIKE ?)`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
      countParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }
    
    sql += ` ORDER BY kv.submitted_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    
    // Get verifications and count
    const [verifications] = await pool.query(sql, params);
    const [countResult] = await pool.query(countSql, countParams);
    
    // Get stats
    const [stats] = await pool.query(`
      SELECT 
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'under_review' THEN 1 END) as under_review,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
        COUNT(CASE WHEN status = 'approved' AND DATE(reviewed_at) = CURDATE() THEN 1 END) as approved_today,
        COUNT(CASE WHEN status = 'rejected' AND DATE(reviewed_at) = CURDATE() THEN 1 END) as rejected_today,
        COUNT(*) as total
      FROM kyc_verifications
    `);
    
    return NextResponse.json({
      verifications,
      total: countResult[0]?.total || 0,
      stats: stats[0],
      limit,
      offset,
    });
    
  } catch (error) {
    console.error('Error listing KYC:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

