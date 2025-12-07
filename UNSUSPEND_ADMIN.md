# 🔓 How to Unsuspend Admin Account

## ✅ Problem Solved!

Your admin account has been **unsuspended**! You can now login.

**Admin Email:** `admin@admin.com`  
**Status:** ✅ ACTIVE

---

## 🚀 Quick Login

1. Go to: `http://localhost:4000/login`
2. Email: `admin@admin.com`
3. Password: `admin123` (or your admin password)
4. You should now be able to login!

---

## 🛠️ If This Happens Again

### Option 1: Use the Script (Recommended)

```bash
cd backend/next
node scripts/unsuspend-admin.js
```

Or for a specific email:
```bash
node scripts/unsuspend-admin.js admin@admin.com
```

### Option 2: Direct Database Query

```sql
UPDATE users 
SET is_active = 1, suspension_reason = NULL 
WHERE email = 'admin@admin.com';
```

### Option 3: Use Admin API (If you have another admin account)

```bash
curl -X POST http://localhost:4000/api/admin/users/3/unfreeze \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## 📝 What Happened?

Your admin account was suspended because:
- **Reason:** KYC verification rejected: Document expired
- **Status:** Account was set to `is_active = 0`
- **Solution:** Account has been reactivated

---

## 🔒 Prevent Future Suspensions

### For Admin Accounts:
1. **Skip KYC for admins** - Admins shouldn't need KYC verification
2. **Auto-approve admin KYC** - If KYC is submitted, auto-approve it
3. **Protect admin accounts** - Don't allow KYC rejection to suspend admin accounts

### Quick Fix in Code:
You can modify the KYC rejection logic to not suspend admin accounts:

```javascript
// In backend/next/app/api/admin/kyc/[id]/reject/route.js
// Before suspending, check if user is admin:
const [userCheck] = await pool.query(
  'SELECT role FROM users WHERE id = ?',
  [kycData.user_id]
);

if (userCheck[0]?.role === 'admin') {
  // Don't suspend admin accounts
  console.log('Admin account - skipping suspension');
} else {
  // Suspend regular users
  await pool.query(
    'UPDATE users SET is_active = 0, suspension_reason = ? WHERE id = ?',
    [suspensionMessage, kycData.user_id]
  );
}
```

---

## ✅ Current Status

- ✅ Admin account unsuspended
- ✅ Suspension reason cleared
- ✅ Account is active
- ✅ Ready to login

**Try logging in now!** 🎉

