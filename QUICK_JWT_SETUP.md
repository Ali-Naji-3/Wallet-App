# ⚡ Quick JWT Setup Guide

## 🚀 **3 Steps to Create JWT Tokens**

### **Step 1: Generate JWT_SECRET**

Run this command:

```bash
cd backend
node generate-jwt-secret.js
```

This will generate a secure random secret like:
```
JWT_SECRET=19ec8296a9bf87f24c4f4d4b17218da366da69b499467f5e68a430705f1931af...
```

### **Step 2: Add to Environment Files**

Copy the generated `JWT_SECRET=` line to:

**File 1:** `backend/.env`
```env
JWT_SECRET=your_generated_secret_here
```

**File 2:** `backend/next/.env.local`
```env
JWT_SECRET=your_generated_secret_here
```

**⚠️ Important:** Use the **SAME** secret in both files!

### **Step 3: Restart Servers**

```bash
# Restart Next.js server
cd backend/next
npm run dev
```

---

## 📝 **How JWT Tokens are Created**

### **In Login Route:**

```javascript
// 1. User provides email & password
// 2. Verify password
// 3. Create token:
const token = jwt.sign(
  { id: user.id, email: user.email },
  process.env.JWT_SECRET,
  { expiresIn: '1d' }
);
// 4. Return token to client
```

### **In Register Route:**

```javascript
// 1. Create new user
// 2. Create token:
const token = jwt.sign(
  { id: newUserId, email: email },
  process.env.JWT_SECRET,
  { expiresIn: '1d' }
);
// 3. Return token to client
```

---

## ✅ **Test JWT Creation**

### **Test Login (creates JWT):**

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "test@example.com"
  }
}
```

### **Use Token:**

```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 📚 **Files Created**

✅ `JWT_GUIDE.md` - Complete detailed guide  
✅ `backend/generate-jwt-secret.js` - Secret generator script  
✅ `backend/next/app/api/auth/login/route.js` - Login route (creates JWT)  
✅ `backend/next/app/api/auth/register/route.js` - Register route (creates JWT)  

---

## 🎯 **Summary**

1. **Generate secret**: `node backend/generate-jwt-secret.js`
2. **Add to .env files**: Copy the JWT_SECRET line
3. **Tokens are created automatically** when users login/register
4. **Tokens are verified** in protected routes using `verifyToken()`

**That's it!** 🎉

