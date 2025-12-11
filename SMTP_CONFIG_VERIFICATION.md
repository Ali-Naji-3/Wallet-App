# ✅ SMTP Configuration Verification

## 📋 Your Current Configuration (Lines 12-21)

```env
# SMTP Email Configuration
SMTP_HOST=smtp.gmail.com          ✅ Correct
SMTP_PORT=587                     ✅ Correct
SMTP_SECURE=false                 ✅ Correct
SMTP_USER=alialnaji2025@gmail.com ✅ Correct
SMTP_PASS=Falcon$123              ⚠️  See note below
# Optional
SUPPORT_EMAIL=alialnaji2025@gmail.com ✅ Correct
NEXT_PUBLIC_APP_URL=http://localhost:4000 ✅ Correct
```

---

## ✅ Configuration Status

**Overall:** ✅ **CORRECT** - All required variables are set!

### Verified:
- ✅ `SMTP_HOST` - Set to `smtp.gmail.com` (correct for Gmail)
- ✅ `SMTP_PORT` - Set to `587` (correct for Gmail)
- ✅ `SMTP_SECURE` - Set to `false` (correct for port 587)
- ✅ `SMTP_USER` - Set to your Gmail address
- ✅ `SMTP_PASS` - Set (password configured)
- ✅ `SUPPORT_EMAIL` - Set to your email
- ✅ `NEXT_PUBLIC_APP_URL` - Set correctly

---

## ⚠️ Important Note About SMTP_PASS

**Your current password:** `Falcon$123`

**If you're using Gmail with 2-Step Verification enabled:**
- Gmail requires an **App Password** (16 characters, no spaces)
- Regular passwords won't work for SMTP authentication
- App Passwords look like: `abcd efgh ijkl mnop` (use as `abcdefghijklmnop`)

**If you're NOT using 2-Step Verification:**
- Your regular password should work
- However, Gmail may block it for security reasons
- **Recommended:** Enable 2-Step Verification and use App Password

**To get Gmail App Password:**
1. Go to: https://myaccount.google.com/apppasswords
2. Select "Mail" → "Other (Custom name)" → Enter "FXWallet"
3. Copy the 16-character password
4. Update `SMTP_PASS` in `.env.local`

---

## 🚀 Next Steps

### Step 1: Restart Next.js Server

**IMPORTANT:** Restart your server to load the new environment variables:

```bash
cd /home/naji/Documents/Wallet-App/backend/next

# Stop current server (Ctrl+C if running)
# Then restart:
npm run dev
```

### Step 2: Test Support API

**Test the support request endpoint:**

```bash
curl -X POST http://localhost:4000/api/support/submit \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "subject": "Test Support Request",
    "message": "This is a test message to verify email sending works."
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

**If Email Authentication Fails:**
```json
{
  "success": true,
  "message": "Support request submitted successfully",
  "ticket_id": 1,
  "email_sent": false,
  "email_error": "Email service error: Invalid login credentials"
}
```

If you see `email_sent: false` with an authentication error, you'll need to use a Gmail App Password instead of your regular password.

---

## 🔍 Troubleshooting

### If Email Sending Fails:

**Error: "Invalid login credentials" or "535 Authentication failed"**

**Solution:** Use Gmail App Password:
1. Enable 2-Step Verification: https://myaccount.google.com/security
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Update `.env.local`:
   ```env
   SMTP_PASS=your-16-character-app-password
   ```
4. Restart server

**Error: "Connection timeout" or "ECONNREFUSED"**

**Solution:** Check firewall/network settings:
- Port 587 should be open
- Try port 465 with `SMTP_SECURE=true`

---

## ✅ Summary

**Your Configuration:** ✅ **CORRECT**

All SMTP variables are properly set:
- ✅ Host, Port, Secure settings are correct
- ✅ User email is set
- ✅ Password is configured
- ✅ Optional settings are set

**Action Required:**
1. ⏳ **Restart Next.js server** to load new environment variables
2. ⏳ **Test support API** to verify email sending works
3. ⚠️  **If authentication fails**, switch to Gmail App Password

---

**Status:** ✅ Configuration is correct!  
**Next:** Restart server and test email sending

