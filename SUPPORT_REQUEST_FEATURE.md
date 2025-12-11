# 📧 Support Request Feature - Complete Guide

## ✅ What Was Implemented

### 1. **User-Facing Support Request Page**
   - **Location:** `/wallet/support`
   - **Access:** Available to all users, including frozen accounts
   - **Features:**
     - Email input (auto-filled if user is logged in)
     - Subject field (optional)
     - Message textarea (required)
     - Professional UI matching app design

### 2. **Backend API Endpoint**
   - **Endpoint:** `POST /api/support/submit`
   - **Access:** Public (no authentication required)
   - **Features:**
     - Validates email format
     - Saves to database
     - Links to user account if authenticated
     - Creates `support_requests` table automatically

### 3. **Login Page Integration**
   - Added "Submit Support Request" button in account frozen/rejected notification
   - Button appears when account is frozen, rejected, or deleted
   - Links directly to support page

### 4. **Admin Support Page Updates**
   - Shows all support requests (both admin-entered and user-submitted)
   - Displays:
     - Email address
     - Subject (if provided)
     - Message preview
     - Status (pending/resolved)
     - Timestamp
     - User ID (if linked to account)

## 🔄 How It Works

### For Clients (Users):

1. **User sees account frozen notification** on login page
2. **Clicks "Submit Support Request" button**
3. **Redirected to** `/wallet/support`
4. **Fills out form:**
   - Email (auto-filled if logged in)
   - Subject (optional)
   - Message (required)
5. **Clicks "Submit Support Request"**
6. **Sees success message** with confirmation

### For Admins:

1. **Go to** `/admin/support`
2. **See "Saved Support Requests" section**
3. **View all requests** with:
   - Email
   - Subject
   - Message preview
   - Status
   - Timestamp
4. **Can also manually add emails** using the "Support Request" input field

## 📋 Database Structure

The system automatically creates this table:

```sql
CREATE TABLE support_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,              -- Links to user if authenticated
  email VARCHAR(255) NOT NULL,    -- Email address
  subject VARCHAR(255),           -- Subject (optional)
  message TEXT NOT NULL,          -- Support message
  status VARCHAR(20) DEFAULT 'pending',  -- pending/resolved
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at),
  INDEX idx_status (status)
);
```

## 🎯 User Flow

```
┌─────────────────────────────────────────┐
│  User tries to login                     │
│  Account is frozen/rejected              │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  Sees notification on login page:        │
│  "Account Frozen"                        │
│  "Contact support: support@fxwallet.com"│
│  [Submit Support Request] button         │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  Clicks "Submit Support Request"         │
│  Redirected to /wallet/support           │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  Support Request Form:                   │
│  - Email (auto-filled)                   │
│  - Subject (optional)                    │
│  - Message (required)                    │
│  [Submit Support Request]                │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  Form submitted                         │
│  Saved to database                      │
│  Success message shown                   │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  Admin sees request in                  │
│  /admin/support page                    │
│  Under "Saved Support Requests"         │
└─────────────────────────────────────────┘
```

## 🔗 Links & Access Points

1. **From Login Page:**
   - Button appears in account frozen/rejected notification
   - Direct link to `/wallet/support`

2. **Direct URL:**
   - `http://localhost:4000/wallet/support`
   - Accessible even for frozen accounts

3. **Admin View:**
   - `http://localhost:4000/admin/support`
   - Shows all support requests

## 📝 API Endpoints

### User Submission
```
POST /api/support/submit
Body: {
  email: "user@example.com",
  subject: "Account Issue" (optional),
  message: "I need help with..."
}
Response: {
  success: true,
  message: "Support request submitted successfully",
  request: { id, email, subject, status, created_at }
}
```

### Admin View
```
GET /api/admin/support/requests
Headers: Authorization: Bearer <admin-token>
Response: {
  requests: [
    {
      id: 1,
      user_id: 123,
      email: "user@example.com",
      subject: "Account Issue",
      message: "I need help...",
      status: "pending",
      created_at: "2024-01-15T10:30:00Z"
    }
  ],
  count: 1
}
```

## 🎨 UI Features

### Support Request Form:
- ✅ Clean, professional design
- ✅ Auto-fills email if user is logged in
- ✅ Email validation
- ✅ Success confirmation page
- ✅ Responsive layout
- ✅ Dark mode support

### Admin View:
- ✅ Shows all requests in organized list
- ✅ Displays email, subject, message preview
- ✅ Status badges (pending/resolved)
- ✅ Timestamp display
- ✅ User ID linking

## 🔒 Security Features

1. **Email Validation:** Both frontend and backend
2. **SQL Injection Protection:** Parameterized queries
3. **Public Access:** Support page accessible to everyone (including frozen accounts)
4. **Admin Protection:** Admin endpoints require authentication
5. **User Linking:** Links requests to user accounts when possible

## 🧪 Testing

### Test User Submission:
1. Go to login page
2. Try to login with frozen account (e.g., `rebie@gmail.com`)
3. See "Account Frozen" notification
4. Click "Submit Support Request" button
5. Fill out form and submit
6. See success message

### Test Admin View:
1. Login as admin
2. Go to `/admin/support`
3. See "Saved Support Requests" section
4. View all submitted requests

---

**The feature is now fully functional!** Clients can submit support requests when their account is frozen, and admins can view all requests in the admin support page.

