# 🔧 Fix: "Module not found: Can't resolve 'nodemailer'"

## 📋 Problem
When submitting a support request via `/api/support/submit`, you get:
```
Module not found: Can't resolve 'nodemailer'
```

## 🎯 Root Cause
The `nodemailer` package is not installed in your Next.js project, or there's a version mismatch.

---

## ✅ Step-by-Step Solution

### Step 1: Install nodemailer Package

```bash
cd /home/naji/Documents/Wallet-App/backend/next
npm install nodemailer
```

**Expected Output:**
```
+ nodemailer 6.x.x
added 1 package in Xs
```

**Verify Installation:**
```bash
npm list nodemailer
```

Should show: `nodemailer@6.x.x`

---

### Step 2: Verify package.json

Check that `nodemailer` is listed in `dependencies`:

```bash
cat package.json | grep -A 5 "dependencies"
```

You should see `nodemailer` in the dependencies list.

---

### Step 3: Configure SMTP Environment Variables

Create or update `.env.local` file in `backend/next/`:

```bash
cd /home/naji/Documents/Wallet-App/backend/next
nano .env.local
```

**Add these SMTP configuration variables:**

```env
# SMTP Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Optional: Support Email
SUPPORT_EMAIL=support@fxwallet.com
NEXT_PUBLIC_APP_URL=http://localhost:4000
```

**For Gmail:**
1. Enable 2-Step Verification on your Google account
2. Generate an App Password:
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Enter "FXWallet Support"
   - Copy the 16-character password
   - Use this as `SMTP_PASS`

**For Other SMTP Providers:**

**SendGrid:**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

**Mailgun:**
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-mailgun-username
SMTP_PASS=your-mailgun-password
```

**Outlook/Hotmail:**
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

---

### Step 4: Restart Next.js Development Server

**Stop the current server** (Ctrl+C) and restart:

```bash
cd /home/naji/Documents/Wallet-App/backend/next
npm run dev
```

**Why:** Next.js needs to reload environment variables and module dependencies.

---

### Step 5: Verify nodemailer is Working

**Test the email module directly:**

Create a test file `test-email.js`:

```javascript
import nodemailer from 'nodemailer';

console.log('Nodemailer version:', nodemailer.version || 'installed');
console.log('Nodemailer available:', typeof nodemailer !== 'undefined');

// Test transporter creation
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

console.log('Transporter created successfully');
```

Run it:
```bash
cd /home/naji/Documents/Wallet-App/backend/next
node test-email.js
```

**Expected Output:**
```
Nodemailer version: 6.x.x
Nodemailer available: true
Transporter created successfully
```

---

### Step 6: Test Support Request API

**Test the API endpoint:**

```bash
curl -X POST http://localhost:4000/api/support/submit \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "subject": "Test Support Request",
    "message": "This is a test message to verify the support system is working correctly."
  }'
```

**Expected Response:**
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

**If email is not configured:**
```json
{
  "success": true,
  "message": "Support request submitted successfully",
  "ticket_id": 1,
  "email_sent": false,
  "email_error": "Email service not configured",
  "request": {
    ...
  }
}
```

---

### Step 7: Verify Email.js Module

Check that `lib/email.js` is correctly importing nodemailer:

```bash
cd /home/naji/Documents/Wallet-App/backend/next
head -5 lib/email.js
```

Should show:
```javascript
import nodemailer from 'nodemailer';
```

---

## 🔍 Troubleshooting

### Issue 1: Still Getting "Module not found" After Installation

**Solution:**
```bash
# Clear node_modules and reinstall
cd /home/naji/Documents/Wallet-App/backend/next
rm -rf node_modules package-lock.json
npm install
npm install nodemailer
```

---

### Issue 2: "Cannot find module 'nodemailer'" in Production Build

**Solution:**
Ensure `nodemailer` is in `dependencies`, not `devDependencies`:

```bash
# Check package.json
cat package.json | grep nodemailer

# If in devDependencies, move it:
npm uninstall nodemailer
npm install nodemailer --save
```

---

### Issue 3: Environment Variables Not Loading

**Solution:**
1. Ensure `.env.local` is in `backend/next/` directory
2. Restart Next.js server after adding variables
3. Check variable names match exactly (case-sensitive)
4. Verify no typos in variable names

**Test environment variables:**
```bash
cd /home/naji/Documents/Wallet-App/backend/next
node -e "require('dotenv').config({ path: '.env.local' }); console.log('SMTP_USER:', process.env.SMTP_USER ? 'Set' : 'Not set');"
```

---

### Issue 4: Email Sending Fails

**Check SMTP Configuration:**
```bash
# Test SMTP connection
node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});
transporter.verify((error, success) => {
  if (error) {
    console.error('SMTP Error:', error);
  } else {
    console.log('SMTP Server is ready to send emails');
  }
});
"
```

**Common SMTP Errors:**
- **535 Authentication failed:** Wrong username/password
- **ECONNREFUSED:** Wrong SMTP host or port
- **ETIMEDOUT:** Firewall blocking SMTP port

---

### Issue 5: Next.js Build Errors

**Solution:**
```bash
# Clear Next.js cache
cd /home/naji/Documents/Wallet-App/backend/next
rm -rf .next

# Rebuild
npm run build
```

---

## ✅ Verification Checklist

After completing all steps, verify:

- [ ] `nodemailer` is installed (`npm list nodemailer`)
- [ ] `nodemailer` is in `package.json` dependencies
- [ ] `.env.local` exists with SMTP credentials
- [ ] Next.js server restarted
- [ ] Support API endpoint responds without errors
- [ ] Email sending works (or gracefully skips if not configured)

---

## 🚀 Quick Fix Commands (All-in-One)

Run these commands in order:

```bash
# 1. Install nodemailer
cd /home/naji/Documents/Wallet-App/backend/next
npm install nodemailer

# 2. Verify installation
npm list nodemailer

# 3. Create .env.local if it doesn't exist
cat > .env.local << 'EOF'
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SUPPORT_EMAIL=support@fxwallet.com
NEXT_PUBLIC_APP_URL=http://localhost:4000
EOF

# 4. Edit .env.local with your actual credentials
nano .env.local

# 5. Restart Next.js server
npm run dev
```

---

## 📝 Summary

**Problem:** `nodemailer` module not found  
**Solution:** Install nodemailer and configure SMTP credentials  
**Time Required:** 5-10 minutes  

**Steps:**
1. ✅ Install `npm install nodemailer`
2. ✅ Configure `.env.local` with SMTP credentials
3. ✅ Restart Next.js server
4. ✅ Test support API endpoint

---

**After completing these steps, your support system will work correctly!**

