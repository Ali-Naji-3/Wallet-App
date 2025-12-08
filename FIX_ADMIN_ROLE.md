# Fix "Forbidden: Admin access required" Error

## 🔍 Issue Found

The error "Forbidden: Admin access required" means:
- ✅ You're logged in (authentication works)
- ❌ Your user account doesn't have `role = 'admin'` in the database

## ✅ Quick Fix

### Option 1: Update Your User Role (Easiest)

Run this SQL in your MySQL database:

```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@admin.com';
```

### Option 2: Use the API Endpoint

The admin user should already be created, but if the role is missing:

```bash
curl -X POST http://localhost:3000/api/admin/create-admin
```

This will:
- Create admin@admin.com if it doesn't exist
- Update existing user to have admin role
- Set password to "admin"

### Option 3: Check Current User Role

First, check what role your user has:

```sql
SELECT id, email, role, is_active FROM users WHERE email = 'admin@admin.com';
```

If `role` is `NULL` or `'user'`, update it:

```sql
UPDATE users 
SET role = 'admin', is_active = 1, is_verified = 1 
WHERE email = 'admin@admin.com';
```

## 🔧 What I Fixed

1. **Better Error Message**: The dashboard now shows a clearer error message explaining the issue
2. **Auto-Create Admin**: Added attempt to auto-create admin user on dashboard load (if endpoint is accessible)

## 📝 Steps to Fix

1. **Open MySQL client** (phpMyAdmin, MySQL Workbench, or command line)
2. **Run this SQL**:
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'admin@admin.com';
   ```
3. **Verify**:
   ```sql
   SELECT email, role FROM users WHERE email = 'admin@admin.com';
   ```
   Should show: `role = 'admin'`
4. **Refresh the dashboard** - it should work now!

## ✅ After Fix

Once the role is updated, you can:
- Access `/admin` dashboard
- View all admin statistics
- Manage users, transactions, wallets
- All admin features will work

The issue is simply that your user account needs the `role = 'admin'` field set in the database.







