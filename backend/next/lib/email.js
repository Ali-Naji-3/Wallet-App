import nodemailer from 'nodemailer';

/**
 * Create a nodemailer transporter
 * Uses environment variables for SMTP configuration
 */
function createTransporter() {
  // For development, you can use Gmail, SendGrid, or any SMTP service
  // Make sure to set these environment variables in your .env file
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
}

/**
 * Send verification identity email to a user
 * @param {string} to - Recipient email address
 * @param {string} userName - User's name
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - Email send result
 */
export async function sendVerificationEmail(to, userName = 'User', options = {}) {
  try {
    // Validate email
    if (!to || !to.includes('@')) {
      throw new Error('Invalid email address');
    }

    // Check if SMTP is configured
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('[Email] SMTP not configured. Email sending disabled.');
      console.warn('[Email] Set SMTP_USER and SMTP_PASS environment variables to enable email sending.');
      return {
        success: false,
        message: 'Email service not configured',
        skipped: true,
      };
    }

    const transporter = createTransporter();

    // Email content
    const verificationLink = options.verificationLink || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4000'}/wallet/kyc`;
    const supportEmail = process.env.SUPPORT_EMAIL || 'support@fxwallet.com';

    const mailOptions = {
      from: `"FXWallet Support" <${process.env.SMTP_USER}>`,
      to: to,
      subject: 'Verify Your Identity - FXWallet',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Identity</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 40px 20px; text-align: center;">
                <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 8px 8px 0 0;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Verify Your Identity</h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                        Hello ${userName || 'User'},
                      </p>
                      
                      <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                        Thank you for joining FXWallet! To unlock all features and ensure the security of your account, please verify your identity.
                      </p>
                      
                      <p style="margin: 0 0 30px; color: #374151; font-size: 16px; line-height: 1.6;">
                        Identity verification helps us:
                      </p>
                      
                      <ul style="margin: 0 0 30px; padding-left: 20px; color: #374151; font-size: 16px; line-height: 1.8;">
                        <li>Protect your account from unauthorized access</li>
                        <li>Comply with financial regulations</li>
                        <li>Enable higher transaction limits</li>
                        <li>Unlock premium features</li>
                      </ul>
                      
                      <!-- CTA Button -->
                      <table role="presentation" style="width: 100%; margin: 30px 0;">
                        <tr>
                          <td style="text-align: center;">
                            <a href="${verificationLink}" 
                               style="display: inline-block; padding: 14px 32px; background-color: #f59e0b; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                              Verify Your Identity Now
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="margin: 30px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                        Or copy and paste this link into your browser:<br>
                        <a href="${verificationLink}" style="color: #f59e0b; word-break: break-all;">${verificationLink}</a>
                      </p>
                      
                      <div style="margin: 40px 0 0; padding: 20px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
                        <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                          <strong>What you'll need:</strong><br>
                          • A valid government-issued ID (passport, ID card, or driver's license)<br>
                          • A clear selfie photo<br>
                          • About 2-3 minutes of your time
                        </p>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
                      <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px; line-height: 1.6;">
                        If you have any questions or need assistance, please contact our support team at 
                        <a href="mailto:${supportEmail}" style="color: #f59e0b; text-decoration: none;">${supportEmail}</a>
                      </p>
                      <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.6;">
                        This is an automated message. Please do not reply to this email.
                      </p>
                      <p style="margin: 10px 0 0; color: #9ca3af; font-size: 12px; line-height: 1.6;">
                        © ${new Date().getFullYear()} FXWallet. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      text: `
        Verify Your Identity - FXWallet
        
        Hello ${userName || 'User'},
        
        Thank you for joining FXWallet! To unlock all features and ensure the security of your account, please verify your identity.
        
        Identity verification helps us:
        - Protect your account from unauthorized access
        - Comply with financial regulations
        - Enable higher transaction limits
        - Unlock premium features
        
        Verify your identity now: ${verificationLink}
        
        What you'll need:
        - A valid government-issued ID (passport, ID card, or driver's license)
        - A clear selfie photo
        - About 2-3 minutes of your time
        
        If you have any questions, contact us at ${supportEmail}
        
        © ${new Date().getFullYear()} FXWallet. All rights reserved.
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log(`[Email] Verification email sent successfully to ${to}`);
    console.log(`[Email] Message ID: ${info.messageId}`);

    return {
      success: true,
      messageId: info.messageId,
      message: 'Verification email sent successfully',
    };
  } catch (error) {
    console.error('[Email] Error sending verification email:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to send verification email',
    };
  }
}

/**
 * Send support request notification email to admin
 * @param {Object} supportData - Support request data
 * @param {string} supportData.userEmail - User's email address
 * @param {string} supportData.userName - User's name (optional)
 * @param {string} supportData.subject - Support request subject
 * @param {string} supportData.message - Support request message
 * @param {number} supportData.ticketId - Support ticket ID
 * @param {number|null} supportData.userId - User ID (optional)
 * @returns {Promise<Object>} - Email send result
 */
export async function sendSupportRequestNotification(supportData) {
  try {
    const { userEmail, userName, subject, message, ticketId, userId } = supportData;

    // Validate required fields
    if (!userEmail || !message) {
      throw new Error('User email and message are required');
    }

    // Check if SMTP is configured
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('[Email] SMTP not configured. Support request notification email disabled.');
      return {
        success: false,
        message: 'Email service not configured',
        skipped: true,
      };
    }

    const transporter = createTransporter();
    const adminEmail = 'alialnaji2025@gmail.com'; // Admin email address
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4000';
    const supportEmail = process.env.SUPPORT_EMAIL || 'support@fxwallet.com';

    // Format the email content
    const mailOptions = {
      from: `"FXWallet Support System" <${process.env.SMTP_USER}>`,
      to: adminEmail,
      replyTo: userEmail, // Allow admin to reply directly to user
      subject: `[Support Request #${ticketId}] ${subject || 'Support Request'}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Support Request</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 30px 40px; text-align: center; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 8px 8px 0 0;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">New Support Request</h1>
                      <p style="margin: 10px 0 0; color: #ffffff; font-size: 14px; opacity: 0.9;">Ticket #${ticketId}</p>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <!-- User Information -->
                      <div style="margin-bottom: 30px; padding: 20px; background-color: #f9fafb; border-radius: 6px; border-left: 4px solid #f59e0b;">
                        <h2 style="margin: 0 0 15px; color: #374151; font-size: 18px; font-weight: 600;">User Information</h2>
                        <table role="presentation" style="width: 100%; border-collapse: collapse;">
                          <tr>
                            <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 120px;">Email:</td>
                            <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500;">
                              <a href="mailto:${userEmail}" style="color: #f59e0b; text-decoration: none;">${userEmail}</a>
                            </td>
                          </tr>
                          ${userName ? `
                          <tr>
                            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Name:</td>
                            <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500;">${userName}</td>
                          </tr>
                          ` : ''}
                          ${userId ? `
                          <tr>
                            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">User ID:</td>
                            <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500;">${userId}</td>
                          </tr>
                          ` : ''}
                          <tr>
                            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Ticket ID:</td>
                            <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500;">#${ticketId}</td>
                          </tr>
                        </table>
                      </div>

                      <!-- Subject -->
                      ${subject ? `
                      <div style="margin-bottom: 20px;">
                        <h3 style="margin: 0 0 10px; color: #374151; font-size: 16px; font-weight: 600;">Subject</h3>
                        <p style="margin: 0; color: #111827; font-size: 15px; line-height: 1.6;">${subject}</p>
                      </div>
                      ` : ''}

                      <!-- Message -->
                      <div style="margin-bottom: 30px;">
                        <h3 style="margin: 0 0 10px; color: #374151; font-size: 16px; font-weight: 600;">Message</h3>
                        <div style="padding: 20px; background-color: #f9fafb; border-radius: 6px; border: 1px solid #e5e7eb;">
                          <p style="margin: 0; color: #111827; font-size: 15px; line-height: 1.8; white-space: pre-wrap;">${message.replace(/\n/g, '<br>')}</p>
                        </div>
                      </div>

                      <!-- Action Button -->
                      <table role="presentation" style="width: 100%; margin: 30px 0;">
                        <tr>
                          <td style="text-align: center;">
                            <a href="${appUrl}/admin/support" 
                               style="display: inline-block; padding: 12px 24px; background-color: #f59e0b; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
                              View in Admin Panel
                            </a>
                          </td>
                        </tr>
                      </table>

                      <!-- Footer Info -->
                      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                        <p style="margin: 0 0 10px; color: #6b7280; font-size: 12px; line-height: 1.6;">
                          <strong>Note:</strong> You can reply directly to this email to respond to the user at <a href="mailto:${userEmail}" style="color: #f59e0b;">${userEmail}</a>
                        </p>
                        <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                          This is an automated notification from FXWallet Support System.
                        </p>
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      text: `
New Support Request - Ticket #${ticketId}

User Information:
Email: ${userEmail}
${userName ? `Name: ${userName}\n` : ''}${userId ? `User ID: ${userId}\n` : ''}Ticket ID: #${ticketId}

${subject ? `Subject: ${subject}\n` : ''}
Message:
${message}

---
View in Admin Panel: ${appUrl}/admin/support

You can reply directly to this email to respond to the user at ${userEmail}

This is an automated notification from FXWallet Support System.
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log(`[Email] Support request notification sent successfully to ${adminEmail}`);
    console.log(`[Email] Message ID: ${info.messageId}`);
    console.log(`[Email] Ticket ID: #${ticketId}`);

    return {
      success: true,
      messageId: info.messageId,
      message: 'Support request notification email sent successfully',
    };
  } catch (error) {
    console.error('[Email] Error sending support request notification:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to send support request notification email',
    };
  }
}

/**
 * Test email configuration
 * @returns {Promise<Object>} - Test result
 */
export async function testEmailConfig() {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return {
        success: false,
        message: 'SMTP not configured',
      };
    }

    const transporter = createTransporter();
    await transporter.verify();
    
    return {
      success: true,
      message: 'Email configuration is valid',
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
}


