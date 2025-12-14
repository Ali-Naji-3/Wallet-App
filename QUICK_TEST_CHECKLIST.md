# ⚡ Quick Test Checklist (5 Minutes)

## 🚀 Before Testing

```bash
# 1. Restart Next.js
cd "Wallet-App/backend/next"
npm run dev

# 2. Wait for: ✓ Ready on http://localhost:4000
```

---

## ✅ Test 1: Send Money (2 min)

1. Login: `majd@gmail.com`
2. Click **"Send Money"**
3. Enter recipient: `admin@admin.com`
4. Amount: `100` USD
5. Click **"Send Money"**

**✅ Expected:**
- Success toast appears
- Redirects to dashboard
- Balance decreased by 100
- Transaction in "Recent Transactions"

**❌ If Fails:**
- Check console for errors
- Verify `admin@admin.com` exists
- Ensure sufficient balance

---

## ✅ Test 2: Exchange Currency (1 min)

1. Click **"Exchange"**
2. From: USD → To: EUR
3. Amount: `50`
4. Click **"Exchange"**

**✅ Expected:**
- Success toast
- EUR card highlighted (green ring)
- EUR balance increased
- USD balance decreased

---

## ✅ Test 3: Admin Credit (Twice) (2 min)

1. Login as `admin@admin.com`
2. Click **"Credit User Wallet"**
3. Select user: `majd@gmail.com`
4. Currency: USD, Amount: `500`
5. Click **"Credit Wallet"** ✅

**REPEAT:**
6. Click **"Credit User Wallet"** again
7. Same user, Amount: `300`
8. Click **"Credit Wallet"** ✅

**✅ Expected:**
- Both succeed
- Total added: 800 USD
- No errors on second attempt

---

## ✅ Test 4: Add Card (30 sec)

1. Dashboard → Click **"Add Card"**
2. Select **"Virtual Card"**
3. Currency: USD
4. Name: `Test Card`
5. Click **"Submit Request"**

**✅ Expected:**
- Success toast
- Returns to dashboard

---

## ✅ Test 5: View Transactions (30 sec)

1. Dashboard → Check **"Recent Transactions"**
2. Should see your send/exchange
3. Click **"View All"**
4. Full transaction list appears

**✅ Expected:**
- Recent transactions show
- Full page loads with filters

---

## 🎯 All Working? ✅

If all 5 tests pass:
- ✅ Send money works
- ✅ Exchange works
- ✅ Admin credits work
- ✅ Add card works
- ✅ Transactions display

**You're ready for demo! 🎉**

---

## 🐛 Quick Debug

**404 Errors:**
```bash
# Restart Next.js
cd "Wallet-App/backend/next"
npm run dev
```

**500 Errors:**
```
Check server terminal for SQL errors
```

**Balance Not Updating:**
```
Hard refresh: Ctrl + Shift + R
```

---

## 📞 Need Help?

Check `/Wallet-App/FIXES_COMPLETE.md` for detailed debugging guide.
