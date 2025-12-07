import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function GET(req) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ 
        error: 'No token provided',
        hasAuthHeader: !!authHeader,
        authHeader: authHeader?.substring(0, 50) + '...',
      });
    }
    
    // Decode without verification to see what's in the token
    const decoded = jwt.decode(token);
    
    // Also try to verify
    let verified = null;
    try {
      const secret = process.env.JWT_SECRET;
      verified = jwt.verify(token, secret);
    } catch (e) {
      verified = { error: e.message };
    }
    
    return NextResponse.json({
      decoded,
      verified,
      tokenLength: token.length,
      tokenPreview: token.substring(0, 50) + '...',
    });
    
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

