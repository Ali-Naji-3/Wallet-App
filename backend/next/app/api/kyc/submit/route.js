import { NextResponse } from 'next/server';
import { getPool, ensureNotificationTable } from '@/lib/db';
import { parseBearer, verifyToken } from '@/lib/auth';
import { sendKYCSubmissionConfirmation } from '@/lib/email';

export async function POST(req) {
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
    
    // SECURITY: Check if account is frozen before allowing KYC submission
    const [userCheck] = await pool.query(
      `SELECT id, email, is_active FROM users WHERE id = ? LIMIT 1`,
      [userId]
    );
    
    if (!userCheck || userCheck.length === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    
    if (!userCheck[0].is_active) {
      console.log(`[KYC Submit] Blocked frozen account: ${userCheck[0].email}`);
      return NextResponse.json({ 
        message: 'Account Suspended',
        error: 'ACCESS_DENIED',
        details: 'Your account has been suspended. Please contact support to reactivate your account before submitting KYC verification.',
        code: 'ACCOUNT_SUSPENDED'
      }, { status: 403 });
    }
    
    // Check for existing pending/under_review KYC
    const [existingKYC] = await pool.query(
      `SELECT id, status, submitted_at FROM kyc_verifications 
       WHERE user_id = ? AND status IN ('pending', 'under_review')
       ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );
    
    if (existingKYC.length > 0) {
      return NextResponse.json({
        message: 'You already have a pending KYC verification. Please wait for it to be reviewed.',
        existingKYC: existingKYC[0],
      }, { status: 400 });
    }
    
    const body = await req.json();
    const {
      documentType,
      documentNumber,
      documentCountry,
      documentExpiry,
      idFrontImage,
      idBackImage,
      selfieImage,
      addressProofImage,
      firstName,
      lastName,
      dateOfBirth,
      nationality,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      tier = 1,
      faceMatchScore = null,
      livenessPassed = false,
    } = body;
    
    // Validate required fields
    const validDocTypes = ['id_card', 'passport', 'driver_license', 'residence_permit'];
    if (!documentType || !validDocTypes.includes(documentType)) {
      return NextResponse.json({ message: 'Invalid document type' }, { status: 400 });
    }
    
    if (!idFrontImage || !selfieImage) {
      return NextResponse.json({ message: 'ID front image and selfie are required' }, { status: 400 });
    }
    
    if (!firstName || !lastName) {
      return NextResponse.json({ message: 'First name and last name are required' }, { status: 400 });
    }
    
    // Create the KYC verification
    const [result] = await pool.query(
      `INSERT INTO kyc_verifications 
       (user_id, document_type, document_number, document_country, document_expiry,
        id_front_image, id_back_image, selfie_image, address_proof_image,
        first_name, last_name, date_of_birth, nationality,
        address_line1, address_line2, city, state, postal_code, country, tier,
        face_match_score, liveness_passed)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId, documentType, documentNumber || null, documentCountry || null, documentExpiry || null,
        idFrontImage, idBackImage || null, selfieImage, addressProofImage || null,
        firstName, lastName, dateOfBirth || null, nationality || null,
        addressLine1 || null, addressLine2 || null, city || null, state || null, postalCode || null, country || null,
        tier, faceMatchScore, livenessPassed ? 1 : 0,
      ]
    );
    
    const [kyc] = await pool.query(
      `SELECT id, status, tier, document_type, submitted_at FROM kyc_verifications WHERE id = ?`,
      [result.insertId]
    );
    
    // Get user info for notification and email
    const [userInfo] = await pool.query(
      `SELECT email, full_name FROM users WHERE id = ?`,
      [userId]
    );
    const userName = userInfo[0]?.full_name || userInfo[0]?.email || 'A user';
    const userEmail = userInfo[0]?.email;
    const kycId = result.insertId;
    
    // ===== STEP 1: Send KYC Submission Confirmation Email (Non-blocking, Fast) =====
    // Send email asynchronously - don't wait for it to complete
    // This ensures the API responds quickly while email is sent in the background
    sendKYCSubmissionConfirmation({
      userEmail: userEmail,
      userName: userName,
      kycId: kycId,
    }).then((emailResult) => {
      if (emailResult.success) {
        console.log(`[KYC Submit] ✅ Confirmation email sent to ${userEmail}. Message ID: ${emailResult.messageId}`);
      } else if (emailResult.skipped) {
        console.log(`[KYC Submit] ⚠️ Email skipped: ${emailResult.message}`);
      } else {
        console.error(`[KYC Submit] ❌ Email failed: ${emailResult.message}`);
      }
    }).catch((emailError) => {
      // Log error but don't fail the request
      console.error('[KYC Submit] ❌ Email error (non-blocking):', emailError.message);
    });
    
    // Ensure notifications table exists
    try {
      await ensureNotificationTable();
    } catch (tableError) {
      console.error('[KYC Submit] Error ensuring notifications table:', tableError);
    }
    
    // Create notifications for all admins
    try {
      const [admins] = await pool.query(
        `SELECT id FROM users WHERE role = 'admin'`
      );
      
      console.log(`[KYC Submit] Found ${admins.length} admin(s) to notify`);
      
      if (admins.length === 0) {
        console.warn('[KYC Submit] No admins found! Notifications will not be created.');
      }
      
      for (const admin of admins) {
        try {
          const documentTypeFormatted = documentType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          const notificationBody = `${userName} (${userInfo[0]?.email}) has submitted a new KYC verification (${documentTypeFormatted}). KYC ID: ${kycId}. Please review it.`;
          
          const [notifResult] = await pool.query(
            `INSERT INTO notifications (user_id, type, title, body, created_at)
             VALUES (?, 'kyc_submitted', 'New KYC Verification Submitted', ?, NOW())`,
            [admin.id, notificationBody]
          );
          
          console.log(`[KYC Submit] ✅ Notification created for admin ID: ${admin.id}, Notification ID: ${notifResult.insertId}`);
        } catch (notifError) {
          // Log but don't fail the entire request if notification fails
          console.error(`[KYC Submit] ❌ Failed to create notification for admin ${admin.id}:`, notifError);
        }
      }
      
      console.log(`[KYC Submit] ✅ All notifications created successfully for ${admins.length} admin(s)`);
    } catch (notifError) {
      // Log but don't fail the entire request if notification creation fails
      console.error('[KYC Submit] Error creating notifications:', notifError);
    }
    
    return NextResponse.json({
      message: 'KYC verification submitted successfully',
      kyc: kyc[0],
      email_sent: true, // Email is sent asynchronously, assume success for fast response
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error submitting KYC:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}

