# 🔐 JWT Token Creation Guide

## 📋 **What is JWT?**

JWT (JSON Web Token) is used for authentication. When a user logs in, the server creates a JWT token that the client uses for authenticated requests.

---

## 🔑 **Step 1: Generate JWT_SECRET**

### **Option A: Using Node.js (Recommended)**

Create a secure random secret:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

This will output something like:
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3h4i5j6k7l8m9n0o1p2q3r4s5t6u7v8w9x0y1z2
```

### **Option B: Using OpenSSL**

```bash
openssl rand -hex 64
```

### **Option C: Online Generator**

Visit: https://generate-secret.vercel.app/64

---

## ⚙️ **Step 2: Set JWT_SECRET in Environment**

### **For Express Backend (backend/.env):**

```env
JWT_SECRET=your_generated_secret_here_minimum_32_characters
```

### **For Next.js Backend (backend/next/.env.local):**

```env
JWT_SECRET=your_generated_secret_here_minimum_32_characters
```

**⚠️ Important:** Use the **SAME** JWT_SECRET in both if you want tokens to work across both backends!

---

## 💻 **Step 3: How JWT Tokens are Created**

### **In Express Backend (authController.js):**

```javascript
import jwt from 'jsonwebtoken';

const JWT_EXPIRES_IN = '1d'; // Token expires in 1 day

const buildToken = (user) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT secret not configured');
  }

  return jwt.sign(
    {
      sub: user.id,        // User ID
      email: user.email,   // User email
    },
    secret,                // JWT_SECRET from .env
    { expiresIn: JWT_EXPIRES_IN }  // Token expires in 1 day
  );
};

// Usage in login/register:
const token = buildToken(user);
// Returns: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### **In Next.js Backend (create new route):**

```javascript
import jwt from 'jsonwebtoken';

export function createToken(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('Missing JWT_SECRET');
  }

  return jwt.sign(
    {
      id: user.id,
      email: user.email,
    },
    secret,
    { expiresIn: '1d' }  // Expires in 1 day
  );
}
```

---

## 📝 **Step 4: Complete Example - Login Route**

### **Express Backend Example:**

```javascript
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // 1. Find user
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // 2. Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // 3. Create JWT token
    const token = buildToken(user);
    
    // 4. Return token to client
    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
      }
    });
  } catch (err) {
    return res.status(500).json({ message: 'Login failed' });
  }
};
```

---

## 🔍 **Step 5: Verify JWT Token**

### **In Next.js (lib/auth.js):**

```javascript
import jwt from 'jsonwebtoken';

export function verifyToken(token) {
  const secret = process.env.JWT_SECRET;
  const decoded = jwt.verify(token, secret);
  return { 
    id: Number(decoded?.id || decoded?.sub), 
    email: decoded?.email 
  };
}
```

### **Usage in API Route:**

```javascript
import { parseBearer, verifyToken } from '@/lib/auth';

export async function GET(req) {
  // 1. Get token from Authorization header
  const token = parseBearer(req.headers.get('authorization'));
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  
  // 2. Verify token
  try {
    const user = verifyToken(token);
    // user = { id: 1, email: 'user@example.com' }
    
    // 3. Use user data
    // ... your logic here
  } catch (err) {
    return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
  }
}
```

---

## 🧪 **Step 6: Test JWT Creation**

### **Create a test script:**

```javascript
// test-jwt.js
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'your_secret_here';
const user = { id: 1, email: 'test@example.com' };

// Create token
const token = jwt.sign(
  { id: user.id, email: user.email },
  JWT_SECRET,
  { expiresIn: '1d' }
);

console.log('Token:', token);

// Verify token
try {
  const decoded = jwt.verify(token, JWT_SECRET);
  console.log('Decoded:', decoded);
} catch (err) {
  console.error('Invalid token:', err.message);
}
```

Run it:
```bash
node test-jwt.js
```

---

## 📊 **JWT Token Structure**

A JWT token has 3 parts separated by dots:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIn0.signature
```

1. **Header** (first part): Algorithm and token type
2. **Payload** (second part): Your data (user id, email, etc.)
3. **Signature** (third part): Verification signature

You can decode the payload at: https://jwt.io

---

## ⚠️ **Security Best Practices**

1. ✅ **Use a strong JWT_SECRET** (minimum 32 characters, random)
2. ✅ **Never commit JWT_SECRET to Git** (use .env files)
3. ✅ **Set expiration time** (1d, 7d, etc.)
4. ✅ **Use HTTPS in production**
5. ✅ **Store tokens securely** (httpOnly cookies or localStorage)
6. ✅ **Validate tokens on every request**

---

## 🚀 **Quick Setup Commands**

```bash
# 1. Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# 2. Add to backend/.env
echo "JWT_SECRET=your_generated_secret" >> backend/.env

# 3. Add to backend/next/.env.local
echo "JWT_SECRET=your_generated_secret" >> backend/next/.env.local

# 4. Restart servers
```

---

## 📚 **JWT Options**

```javascript
jwt.sign(payload, secret, {
  expiresIn: '1d',        // 1 day, or '7d', '1h', '30m'
  algorithm: 'HS256',     // Default algorithm
  issuer: 'your-app',     // Optional: who issued the token
  audience: 'your-users', // Optional: who the token is for
});
```

---

**Last Updated**: $(date)
**Status**: ✅ Ready to use

