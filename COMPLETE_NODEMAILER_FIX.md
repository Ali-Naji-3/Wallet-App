# ✅ Complete Nodemailer Fix - Step-by-Step Solution

## 🎯 Problem
```
Module not found: Can't resolve 'nodemailer'
```

## ✅ Solution Status

### ✅ Step 1: Install nodemailer - COMPLETED
```bash
cd /home/naji/Documents/Wallet-App/backend/next
npm install nodemailer
```

**Result:** ✅ Nodemailer v7.0.11 installed successfully  
**Verified:** ✅ Module can be imported  
**Package.json:** ✅ Added to dependencies

---

### ⏳ Step 2: Configure SMTP in .env.local - REQUIRED

**Current Status:** SMTP configuration is missing from `.env.local`

**Action Required:** Add SMTP credentials to `.env.local`

**File Location:** `/home/naji/Documents/Wallet-App/backend/next/.env.local`

**Add these lines to your `.env.local` file:**

```env
# SMTP Email Configuration (Add these lines)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Optional: Support Email Settings
SUPPORT_EMAIL=support@fxwallet.com
NEXT_PUBLIC_APP_URL=http://localhost:4000
```

**How to Edit:**
```bash
cd /home/naji/Documents/Wallet-App/backend/next
nano .env.local
# Add the SMTP configuration lines above
# Save and exit (Ctrl+X, then Y, then Enter)
```

---

### 📧 Step 3: Get Gmail App Password (If Using Gmail)

**For Gmail Users - Follow These Steps:**

1. **Enable 2-Step Verification:**
   - Visit: https://myaccount.google.com/security
   - Click "2-Step Verification"
   - Follow the setup process if not already enabled

2. **Generate App Password:**
   - Visit: https://myaccount.google.com/apppasswords
   - Select "Mail" from the dropdown
   - Select "Other (Custom name)"
   - Enter: `FXWallet Support`
   - Click "Generate"
   - **Copy the 16-character password** (it looks like: `abcd efgh ijkl mnop`)
   - Remove spaces when using: `abcdefghijklmnop`

3. **Add to .env.local:**
   ```env
   SMTP_USER=your-actual-email@gmail.com
   SMTP_PASS=abcdefghijklmnop  # Your 16-character app password (no spaces)
   ```

---

### ⏳ Step 4: Restart Next.js Server - REQUIRED

**After adding SMTP configuration, restart the server:**

```bash
cd /home/naji/Documents/Wallet-App/backend/next

# Stop current server (Ctrl+C if running)
# Then restart:
npm run dev
```

**Why Restart?**
- Next.js loads environment variables on startup
- New modules need to be loaded
- Changes to `.env.local` require server restart

---

### ✅ Step 5: Verify Support API Works

**Test the support endpoint:**

```bash
curl -X POST http://localhost:4000/api/support/submit \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "subject": "Test Support Request",
    "message": "This is a test message to verify the support system is working."
  }'
```

**Expected Success Response:**
```json
{
  "success": true,
  "message": "Support request submitted successfully",
  "ticket_id": 1,
  "email_sent": true,
  "request": {
    "id": 1,
    "email": "test@example.com",
    "subject": "Test Support Request",
    "status": "pending",
    "created_at": "2025-12-11T..."
  }
}
```

**If Email Not Configured (Still Works!):**
```json
{
  "success": true,
  "message": "Support request submitted successfully",
  "ticket_id": 1,
  "email_sent": false,
  "email_error": "Email service not configured",
  "request": {
    "id": 1,
    "email": "test@example.com",
    "subject": "Test Support Request",
    "status": "pending",
    "created_at": "2025-12-11T..."
  }
}
```

**Note:** The support request will be saved to the database even if email is not configured. Email is optional.

---

## 🔍 Verification Checklist

After completing all steps:

- [x] ✅ Nodemailer installed (v7.0.11)
- [ ] ⏳ SMTP_HOST added to .env.local
- [ ] ⏳ SMTP_PORT added to .env.local
- [ ] ⏳ SMTP_USER added to .env.local
- [ ] ⏳ SMTP_PASS added to .env.local
- [ ] ⏳ Next.js server restarted
- [ ] ⏳ Support API tested successfully

---

## 🚀 Quick Reference Commands

**Complete Setup (Copy & Paste):**

```bash
# 1. Navigate to project
cd /home/naji/Documents/Wallet-App/backend/next

# 2. Edit .env.local (add SMTP config - see template above)
nano .env.local

# 3. Restart Next.js server
npm run dev

# 4. Test in another terminal
curl -X POST http://localhost:4000/api/support/submit \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","message":"test message"}'
```

---

## 📝 Alternative SMTP Providers

### SendGrid (Recommended for Production)
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=SG.your-sendgrid-api-key-here
```

**Get SendGrid API Key:**
1. Sign up at https://sendgrid.com
2. Go to Settings → API Keys
3. Create API Key with "Mail Send" permissions
4. Copy the key and use as `SMTP_PASS`

### Mailgun
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASS=your-mailgun-password
```

### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-outlook-password
```

---

## 🐛 Troubleshooting

### Issue: Still Getting "Module not found"

**Solution:**
```bash
cd /home/naji/Documents/Wallet-App/backend/next
rm -rf node_modules package-lock.json
npm install
npm install nodemailer
npm run dev
```

### Issue: Email Sending Fails

**Check SMTP Configuration:**
```bash
# Test SMTP connection
node -e "
const nodemailer = require('nodemailer');
require('dotenv').config({ path: '.env.local' });
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ SMTP Error:', error.message);
  } else {
    console.log('✅ SMTP Server is ready to send emails');
  }
});
"
```

**Common Errors:**
- **535 Authentication failed:** Wrong username/password or need App Password
- **ECONNREFUSED:** Wrong SMTP host or port
- **ETIMEDOUT:** Firewall blocking SMTP port

### Issue: Environment Variables Not Loading

**Solution:**
1. Ensure `.env.local` is in `backend/next/` directory
2. Restart Next.js server after adding variables
3. Check variable names match exactly (case-sensitive)
4. No spaces around `=` sign: `SMTP_USER=email@gmail.com` ✅ (not `SMTP_USER = email@gmail.com` ❌)

---

## ✅ Summary

**What's Fixed:**
- ✅ Nodemailer package installed (v7.0.11)
- ✅ Module can be imported successfully
- ✅ Package added to dependencies

**What's Remaining:**
- ⏳ Add SMTP credentials to `.env.local`
- ⏳ Restart Next.js server
- ⏳ Test support API endpoint

**Time Required:** 5-10 minutes

---

## 📋 Quick Reference

**Current .env.local Location:**
```
/home/naji/Documents/Wallet-App/backend/next/.env.local
```

**SMTP Configuration Template:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

**Support API Endpoint:**
```
POST http://localhost:4000/api/support/submit
```

---

**Status:** ✅ Nodemailer installed - Ready for SMTP configuration  
**Next Step:** Add SMTP credentials to `.env.local` and restart server

---

**Fix Date:** December 11, 2025  
**Nodemailer Version:** 7.0.11  
**Next.js Version:** 16.0.6

