import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(req) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'No token provided' });
    }
    
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid token', message: e.message });
    }
    
    const pool = getPool();
    const [userRows] = await pool.query(
      'SELECT id, email, role, full_name FROM users WHERE id = ?',
      [decoded.id]
    );
    
    if (!userRows || userRows.length === 0) {
      return NextResponse.json({
        error: 'User not found in database',
        tokenUserId: decoded.id,
        tokenEmail: decoded.email,
        tokenRole: decoded.role,
      });
    }
    
    const user = userRows[0];
    
    return NextResponse.json({
      success: true,
      token: {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
      },
      database: {
        id: user.id,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
      },
      isAdmin: user.role === 'admin',
    });
    
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

