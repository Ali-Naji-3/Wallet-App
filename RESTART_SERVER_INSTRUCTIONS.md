# 🔄 Restart Server Instructions

## ✅ What I Fixed

1. ✅ **Updated `package.json`** - Server will now run on port 4000 by default
2. ✅ **SMTP Configuration** - Already correct in `.env.local`
3. ✅ **Nodemailer** - Already installed

## 🚀 Next Steps

### Step 1: Stop Current Server

**Find and stop the server running on port 3000:**

```bash
# Find the process
lsof -ti:3000

# Stop it (replace PID with actual process ID)
kill $(lsof -ti:3000)

# Or stop all Next.js processes
pkill -f "next dev"
```

### Step 2: Restart Server on Port 4000

```bash
cd /home/naji/Documents/Wallet-App/backend/next
npm run dev
```

**Expected Output:**
```
▲ Next.js 16.0.6
- Local:        http://localhost:4000
- Ready in Xs
```

### Step 3: Test Support API

**Wait for server to start (about 10-15 seconds), then test:**

```bash
curl -X POST http://localhost:4000/api/support/submit \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "subject": "Test Support Request",
    "message": "This is a test message to verify email sending works."
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

---

## 🔍 Verify Server is Running

**Check if server is on port 4000:**
```bash
lsof -ti:4000 && echo "✅ Server running on 4000" || echo "❌ No server on 4000"
```

**Test health endpoint:**
```bash
curl http://localhost:4000/api/health
```

Should return: `{"status":"ok"}`

---

## 📋 Quick Commands (Copy & Paste)

```bash
# 1. Stop old server
cd /home/naji/Documents/Wallet-App/backend/next
pkill -f "next dev"

# 2. Wait 2 seconds
sleep 2

# 3. Start new server on port 4000
npm run dev

# 4. In another terminal, test API (wait 10 seconds first)
curl -X POST http://localhost:4000/api/support/submit \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","message":"test message"}'
```

---

## ✅ Summary

**Changes Made:**
- ✅ Updated `package.json` to run on port 4000
- ✅ SMTP config already correct
- ✅ Nodemailer already installed

**Action Required:**
1. ⏳ Stop current server (port 3000)
2. ⏳ Restart server (will now use port 4000)
3. ⏳ Test support API endpoint

---

**After restarting, your support API will work on port 4000!**

