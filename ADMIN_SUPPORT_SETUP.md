# Admin Support & Email Verification Setup

## Overview

The admin support page at `/admin/support` allows administrators to:
- Search for users by email or phone number
- Manually send verification emails to clients
- View recent verification email history
- See statistics about sent emails

Additionally, when a new client submits a "Verify Your Identity" request, they automatically receive a verification email.

## Features

### 1. Admin Support Page (`/admin/support`)

**Location:** `http://localhost:4000/admin/support`

**Features:**
- Search users by email or phone number
- Send verification emails manually
- View email statistics (total sent, today sent, pending users)
- View recent email history with status tracking

### 2. Automatic Email Sending

When a client submits KYC verification:
- An automatic verification email is sent to their email address
- The email includes a link to complete identity verification
- Email sending is logged in the database for tracking

## SMTP Configuration

To enable email functionality, you need to configure SMTP settings in your environment variables.

### Environment Variables

Add these to your `.env` file in `backend/next/`:

```bash
# SMTP Configuration (Required for email sending)
SMTP_HOST=smtp.gmail.com          # Your SMTP server host
SMTP_PORT=587                     # SMTP port (587 for TLS, 465 for SSL)
SMTP_SECURE=false                 # true for SSL (port 465), false for TLS (port 587)
SMTP_USER=your-email@gmail.com    # Your SMTP username/email
SMTP_PASS=your-app-password       # Your SMTP password or app password

# Optional
SUPPORT_EMAIL=support@fxwallet.com  # Support email address (shown in emails)
NEXT_PUBLIC_APP_URL=http://localhost:4000  # Your app URL (for email links)
```

### Gmail Setup Example

1. **Enable 2-Step Verification** on your Google account
2. **Generate App Password:**
   - Go to Google Account → Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Use this password as `SMTP_PASS`

3. **Configure `.env`:**
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
```

### Other SMTP Providers

**SendGrid:**
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

**Outlook/Office 365:**
```bash
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

**Custom SMTP:**
```bash
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-username
SMTP_PASS=your-password
```

## Testing Email Configuration

The email service will automatically check if SMTP is configured. If not configured:
- Email sending will be skipped (not fail)
- A warning will be logged in the console
- The admin support page will still work, but emails won't be sent

## API Endpoints

### Search Users
```
GET /api/admin/support/search?query=user@example.com&type=email
Authorization: Bearer <admin-token>
```

### Send Verification Email
```
POST /api/admin/support/send-verification
Authorization: Bearer <admin-token>
Body: { userId: 1, email: "user@example.com" }
```

### Get Recent Emails
```
GET /api/admin/support/recent-emails
Authorization: Bearer <admin-token>
```

## Database Tables

The system automatically creates an `email_logs` table to track sent emails:

```sql
CREATE TABLE IF NOT EXISTS email_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  user_name VARCHAR(255),
  email_type VARCHAR(50) DEFAULT 'verification',
  status VARCHAR(20) DEFAULT 'sent',
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  error_message TEXT,
  INDEX idx_user_id (user_id),
  INDEX idx_sent_at (sent_at)
);
```

## Email Template

The verification email includes:
- Professional HTML design with branding
- Clear call-to-action button
- Instructions on what's needed for verification
- Support contact information
- Responsive design for mobile devices

## Troubleshooting

### Emails Not Sending

1. **Check SMTP Configuration:**
   - Verify all environment variables are set correctly
   - Check SMTP credentials are valid
   - Ensure SMTP server allows connections from your server

2. **Check Logs:**
   - Look for email-related errors in the console
   - Check `email_logs` table for failed emails

3. **Test SMTP Connection:**
   - Use the `testEmailConfig()` function in `lib/email.js`
   - Or try sending a test email from the admin support page

### Common Issues

**"Email service not configured"**
- Set `SMTP_USER` and `SMTP_PASS` in your `.env` file

**"Authentication failed"**
- Check your SMTP credentials
- For Gmail, use an App Password, not your regular password
- Ensure 2-Step Verification is enabled (for Gmail)

**"Connection timeout"**
- Check your firewall settings
- Verify SMTP host and port are correct
- Try different ports (587 for TLS, 465 for SSL)

## Security Notes

- Never commit `.env` files to version control
- Use App Passwords instead of regular passwords when possible
- Consider using environment-specific SMTP accounts
- Monitor email logs for suspicious activity


