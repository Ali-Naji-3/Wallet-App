import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send password reset email
 * @param {string} email - User's email
 * @param {string} token - Reset token
 * @param {string} userName - User's name
 */
export async function sendPasswordResetEmail(email, token, userName = 'User') {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;
  
  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'FXWallet <onboarding@resend.dev>',
      to: email,
      subject: 'Reset Your Password - FXWallet',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Your Password</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #0a0a0a;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1a1a1a; border-radius: 12px; overflow: hidden; border: 1px solid #333;">
                    <tr>
                      <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px; text-align: center;">
                        <h1 style="margin: 0; color: #0a0a0a; font-size: 28px; font-weight: bold;">🔐 Password Reset</h1>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 40px;">
                        <p style="color: #e5e5e5; font-size: 16px; line-height: 24px; margin: 0 0 20px;">
                          Hi <strong>${userName}</strong>,
                        </p>
                        <p style="color: #a3a3a3; font-size: 14px; line-height: 22px; margin: 0 0 30px;">
                          We received a request to reset your password for your FXWallet account. Click the button below to create a new password:
                        </p>
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td align="center" style="padding: 20px 0;">
                              <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #0a0a0a; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: bold; font-size: 16px;">
                                Reset Password
                              </a>
                            </td>
                          </tr>
                        </table>
                        <p style="color: #737373; font-size: 13px; line-height: 20px; margin: 30px 0 0; padding-top: 30px; border-top: 1px solid #333;">
                          Or copy and paste this link into your browser:<br>
                          <a href="${resetUrl}" style="color: #f59e0b; word-break: break-all;">${resetUrl}</a>
                        </p>
                        <p style="color: #737373; font-size: 13px; line-height: 20px; margin: 20px 0 0;">
                          This link will expire in <strong>1 hour</strong>.
                        </p>
                        <p style="color: #737373; font-size: 13px; line-height: 20px; margin: 20px 0 0;">
                          If you didn't request this password reset, please ignore this email or contact support if you have concerns.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="background-color: #0a0a0a; padding: 30px; text-align: center; border-top: 1px solid #333;">
                        <p style="color: #737373; font-size: 12px; margin: 0;">
                          © ${new Date().getFullYear()} FXWallet. All rights reserved.
                        </p>
                        <p style="color: #525252; font-size: 11px; margin: 10px 0 0;">
                          This is an automated email, please do not reply.
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
    });
    
    console.log(`✅ Password reset email sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to send password reset email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send login alert email
 */
export async function sendLoginAlertEmail(email, userName, ipAddress, userAgent) {
  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'FXWallet Security <onboarding@resend.dev>',
      to: email,
      subject: '🔔 New Login to Your FXWallet Account',
      html: `
        <!DOCTYPE html>
        <html>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #0a0a0a;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1a1a1a; border-radius: 12px; border: 1px solid #333;">
                    <tr>
                      <td style="padding: 40px;">
                        <h2 style="color: #f59e0b; margin: 0 0 20px;">🔔 New Login Detected</h2>
                        <p style="color: #e5e5e5; font-size: 16px; line-height: 24px; margin: 0 0 20px;">
                          Hi <strong>${userName}</strong>,
                        </p>
                        <p style="color: #a3a3a3; font-size: 14px; line-height: 22px; margin: 0 0 30px;">
                          We detected a new login to your FXWallet account:
                        </p>
                        <table style="width: 100%; background-color: #0a0a0a; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                          <tr>
                            <td style="color: #737373; font-size: 13px; padding: 5px 0;">
                              <strong style="color: #e5e5e5;">Time:</strong> ${new Date().toLocaleString()}
                            </td>
                          </tr>
                          <tr>
                            <td style="color: #737373; font-size: 13px; padding: 5px 0;">
                              <strong style="color: #e5e5e5;">IP Address:</strong> ${ipAddress || 'Unknown'}
                            </td>
                          </tr>
                          <tr>
                            <td style="color: #737373; font-size: 13px; padding: 5px 0;">
                              <strong style="color: #e5e5e5;">Device:</strong> ${userAgent ? userAgent.substring(0, 100) : 'Unknown'}
                            </td>
                          </tr>
                        </table>
                        <p style="color: #a3a3a3; font-size: 14px; line-height: 22px; margin: 0 0 20px;">
                          If this was you, you can safely ignore this email.
                        </p>
                        <p style="color: #ef4444; font-size: 14px; line-height: 22px; margin: 0;">
                          <strong>If this wasn't you</strong>, please reset your password immediately and contact our support team.
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
    });
    
    console.log(`✅ Login alert sent to ${email}`);
  } catch (error) {
    console.error('❌ Failed to send login alert:', error);
  }
}