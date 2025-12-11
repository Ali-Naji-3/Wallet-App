# 🚀 Quick Start: Next.js Server on Port 4000

## Problem
Server is not running on port 4000, causing connection errors when testing the support API.

## Solution

### Option 1: Start Server on Port 4000 (Recommended)

```bash
cd /home/naji/Documents/Wallet-App/backend/next
PORT=4000 npm run dev
```

**Or set it permanently in package.json:**

Edit `package.json`:
```json
{
  "scripts": {
    "dev": "next dev -p 4000"
  }
}
```

Then run:
```bash
npm run dev
```

---

### Option 2: Use Port 3000 (If server is already running there)

If your server is running on port 3000, test with:

```bash
curl -X POST http://localhost:3000/api/support/submit \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "subject": "Test Support Request",
    "message": "This is a test message to verify email sending works."
  }'
```

---

## ✅ Verify Server is Running

**Check port 4000:**
```bash
lsof -ti:4000 && echo "✅ Server running on 4000" || echo "❌ No server on 4000"
```

**Check port 3000:**
```bash
lsof -ti:3000 && echo "✅ Server running on 3000" || echo "❌ No server on 3000"
```

**Test health endpoint:**
```bash
curl http://localhost:4000/api/health
# or
curl http://localhost:3000/api/health
```

---

## 🧪 Test Support API

Once server is running, test:

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

---

## 📋 Quick Commands

**Start server on port 4000:**
```bash
cd /home/naji/Documents/Wallet-App/backend/next
PORT=4000 npm run dev
```

**In another terminal, test API:**
```bash
curl -X POST http://localhost:4000/api/support/submit \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","message":"test"}'
```

---

**Status:** Server needs to be started on port 4000

