# 🔍 Admin User Diagnostic Guide

## Problem: 403 Forbidden Error

This happens when your user account doesn't have `role = 'admin'` in the database.

---

## ✅ QUICK FIX - Check Your Admin User

### Step 1: Check Database Connection

First, find your database name from the backend `.env` file:

```bash
cd /home/naji/Documents/Wallet-App/backend
cat .env | grep MYSQL_DB
```

You should see something like:
```
MYSQL_DB=fxwallet_db
```

### Step 2: Check Users in Database

Replace `YOUR_DATABASE_NAME` with your actual database name:

```bash
# Check all users and their roles
mysql -u root -p -e "USE YOUR_DATABASE_NAME; SELECT id, email, role, is_active FROM users;"
```

**Example:**
```bash
mysql -u root -p -e "USE fxwallet_db; SELECT id, email, role, is_active FROM users;"
```

### Step 3: Verify Admin User Exists

You should see output like:
```
+----+-------------------+-------+-----------+
| id | email             | role  | is_active |
+----+-------------------+-------+-----------+
|  1 | admin@admin.com   | admin |         1 |
|  2 | user@test.com     | user  |         1 |
+----+-------------------+-------+-----------+
```

---

## 🚨 IF ADMIN USER IS MISSING OR WRONG ROLE

### Fix 1: Update Existing User to Admin

If you have a user but they're not admin:

```sql
-- Replace YOUR_DATABASE_NAME and YOUR_EMAIL
mysql -u root -p -e "
USE YOUR_DATABASE_NAME;
UPDATE users SET role = 'admin' WHERE email = 'YOUR_EMAIL';
SELECT id, email, role FROM users WHERE email = 'YOUR_EMAIL';
"
```

**Example:**
```bash
mysql -u root -p -e "
USE fxwallet_db;
UPDATE users SET role = 'admin' WHERE email = 'admin@admin.com';
SELECT id, email, role FROM users WHERE email = 'admin@admin.com';
"
```

### Fix 2: Create New Admin User

If no admin user exists:

```bash
cd /home/naji/Documents/Wallet-App/backend/next
node scripts/create-admin.js
```

Or manually via SQL:

```sql
mysql -u root -p
```

Then run:
```sql
USE your_database_name;

-- Create admin user (replace password_hash with bcrypt hash)
INSERT INTO users (email, password_hash, full_name, role, is_verified, is_active)
VALUES (
  'admin@admin.com',
  '$2b$10$YourBcryptHashHere',  -- You need to generate this
  'Admin User',
  'admin',
  1,
  1
);
```

---

## 🔐 GENERATE PASSWORD HASH

To generate a bcrypt hash for password `admin123`:

### Option 1: Use Node.js Script

Create a file `hash-password.js`:

```javascript
const bcrypt = require('bcryptjs');

const password = 'admin123';
const hash = bcrypt.hashSync(password, 10);

console.log('Password:', password);
console.log('Hash:', hash);
```

Run it:
```bash
cd /home/naji/Documents/Wallet-App/backend
node hash-password.js
```

### Option 2: Use Existing Script

```bash
cd /home/naji/Documents/Wallet-App/backend/next
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('admin123', 10));"
```

Copy the hash and use it in the SQL INSERT above.

---

## 🧪 TEST ADMIN ACCESS

### Step 1: Verify Database

```bash
mysql -u root -p -e "
USE your_database_name;
SELECT id, email, role, is_active FROM users WHERE role = 'admin';
"
```

**Expected Output:**
```
+----+-------------------+-------+-----------+
| id | email             | role  | is_active |
+----+-------------------+-------+-----------+
|  1 | admin@admin.com   | admin |         1 |
+----+-------------------+-------+-----------+
```

### Step 2: Test Login

1. Restart your servers:
   ```bash
   # Kill existing servers (Ctrl+C in both terminals)
   
   # Terminal 1 - Backend
   cd /home/naji/Documents/Wallet-App/backend
   npm run dev
   
   # Terminal 2 - Frontend
   cd /home/naji/Documents/Wallet-App/backend/next
   PORT=4000 npm run dev
   ```

2. Open browser: `http://localhost:4000/login`

3. Login with:
   - Email: `admin@admin.com`
   - Password: `admin123`

4. Check browser console (F12) for errors

5. Navigate to `/admin/wallets`

---

## 🔍 DEBUG 403 ERROR

If you still get 403 after fixing the role:

### Check 1: JWT Token

Open browser console (F12) and run:
```javascript
localStorage.getItem('fxwallet_token')
```

Should return a long string like: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

If it returns `null`, you're not logged in.

### Check 2: Decode Token

Copy the token and decode it at https://jwt.io

Check the payload:
```json
{
  "id": 1,
  "email": "admin@admin.com",
  "role": "admin",  // ← Should be "admin"
  "iat": 1234567890,
  "exp": 1234567890
}
```

If `role` is not "admin", the token was created before you updated the role. **Logout and login again.**

### Check 3: Clear Storage and Re-login

```javascript
// In browser console
localStorage.clear();
sessionStorage.clear();
location.reload();
```

Then login again.

---

## 🐛 USER SEARCH RETURNS NO RESULTS

### Issue: Search Filter Too Restrictive

**Fixed!** The search was filtering `role = 'user'` which excluded admin and other users.

**New behavior:** Search returns ALL users (admin + regular users)

### Test User Search:

1. Login as admin
2. Go to Wallets page
3. Type any part of an email in the search box
4. Should see dropdown with matching users

### If Still No Results:

Check if users exist:
```bash
mysql -u root -p -e "
USE your_database_name;
SELECT id, email, full_name, role FROM users LIMIT 10;
"
```

If no users exist, create a test user:
```bash
cd /home/naji/Documents/Wallet-App/backend/next
node -e "
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function createTestUser() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'your_mysql_password',
    database: 'your_database_name'
  });
  
  const hash = bcrypt.hashSync('password123', 10);
  
  await pool.query(
    'INSERT INTO users (email, password_hash, full_name, role, is_verified, is_active) VALUES (?, ?, ?, ?, ?, ?)',
    ['test@example.com', hash, 'Test User', 'user', 1, 1]
  );
  
  console.log('Test user created: test@example.com / password123');
  process.exit(0);
}

createTestUser();
"
```

---

## ✅ VERIFICATION CHECKLIST

After fixes, verify:

- [ ] Admin user exists in database with `role = 'admin'`
- [ ] Admin user has `is_active = 1`
- [ ] Can login with admin credentials
- [ ] JWT token contains `"role": "admin"`
- [ ] Can access `/admin/wallets` without 403
- [ ] User search returns results
- [ ] Can see list of users in dropdown

---

## 🆘 STILL HAVING ISSUES?

### Check Backend Logs

Look at the terminal running the backend server for errors:
```
✅ MySQL connected successfully
Server is running on port 5001
```

### Check Frontend Console

Open browser console (F12) and look for:
- Red error messages
- Failed API calls
- 403 Forbidden responses

### Common Errors:

**Error: "Forbidden: Admin access required"**
- ✅ Fix: Update user role to 'admin' in database

**Error: "Unauthorized: Invalid token"**
- ✅ Fix: Logout and login again

**Error: "User not found"**
- ✅ Fix: Check user exists in database

**Error: "No users found" in search**
- ✅ Fix: Create test users or check database has users

---

## 🎯 QUICK COMMANDS SUMMARY

```bash
# 1. Check database name
cd /home/naji/Documents/Wallet-App/backend
cat .env | grep MYSQL_DB

# 2. Check users (replace YOUR_DB_NAME)
mysql -u root -p -e "USE YOUR_DB_NAME; SELECT id, email, role FROM users;"

# 3. Make user admin (replace YOUR_DB_NAME and EMAIL)
mysql -u root -p -e "USE YOUR_DB_NAME; UPDATE users SET role = 'admin' WHERE email = 'admin@admin.com';"

# 4. Verify admin user
mysql -u root -p -e "USE YOUR_DB_NAME; SELECT id, email, role FROM users WHERE role = 'admin';"

# 5. Restart servers
# Ctrl+C in both terminals, then:
cd /home/naji/Documents/Wallet-App/backend && npm run dev
cd /home/naji/Documents/Wallet-App/backend/next && PORT=4000 npm run dev

# 6. Clear browser cache and re-login
# Browser console: localStorage.clear(); location.reload();
```

---

## 📞 NEED MORE HELP?

If you're still stuck, provide:
1. Output of: `SELECT id, email, role FROM users;`
2. Browser console errors (F12 → Console tab)
3. Backend terminal errors
4. Screenshot of the 403 error

Good luck! 🚀

