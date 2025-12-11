import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { checkLoginAttempts, recordLoginAttempt, clearLoginAttempts } from '@/lib/rateLimit';
import { sendLoginAlertEmail } from '@/lib/email';
import { sendLoginAlertSMS } from '@/lib/sms';

/**
 * POST /api/auth/login
 * Creates a JWT token for authenticated user
 */
export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, password } = body || {};

    // Get IP address
    const ipAddress = req.headers.get('x-forwarded-for') || 
                      req.headers.get('x-real-ip') || 
                      'unknown';
    const userAgent = req.headers.get('user-agent') || 'Unknown';

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Check rate limiting
    const attemptCheck = await checkLoginAttempts(email, ipAddress);
    if (!attemptCheck.allowed) {
      return NextResponse.json(
        { 
          message: attemptCheck.message,
          error: 'TOO_MANY_ATTEMPTS',
          attemptsLeft: 0,
        },
        { status: 429 }
      );
    }

    const pool = getPool();
    
    // Find user by email
    let userQuery = `SELECT id, email, password_hash, full_name, phone_number, base_currency, timezone, role, is_active`;
    
    // Check if suspension_reason column exists
    try {
      const [cols] = await pool.query(`SHOW COLUMNS FROM users LIKE 'suspension_reason'`);
      if (cols.length > 0) {
        userQuery += `, suspension_reason`;
      }
    } catch (colErr) {
      // Column doesn't exist, continue without it
    }
    
    userQuery += ` FROM users WHERE email = ? LIMIT 1`;
    
    const [rows] = await pool.query(userQuery, [email]);
    
    const user = rows[0];
    if (!user) {
      console.log(`[Login] User not found: ${email} from IP: ${ipAddress}`);
      await recordLoginAttempt(email, ipAddress, false);
      
      return NextResponse.json(
        { 
          message: 'Invalid email or password',
          attemptsLeft: attemptCheck.attemptsLeft - 1,
        },
        { status: 401 }
      );
    }
    
    console.log(`[Login] User found: ${user.email} (ID: ${user.id})`);
    
    // Verify email
    if (user.email.toLowerCase() !== email.toLowerCase()) {
      console.error(`[SECURITY] Email mismatch! Query: ${email}, Found: ${user.email}`);
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if account is suspended
    if (!user.is_active) {
      const suspensionReason = user.suspension_reason || null;
      
      console.log(`[Login] Blocked suspended account: ${user.email}`);
      await recordLoginAttempt(email, ipAddress, false);
      
      return NextResponse.json(
        { 
          message: 'Account Suspended',
          error: 'ACCESS_DENIED',
          details: suspensionReason 
            ? `Your account has been suspended. Reason: ${suspensionReason}`
            : 'Your account has been suspended. Please contact support for assistance.',
          contactSupport: true,
          code: 'ACCOUNT_SUSPENDED'
        },
        { status: 403 }
      );
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      console.log(`[Login] Invalid password for: ${email}`);
      await recordLoginAttempt(email, ipAddress, false);
      
      return NextResponse.json(
        { 
          message: 'Invalid email or password',
          attemptsLeft: attemptCheck.attemptsLeft - 1,
        },
        { status: 401 }
      );
    }

    // Create JWT Token
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
      { expiresIn: '1d' }
    );

    // Record successful login
    await recordLoginAttempt(email, ipAddress, true);
    await clearLoginAttempts(email);

    // Send security alerts (async, non-blocking)
    Promise.all([
      sendLoginAlertEmail(user.email, user.full_name, ipAddress, userAgent).catch(err => 
        console.error('Failed to send login alert email:', err)
      ),
      user.phone_number ? sendLoginAlertSMS(user.phone_number, ipAddress).catch(err =>
        console.error('Failed to send login alert SMS:', err)
      ) : Promise.resolve()
    ]);

    // Return success response
    const responseData = {
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        phoneNumber: user.phone_number,
        baseCurrency: user.base_currency,
        timezone: user.timezone,
        role: user.role || 'user',
        isActive: !!user.is_active,
      },
    };
    
    console.log(`✅ [Login] Success: ${user.email} from IP: ${ipAddress}`);
    
    return NextResponse.json(responseData);
    
  } catch (err) {
    console.error('❌ [Login] Error:', err);
    return NextResponse.json(
      { message: err?.message || 'Failed to login' },
      { status: 500 }
    );
  }
}