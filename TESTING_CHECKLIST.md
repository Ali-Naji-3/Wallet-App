# Testing Checklist - Dynamic Balance Feature

## 🎯 Pre-Demo Checklist

Before your presentation, verify these items work correctly:

---

## ✅ Step 1: Backend Setup

### Start the Backend Server

```bash
cd "Wallet-App/backend"
npm start
```

**Expected Output:**
```
Server running on port 4000
Database connected successfully
```

**If there are errors:**
- Check MySQL is running
- Verify database credentials in `.env` or `src/config/db.js`
- Run: `npm install` if dependencies are missing

---

## ✅ Step 2: Frontend Setup

### Start Next.js Frontend

```bash
cd "Wallet-App/backend/next"
npm run dev
```

**Expected Output:**
```
Ready on http://localhost:3000
```

**Access Points:**
- User Login: `http://localhost:3000/login`
- User Dashboard: `http://localhost:3000/wallet/dashboard`
- Admin Dashboard: `http://localhost:3000/admin/dashboard`

---

## ✅ Step 3: Test Admin Login

1. **Navigate to:** `http://localhost:3000/login`

2. **Login with Admin Credentials:**
   - Email: `admin@admin.com` (or your admin email)
   - Password: Your admin password

3. **Verify Access:**
   - Should redirect to `/admin/dashboard`
   - Should see stats cards (Total Users, Active Wallets, etc.)
   - Should see "Credit User Wallet" button in top right

**⚠️ If admin login fails:**
- Check if admin user exists in database
- Run admin creation script if needed:
  ```bash
  cd backend
  node src/scripts/create-admin-user.js
  ```

---

## ✅ Step 4: Test Credit Wallet Feature

### From Admin Dashboard:

1. **Click "Credit User Wallet" button** (green button in header)

2. **Modal should open with:**
   - ✅ User selection dropdown
   - ✅ Currency selector (USD, EUR, LBP)
   - ✅ Amount input field
   - ✅ Preview section
   - ✅ Cancel and Credit buttons

3. **Test the form:**
   - Select a user from dropdown
   - Choose USD currency
   - Enter amount: `1000`
   - Verify preview shows: "Add 1,000 USD to [user email]"

4. **Click "Credit Wallet"**

**Expected Result:**
- ✅ Success toast notification appears
- ✅ Modal closes
- ✅ No errors in console

**⚠️ If it fails:**
- Check browser console (F12) for errors
- Check backend terminal for error logs
- Verify the endpoint exists: `POST http://localhost:4000/api/admin/credit-wallet`

---

## ✅ Step 5: Verify User Balance Updated

### Login as Regular User:

1. **Logout from admin** (click user menu → Logout)

2. **Login as the user you just credited**
   - Use the same email you selected in admin panel
   - Enter their password

3. **Go to User Dashboard:**
   - Navigate to `/wallet/dashboard`
   - Check the USD wallet balance

**Expected Result:**
- ✅ Should show $1,000.00 USD balance
- ✅ Card should display the amount correctly
- ✅ Total portfolio value should reflect the new balance

**⚠️ If balance is still 0:**
- Refresh the page (hard refresh: Ctrl+F5)
- Check backend logs for database update
- Verify wallet was created in database:
  ```sql
  SELECT * FROM wallets WHERE user_id = [USER_ID] AND currency_code = 'USD';
  ```

---

## ✅ Step 6: Test Transaction Updates Balance

### Perform a Send Transaction:

1. **From User Dashboard, click "Send Money"**

2. **Fill out the send form:**
   - Select source wallet: USD
   - Enter recipient wallet ID or email
   - Enter amount: `100`
   - Add optional note

3. **Submit the transaction**

**Expected Result:**
- ✅ Transaction succeeds
- ✅ Success message appears
- ✅ Balance immediately updates (no refresh needed)

4. **Verify new balance:**
   - Go back to dashboard
   - USD balance should now be $900.00 (1000 - 100)

**⚠️ If balance doesn't update:**
- Refresh the page manually
- Check transaction was created in database
- Check wallet balance in database was updated

---

## ✅ Step 7: Test Multiple Currencies

### Credit Different Currencies:

1. **Login as admin again**

2. **Credit the same user:**
   - 500 EUR
   - 1,000,000 LBP

3. **Login as user and verify:**
   - Dashboard should show all three currencies
   - USD: $900.00 (from previous test)
   - EUR: €500.00
   - LBP: 1,000,000 ل.ل

**Expected Result:**
- ✅ All three currency cards visible
- ✅ Each shows correct balance
- ✅ Total portfolio value calculated correctly

---

## ✅ Step 8: Test Exchange Transaction

### Exchange Currency:

1. **From User Dashboard, click "Exchange"**

2. **Fill exchange form:**
   - From: USD ($900)
   - To: EUR
   - Amount: $100

3. **Submit exchange**

**Expected Result:**
- ✅ USD balance decreases by $100 (now $800)
- ✅ EUR balance increases by ~€92 (depending on exchange rate)
- ✅ Transaction appears in Recent Transactions
- ✅ Analytics tab shows the exchange

---

## ✅ Step 9: Test Refresh Functionality

### Test Data Persistence:

1. **Note current balances**

2. **Refresh the page (F5)**

**Expected Result:**
- ✅ Balances remain the same (not reset to 0)
- ✅ Transactions still visible
- ✅ No data loss

3. **Close browser completely**

4. **Open again and login**

**Expected Result:**
- ✅ All balances persisted
- ✅ All transactions visible
- ✅ Data stored in database correctly

---

## 🔍 API Endpoint Tests (Optional)

### Test with cURL or Postman:

#### 1. Get User Balances
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:4000/api/wallets/balances
```

**Expected:** JSON with all wallet balances

#### 2. Credit Wallet (Admin)
```bash
curl -X POST \
     -H "Authorization: Bearer ADMIN_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"userId": 2, "currency": "USD", "amount": 500}' \
     http://localhost:4000/api/admin/credit-wallet
```

**Expected:** Success message with new balance

#### 3. Get Transactions
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:4000/api/transactions/my
```

**Expected:** Array of transactions

---

## 🐛 Common Issues & Solutions

### Issue 1: "Unauthorized" Error
**Solution:**
- Clear localStorage
- Login again
- Check JWT token is valid

### Issue 2: Users Not Loading in Dropdown
**Solution:**
- Check `/api/admin/users` endpoint works
- Verify admin middleware allows access
- Check database has users

### Issue 3: Balance Shows $0 After Crediting
**Solution:**
- Check database directly:
  ```sql
  SELECT * FROM wallets WHERE user_id = X;
  ```
- Verify API response includes new balance
- Hard refresh browser (Ctrl+Shift+R)

### Issue 4: Toast Notifications Not Showing
**Solution:**
- Check console for errors
- Verify `Toaster` component in layout
- Check `sonner` package is installed

### Issue 5: Modal Doesn't Open
**Solution:**
- Check Dialog component is imported
- Check for JavaScript errors in console
- Verify UI components are installed

---

## 📊 Database Verification Queries

### Check Wallet Balances:
```sql
SELECT u.email, w.currency_code, w.balance 
FROM wallets w 
JOIN users u ON w.user_id = u.id 
ORDER BY u.email, w.currency_code;
```

### Check Recent Transactions:
```sql
SELECT t.*, u.email 
FROM transactions t 
JOIN users u ON t.user_id = u.id 
ORDER BY t.created_at DESC 
LIMIT 10;
```

### Check Admin Users:
```sql
SELECT id, email, role, is_active 
FROM users 
WHERE role = 'admin';
```

---

## ✨ Demo Script for Presentation

### 1. Introduction (30 seconds)
"This is a multi-currency wallet application with dynamic balance management. All data is stored in MySQL and updated in real-time."

### 2. Show Admin Panel (1 minute)
- Login as admin
- Show dashboard stats
- Open "Credit User Wallet" modal
- Explain: "For testing and demos, admin can add fake money"
- Credit $1,000 to a user
- Show success notification

### 3. Show User Dashboard (1 minute)
- Logout and login as regular user
- Show the $1,000 balance
- Explain: "Balance comes from database, not hardcoded"
- Point out the professional UI

### 4. Perform Transaction (1 minute)
- Send $200 to another user
- Show balance immediately updates to $800
- Refresh page to prove it persists
- Show transaction in history

### 5. Show Code (1 minute)
- Open `transactionService.js`
- Show database UPDATE queries
- Open `balances/route.js`
- Show zero initial balance (not hardcoded)
- Open admin controller
- Show credit wallet function

### 6. Conclusion (30 seconds)
"This demonstrates full-stack development: React frontend, Node.js backend, MySQL database, proper authentication, and real-time updates. Everything is production-ready with error handling, validation, and security."

---

## 🎬 Final Pre-Demo Checklist

- [ ] Backend server running without errors
- [ ] Frontend server running without errors
- [ ] Admin login works
- [ ] "Credit User Wallet" button visible
- [ ] Can open credit wallet modal
- [ ] Can select users from dropdown
- [ ] Can credit wallet successfully
- [ ] User balance updates correctly
- [ ] Transactions work and update balance
- [ ] Balance persists after refresh
- [ ] Toast notifications work
- [ ] No console errors
- [ ] Database has sample data
- [ ] All currencies show correctly

---

## 🚀 Quick Reset for Multiple Demos

If you need to reset for multiple demonstrations:

```sql
-- Reset all non-admin user balances to 0
UPDATE wallets 
SET balance = 0 
WHERE user_id IN (SELECT id FROM users WHERE role != 'admin');

-- Delete all transactions (optional)
-- DELETE FROM transactions;

-- This allows you to demo the "Credit Wallet" feature fresh each time
```

---

**You're ready! Good luck with your presentation! 🎉**
