import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

/**
 * POST /api/auth/login
 * Creates a JWT token for authenticated user
 */
export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, password } = body || {};

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    const pool = getPool();
    
    // 1. Find user by email (include suspension_reason and deleted_at if exists)
    let userQuery = `SELECT id, email, password_hash, full_name, base_currency, timezone, role, is_active`;
    
    // Check if suspension_reason column exists
    try {
      const [cols] = await pool.query(`SHOW COLUMNS FROM users LIKE 'suspension_reason'`);
      if (cols.length > 0) {
        userQuery += `, suspension_reason`;
      }
    } catch (colErr) {
      // Column doesn't exist, continue without it
    }
    
    // Check if deleted_at column exists (for soft delete)
    try {
      const [deletedCols] = await pool.query(`SHOW COLUMNS FROM users LIKE 'deleted_at'`);
      if (deletedCols.length > 0) {
        userQuery += `, deleted_at`;
      }
    } catch (colErr) {
      // Column doesn't exist, continue without it
    }
    
    userQuery += ` FROM users WHERE email = ? LIMIT 1`;
    
    const [rows] = await pool.query(userQuery, [email]);
    
    const user = rows[0];
    if (!user) {
      console.log(`[Login] User not found for email: ${email}`);
      return NextResponse.json(
        { 
          message: 'The email address you entered is not registered. Please check your email and try again.',
          code: 'INVALID_EMAIL',
          error: 'EMAIL_NOT_FOUND',
          details: 'This email address is not registered in our system. Please check your email or contact support if you believe this is an error.'
        },
        { status: 401 }
      );
    }
    
    console.log(`[Login] User found: ID=${user.id}, Email=${user.email}, Role=${user.role}, is_active=${user.is_active}`);
    
    // Check if account is deleted (soft delete)
    if (user.deleted_at) {
      console.log(`[Login] Account deleted for email: ${email}, deleted_at: ${user.deleted_at}`);
      return NextResponse.json(
        { 
          message: 'Account Deleted',
          error: 'ACCOUNT_DELETED',
          details: 'This account has been deleted. If you believe this is an error, please contact support for assistance.',
          contactSupport: true,
          code: 'ACCOUNT_DELETED'
        },
        { status: 403 }
      );
    }
    
    // SECURITY: Verify the email matches (prevent email injection)
    if (user.email.toLowerCase() !== email.toLowerCase()) {
      console.error(`[Login] SECURITY WARNING: Email mismatch! Query: ${email}, Found: ${user.email}`);
      return NextResponse.json(
        { 
          message: 'The email address you entered is not registered. Please check your email and try again.',
          code: 'INVALID_EMAIL',
          error: 'EMAIL_NOT_FOUND'
        },
        { status: 401 }
      );
    }

    // Check if user account is suspended/frozen BEFORE password check
    if (!user.is_active || user.is_active === 0) {
      console.log(`[Login] Account is frozen: Email=${email}, is_active=${user.is_active}`);
      
      // Check if account was rejected due to KYC
      let kycRejected = false;
      let kycRejectionReason = null;
      
      try {
        const [kycRows] = await pool.query(
          `SELECT status, rejection_reason 
           FROM kyc_verifications 
           WHERE user_id = ? AND status = 'rejected' 
           ORDER BY created_at DESC LIMIT 1`,
          [user.id]
        );
        
        if (kycRows.length > 0) {
          kycRejected = true;
          kycRejectionReason = kycRows[0].rejection_reason;
        }
      } catch (kycErr) {
        // KYC table might not exist, continue without it
        console.log('[Login] Could not check KYC status:', kycErr.message);
      }
      
      const suspensionReason = user.suspension_reason || null;
      
      // If account is frozen due to KYC rejection, return ACCOUNT_REJECTED
      if (kycRejected) {
        console.log(`[Login] Account rejected due to KYC: Email=${email}`);
        return NextResponse.json(
          { 
            message: 'Account Rejected',
            error: 'ACCOUNT_REJECTED',
            details: kycRejectionReason 
              ? `Your account has been rejected due to KYC verification failure. Reason: ${kycRejectionReason}`
              : 'Your account has been rejected due to KYC verification failure. Please contact support for assistance.',
            contactSupport: true,
            code: 'ACCOUNT_REJECTED',
            kycRejected: true
          },
          { status: 403 }
        );
      }
      
      // Otherwise, return ACCOUNT_FROZEN with clear message
      console.log(`[Login] Account frozen: Email=${email}, Reason: ${suspensionReason || 'No reason provided'}`);
      return NextResponse.json(
        { 
          message: 'Account Frozen',
          error: 'ACCOUNT_FROZEN',
          details: suspensionReason 
            ? `Your account has been frozen. Reason: ${suspensionReason}`
            : 'Your account has been frozen. Please contact support for assistance.',
          contactSupport: true,
          code: 'ACCOUNT_FROZEN'
        },
        { status: 403 }
      );
    }

    // 2. Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { 
          message: 'The password you entered is incorrect. Please check your password and try again.',
          code: 'INVALID_PASSWORD',
          error: 'PASSWORD_INCORRECT'
        },
        { status: 401 }
      );
    }

    // 3. Create JWT Token
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET not configured');
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role || 'user',
      },
      secret,
      { expiresIn: '1d' } // Token expires in 1 day
    );

    // 4. Return token and user info
    const responseData = {
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        baseCurrency: user.base_currency,
        timezone: user.timezone,
        role: user.role || 'user',
        isActive: !!user.is_active,
      },
    };
    
    console.log(`[Login] Returning user data: Email=${responseData.user.email}, Role=${responseData.user.role}`);
    
    return NextResponse.json(responseData);
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json(
      { message: err?.message || 'Failed to login' },
      { status: 500 }
    );
  }
}

