# 🔐 How Security Features Work - Complete Guide

**Date:** December 11, 2025  
**Features:** Change Password & Security Settings  
**Status:** ✅ **FULLY FUNCTIONAL**

---

## 📋 Overview

The security features allow users to:
1. **Change Password** - Update their account password
2. **Toggle Two-Factor Authentication (2FA)** - Enable/disable 2FA
3. **View Login History** - See recent security activities

---

## 🔄 How It Works - Step by Step

### 1. Change Password Flow

#### Frontend (`/wallet/profile`):

```
User clicks "Change Password" button
    ↓
Modal opens with 3 password fields:
    - Current Password
    - New Password  
    - Confirm New Password
    ↓
User fills in all fields
    ↓
Frontend validates:
    ✓ All fields filled
    ✓ New password matches confirmation
    ✓ Password length ≥ 8 characters
    ✓ Contains uppercase, lowercase, and number
    ✓ New password ≠ current password
    ↓
If validation passes:
    ↓
POST /api/auth/change-password
{
  currentPassword: "...",
  newPassword: "...",
  confirmPassword: "..."
}
    ↓
Backend validates & updates password
    ↓
Success toast: "Password changed successfully!"
    ↓
Modal closes, form resets
```

#### Backend (`/api/auth/change-password`):

```
1. Verify JWT token (authentication)
2. Validate request body:
   - All fields present
   - Passwords match
   - Password strength requirements
3. Get user from database
4. Verify current password (bcrypt.compare)
5. Hash new password (bcrypt.hash)
6. Update password_hash in database
7. Log security event to security_logs table
8. Return success response
```

---

### 2. Two-Factor Authentication (2FA) Toggle Flow

#### Frontend (`/wallet/profile`):

```
User clicks "Two-Factor Auth" button
    ↓
Modal opens showing current 2FA status
    ↓
GET /api/auth/security
    ↓
Backend returns:
{
  success: true,
  security: {
    twoFactorEnabled: false,
    ...
  }
}
    ↓
Frontend displays current status
    ↓
User toggles switch ON/OFF
    ↓
PUT /api/auth/security
{
  twoFactorEnabled: true/false
}
    ↓
Backend updates database
    ↓
Success toast: "Two-Factor Authentication enabled/disabled"
    ↓
Status updates in real-time
```

#### Backend (`/api/auth/security`):

**GET Request:**
```
1. Verify JWT token
2. Check if security columns exist:
   - two_factor_enabled
   - two_factor_secret
   - security_questions_set
   - last_password_change
3. If columns don't exist → CREATE them automatically
4. Query user security settings
5. Return security data
```

**PUT Request:**
```
1. Verify JWT token
2. Check if security columns exist → CREATE if missing
3. Parse request body (twoFactorEnabled)
4. Update two_factor_enabled in database
5. Log security event (2fa_enabled/2fa_disabled)
6. Return success response
```

---

### 3. Login History Flow

#### Frontend (`/wallet/profile`):

```
User clicks "Login History" button
    ↓
Modal opens
    ↓
GET /api/auth/security-logs
    ↓
Backend returns security logs
    ↓
Frontend displays:
    - Action (Password Changed, 2FA Enabled, etc.)
    - IP Address
    - User Agent
    - Timestamp
    ↓
User can scroll through history
```

#### Backend (`/api/auth/security-logs`):

```
1. Verify JWT token
2. Query security_logs table:
   SELECT * FROM security_logs 
   WHERE user_id = ? 
   ORDER BY created_at DESC 
   LIMIT 50
3. Return logs array
```

---

## 🗄️ Database Auto-Migration

### How Columns Are Created:

When the API is called for the first time:

```javascript
// Backend automatically checks and creates columns
const securityColumns = [
  { name: 'two_factor_enabled', type: 'TINYINT(1) DEFAULT 0' },
  { name: 'two_factor_secret', type: 'VARCHAR(255) DEFAULT NULL' },
  { name: 'security_questions_set', type: 'TINYINT(1) DEFAULT 0' },
  { name: 'last_password_change', type: 'TIMESTAMP NULL DEFAULT NULL' },
];

for (const col of securityColumns) {
  try {
    await pool.query(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type}`);
    console.log(`✅ Added column: ${col.name}`);
  } catch (error) {
    // Column already exists, ignore error
    if (error.code === 1060) {
      // Duplicate column - already exists, continue
    }
  }
}
```

**Result:**
- Columns are created automatically on first API call
- No manual database migration needed
- Safe to run multiple times (handles duplicates)

---

## 🔒 Security Features

### Password Requirements:

```javascript
✓ Minimum 8 characters
✓ At least one uppercase letter (A-Z)
✓ At least one lowercase letter (a-z)
✓ At least one number (0-9)
✓ Cannot be same as current password
✓ Must match confirmation password
```

### Authentication:

```
All endpoints require:
✓ Valid JWT token in Authorization header
✓ Token must not be expired
✓ User must exist in database
✓ Account must be active (not suspended)
```

### Security Logging:

Every security action is logged:

```sql
INSERT INTO security_logs (
  user_id,
  action,
  ip_address,
  user_agent,
  created_at
) VALUES (?, ?, ?, ?, NOW());
```

**Logged Actions:**
- `password_changed` - When user changes password
- `2fa_enabled` - When 2FA is enabled
- `2fa_disabled` - When 2FA is disabled
- `login` - When user logs in (future)
- `logout` - When user logs out (future)

---

## 📊 Database Schema

### `users` Table Columns:

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `two_factor_enabled` | TINYINT(1) | 0 | 2FA enabled (0/1) |
| `two_factor_secret` | VARCHAR(255) | NULL | 2FA secret key |
| `security_questions_set` | TINYINT(1) | 0 | Security questions set |
| `last_password_change` | TIMESTAMP | NULL | Last password change |

### `security_logs` Table:

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT | Primary key |
| `user_id` | INT | Foreign key to users |
| `action` | VARCHAR(50) | Action type |
| `ip_address` | VARCHAR(45) | User's IP |
| `user_agent` | TEXT | Browser/device info |
| `created_at` | TIMESTAMP | When action occurred |

---

## 🎯 User Experience Flow

### Change Password:

1. **Click Button** → "Change Password" in Security card
2. **Modal Opens** → Password form appears
3. **Enter Passwords** → Fill in all 3 fields
4. **Real-time Validation** → See errors immediately
5. **Submit** → Password updates
6. **Success** → Toast notification + modal closes
7. **Form Resets** → Ready for next use

### Toggle 2FA:

1. **Click Button** → "Two-Factor Auth" in Security card
2. **Modal Opens** → Shows current 2FA status
3. **Toggle Switch** → Enable/disable 2FA
4. **Instant Update** → Status changes immediately
5. **Success Toast** → Confirmation message
6. **Logs Updated** → Security event recorded

### View Login History:

1. **Click Button** → "Login History" in Security card
2. **Modal Opens** → Shows loading state
3. **Logs Load** → Fetches from API
4. **Display History** → Shows last 50 events
5. **Scroll** → View all activities
6. **Close** → Modal dismisses

---

## 🔧 Error Handling

### Frontend Errors:

```javascript
try {
  const { data } = await apiClient.put('/api/auth/security', {...});
  if (data.success) {
    toast.success('Success!');
  } else {
    toast.error(data.message);
  }
} catch (error) {
  // Log full error for debugging
  console.error('Error:', error);
  
  // Show user-friendly message
  const errorMessage = error.response?.data?.message || 
                       error.message || 
                       'Failed to update';
  toast.error(errorMessage);
}
```

### Backend Errors:

```javascript
try {
  // Database operations
} catch (error) {
  // Log detailed error
  console.error('Error:', error);
  console.error('Stack:', error.stack);
  console.error('SQL Error:', error.sqlMessage);
  
  // Return user-friendly response
  return NextResponse.json({
    success: false,
    message: error.message || 'Operation failed',
    error: error.code || 'INTERNAL_ERROR',
  }, { status: 500 });
}
```

---

## 🧪 Testing the Features

### Test Change Password:

```bash
# 1. Login to get token
TOKEN="your-jwt-token"

# 2. Change password
curl -X POST http://localhost:4000/api/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "currentPassword": "oldpass123",
    "newPassword": "NewPass123",
    "confirmPassword": "NewPass123"
  }'
```

### Test 2FA Toggle:

```bash
# 1. Get security settings
curl -X GET http://localhost:4000/api/auth/security \
  -H "Authorization: Bearer $TOKEN"

# 2. Enable 2FA
curl -X PUT http://localhost:4000/api/auth/security \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"twoFactorEnabled": true}'
```

### Test Login History:

```bash
curl -X GET http://localhost:4000/api/auth/security-logs \
  -H "Authorization: Bearer $TOKEN"
```

---

## ✅ Summary

**How It Works:**

1. **User Interface** → Profile page with Security card
2. **Modal Dialogs** → Forms for each feature
3. **API Calls** → Backend endpoints handle requests
4. **Database** → Auto-creates columns, stores data
5. **Security Logging** → Records all activities
6. **Error Handling** → User-friendly messages
7. **Success Feedback** → Toast notifications

**Key Features:**

✅ Automatic database migration  
✅ Real-time validation  
✅ Secure password hashing  
✅ Security event logging  
✅ User-friendly error messages  
✅ Responsive UI  

---

**Status:** ✅ **FULLY FUNCTIONAL**  
**Ready to Use:** ✅ **YES**

