# ✅ Next Steps Checklist - JWT_SECRET Configuration

## 🔐 Configuration Status
- [x] JWT_SECRET generated (128 characters, 512-bit)
- [x] JWT_SECRET added to `backend/.env`
- [x] Next.js backend linked (symlink shares same secret)
- [x] Environment variables verified

## 🚀 Action Items

### 1. Start Development Servers

**Option A: Express Backend Only**
```bash
cd /home/naji/Desktop/Wallet App/backend
npm run dev
```

**Option B: Both Express + Next.js Backends**
```bash
# Terminal 1 - Express
cd /home/naji/Desktop/Wallet App/backend
npm run dev

# Terminal 2 - Next.js
cd /home/naji/Desktop/Wallet App/backend
npm run next:dev
```

### 2. Verify JWT_SECRET is Loaded

Once server starts, check for:
- ✅ "Server is running on port XXXX" message
- ✅ No "JWT secret not configured" errors
- ✅ MySQL connection successful

### 3. Test JWT Token Creation

**Test Login (creates JWT token):**
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com","password":"your-password"}'
```

**Expected Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com"
  }
}
```

### 4. Test Token Verification

**Use token from step 3:**
```bash
curl http://localhost:5001/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response:**
```json
{
  "id": 1,
  "email": "user@example.com",
  ...
}
```

## ⚠️ Important Notes

1. **Existing tokens are invalid**: Any JWT tokens created before updating JWT_SECRET will no longer work. Users need to log in again.

2. **Server restart required**: The server must be restarted for the new JWT_SECRET to take effect.

3. **Token expiration**: Tokens expire after 1 day (configured in `authController.js`).

## 🔍 Troubleshooting

**Problem**: "JWT secret not configured" error
- **Solution**: Verify `JWT_SECRET=` exists in `backend/.env` and restart server

**Problem**: "Invalid token" when using old tokens
- **Solution**: This is expected. Log in again to get a new token with the new secret

**Problem**: MySQL connection fails
- **Solution**: Verify MySQL environment variables in `backend/.env`:
  - MYSQL_HOST
  - MYSQL_USER
  - MYSQL_DB
  - MYSQL_PASSWORD (if required)

## 📝 Quick Reference

**JWT_SECRET Location**: `backend/.env`
**Token Expiration**: 1 day
**Algorithm**: HS256
**Backend Port**: 5001 (default)

---
**Status**: ✅ Ready to start servers and test
