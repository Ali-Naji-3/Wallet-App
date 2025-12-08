# 🧪 Testing Authentication - JWT Token Creation

## 📋 Prerequisites

1. ✅ JWT_SECRET is configured in `backend/.env`
2. ✅ MySQL database is running and configured
3. ✅ All dependencies are installed (`npm install`)

---

## 🚀 Step 1: Start the Server

Open a terminal and start the backend server:

```bash
cd /home/naji/Desktop/Wallet App/backend
npm run dev
```

You should see:
```
✅ MySQL connected successfully
Server is running on port 5001
```

**Keep this terminal open!**

---

## 🧪 Step 2: Run Authentication Tests

In a **new terminal window**, run the test script:

```bash
cd /home/naji/Desktop/Wallet App/backend
node test-auth.js
```

### What the test does:

1. ✅ **Test Registration** - Creates a new user and receives a JWT token
2. ✅ **Test Login** - Logs in with credentials and receives a JWT token
3. ✅ **Test Token Verification** - Uses the token to access protected route (`/api/auth/me`)
4. ✅ **Test Invalid Token** - Verifies invalid tokens are rejected

### Expected Output:

```
🧪 Testing Authentication Endpoints

════════════════════════════════════════════════════════════
API Base URL: http://localhost:5001
Test Email: test1765188922307@example.com
════════════════════════════════════════════════════════════

📝 Test 1: User Registration
────────────────────────────────────────────────────────────
✅ Registration successful!
   Status: 201
   User ID: 1
   Email: test1765188922307@example.com
   Token (first 50 chars): eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

🔐 Test 2: User Login
────────────────────────────────────────────────────────────
✅ Login successful!
   Status: 200
   User ID: 1
   Email: test1765188922307@example.com
   Token (first 50 chars): eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

🔍 Test 3: Token Verification (GET /api/auth/me)
────────────────────────────────────────────────────────────
✅ Token verification successful!
   Status: 200
   User ID: 1
   Email: test1765188922307@example.com
   Full Name: Test User
   Base Currency: USD

🚫 Test 4: Invalid Token Test
────────────────────────────────────────────────────────────
✅ Invalid token correctly rejected!
   Status: 401

════════════════════════════════════════════════════════════
📊 Test Summary
════════════════════════════════════════════════════════════
Registration:     ✅ PASS
Login:            ✅ PASS
Token Verify:     ✅ PASS
Invalid Token:    ✅ PASS
════════════════════════════════════════════════════════════

🎉 All tests passed! JWT authentication is working correctly.
```

---

## 🔧 Manual Testing with cURL

You can also test manually using cURL:

### 1. Register a New User

```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "fullName": "Test User",
    "baseCurrency": "USD",
    "timezone": "UTC"
  }'
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "test@example.com",
    "fullName": "Test User",
    "baseCurrency": "USD",
    "timezone": "UTC",
    "role": "user"
  }
}
```

### 2. Login

```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!"
  }'
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "test@example.com",
    "fullName": "Test User",
    "baseCurrency": "USD",
    "timezone": "UTC",
    "role": "user"
  }
}
```

### 3. Verify Token (Get Profile)

```bash
# Replace YOUR_TOKEN_HERE with the token from login/register
curl http://localhost:5001/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Response:**
```json
{
  "id": 1,
  "email": "test@example.com",
  "full_name": "Test User",
  "base_currency": "USD",
  "timezone": "UTC",
  "role": "user",
  "is_active": true
}
```

### 4. Test Invalid Token

```bash
curl http://localhost:5001/api/auth/me \
  -H "Authorization: Bearer invalid.token.here"
```

**Response:**
```json
{
  "message": "Authentication token missing"
}
```

---

## 📝 Test Script Details

The test script (`backend/test-auth.js`) automatically:
- Creates a unique test email using timestamp
- Tests registration, login, token verification, and invalid token handling
- Provides detailed output for each test
- Shows a summary at the end

**Run the test:**
```bash
cd /home/naji/Desktop/Wallet App/backend
node test-auth.js
```

---

## 🔍 Troubleshooting

### Problem: "Server is not running!"
**Solution:** Make sure the server is started:
```bash
cd /home/naji/Desktop/Wallet App/backend
npm run dev
```

### Problem: "MySQL connection failed"
**Solution:** Check your MySQL settings in `backend/.env`:
- MYSQL_HOST
- MYSQL_USER
- MYSQL_DB
- MYSQL_PASSWORD

### Problem: "JWT secret not configured"
**Solution:** Verify JWT_SECRET exists in `backend/.env` and restart the server.

### Problem: "Email is already registered"
**Solution:** The test email already exists. The script uses timestamps, but you can modify the email in the script or use a different one.

---

## ✅ Success Criteria

All authentication tests pass when:
- ✅ User can register and receive a JWT token
- ✅ User can login and receive a JWT token  
- ✅ JWT token can be used to access protected routes
- ✅ Invalid tokens are properly rejected
- ✅ Token contains correct user information (id, email, role)

---

**Status**: Ready to test! Start your server and run `node test-auth.js`

