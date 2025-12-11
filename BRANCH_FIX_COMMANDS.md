# 🔧 Branch Fix Commands - Support Feature Restoration

## 📋 Problem Analysis

**Current Situation:**
- You're on branch `r2`
- Support files exist on disk but are **staged (not committed)** to git
- Files are NOT in any branch's git history (main, r1, or r2)
- Status shows files as "A" (Added) but not committed
- Next.js build can't see them because they're not in git history

**Files Affected:**
- ✅ `backend/next/app/wallet/support/page.jsx` (exists on disk, staged)
- ✅ `backend/next/app/api/support/submit/route.js` (exists on disk, staged)
- ✅ `backend/next/app/admin/support/page.jsx` (exists on disk, staged)
- ✅ `backend/next/app/api/admin/support/send-verification/route.js` (exists on disk, staged)
- ✅ `backend/next/app/api/admin/support/save-request/route.js` (exists on disk, staged)
- ✅ `backend/next/lib/email.js` (exists on disk, staged)

---

## 🎯 Solution: Commit Files to Current Branch

Since files exist on disk and are staged, we need to:
1. Commit them to the current branch (r2)
2. Optionally merge to main if needed
3. Restart Next.js dev server to recognize the routes

---

## ✅ STEP-BY-STEP FIX COMMANDS

### Step 1: Check Current Status
```bash
cd /home/naji/Documents/Wallet-App
git status
```

### Step 2: Commit Support Files to r2 Branch
```bash
# Commit all support-related files
git add backend/next/app/wallet/support/page.jsx
git add backend/next/app/api/support/submit/route.js
git add backend/next/app/admin/support/page.jsx
git add backend/next/app/api/admin/support/send-verification/route.js
git add backend/next/app/api/admin/support/save-request/route.js
git add backend/next/app/api/admin/support/recent-emails/route.js
git add backend/next/app/api/admin/support/requests/route.js
git add backend/next/app/api/admin/support/search/route.js
git add backend/next/lib/email.js

# Commit with descriptive message
git commit -m "feat: Add support feature - user support page, admin support management, and email notifications"
```

### Step 3: Verify Files Are Committed
```bash
# Check that files are now in git history
git log --oneline -1
git ls-tree -r HEAD --name-only | grep support
```

### Step 4: Merge to Main Branch (Optional but Recommended)
```bash
# Switch to main branch
git checkout main

# Merge r2 into main
git merge r2 -m "Merge support feature from r2"

# Switch back to r2
git checkout r2
```

### Step 5: Restart Next.js Dev Server
```bash
# Stop current dev server (Ctrl+C if running)
# Then restart:
cd backend/next
npm run dev
```

### Step 6: Verify Support Page Works
```bash
# Test the support page route
curl http://localhost:4000/wallet/support

# Or open in browser:
# http://localhost:4000/wallet/support
```

---

## 🚀 QUICK FIX (All-in-One Commands)

If you want to do everything at once:

```bash
cd /home/naji/Documents/Wallet-App

# Commit all support files
git add backend/next/app/wallet/support/ \
        backend/next/app/api/support/ \
        backend/next/app/admin/support/ \
        backend/next/app/api/admin/support/ \
        backend/next/lib/email.js

git commit -m "feat: Add support feature - user support page, admin support management, and email notifications"

# Merge to main
git checkout main
git merge r2 -m "Merge support feature from r2"
git checkout r2

# Restart Next.js (in separate terminal)
cd backend/next && npm run dev
```

---

## 🔍 VERIFICATION COMMANDS

After running the fix, verify everything works:

```bash
# 1. Check files are in git
git ls-tree -r HEAD --name-only | grep -E "(support|email)" | head -10

# 2. Check files exist on disk
ls -la backend/next/app/wallet/support/page.jsx
ls -la backend/next/app/api/support/submit/route.js
ls -la backend/next/app/admin/support/page.jsx

# 3. Check Next.js can see the routes (after restart)
curl http://localhost:4000/wallet/support 2>&1 | head -5

# 4. Test API endpoint
curl -X POST http://localhost:4000/api/support/submit \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","message":"test"}' 2>&1 | head -10
```

---

## ⚠️ TROUBLESHOOTING

### If you get "files would be overwritten" error:
```bash
# Stash current changes first
git stash

# Then switch branches
git checkout main
git merge r2
git checkout r2

# Restore stashed changes
git stash pop
```

### If Next.js still can't see the routes:
1. **Clear Next.js cache:**
   ```bash
   cd backend/next
   rm -rf .next
   npm run dev
   ```

2. **Check Next.js routing:**
   - Ensure files are in correct location: `app/wallet/support/page.jsx`
   - Check for any routing middleware that might block it

3. **Verify file permissions:**
   ```bash
   ls -la backend/next/app/wallet/support/page.jsx
   ```

### If files are missing after commit:
```bash
# Check if files are tracked
git ls-files | grep support

# If not tracked, add them:
git add -f backend/next/app/wallet/support/page.jsx
git commit -m "Add missing support files"
```

---

## 📝 SUMMARY

**Root Cause:** Support files were created and staged but never committed to git, so they don't exist in any branch's history.

**Solution:** Commit the files to r2 branch, optionally merge to main, and restart Next.js server.

**Expected Result:** 
- ✅ Files committed to git
- ✅ Support page accessible at `/wallet/support`
- ✅ Admin support page accessible at `/admin/support`
- ✅ API endpoints working (`/api/support/submit`, etc.)

---

**Run these commands in order to fix the issue!**

