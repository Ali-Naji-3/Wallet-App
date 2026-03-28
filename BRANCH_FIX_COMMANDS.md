# 🔧 Branch Fix Commands — f1 & main

> **Scope:** All operations are limited to `f1` and `main` branches only.  
> **Data Safety:** No data, files, or commits will be deleted or altered.

---

## 📋 Current State (Verified)

| Item | Detail |
|---|---|
| **Active branch** | `main` |
| **Branches in scope** | `f1`, `main` |
| **`f1` ahead of `main` by** | Several commits (features: new UI, card, dash, etc.) |
| **`main` ahead of `f1` by** | Several commits (support feature, email, security APIs) |
| **Working tree** | Clean — no uncommitted changes |

### What `f1` has that `main` does NOT:
- New feature commits (`new`, `new feature`, `f21`, `f1`, `dash`, `card`)
- These are **already committed** in `f1`

### What `main` has that `f1` does NOT:
- Support feature (user/admin support pages + APIs)
- Email configuration & Nodemailer setup
- KYC email feature
- Security APIs (change-password, security-logs, etc.)
- Profile & settings pages updates

---

## 🎯 Goal

Bring `main` fully up to date by **merging `f1` features into `main`**, so that `main` contains everything from both branches — without losing any data.

---

## ✅ Step-by-Step Fix

### Step 1 — Verify Starting State
```bash
cd /home/naji/Documents/Wallet-App

# Confirm current branch and clean status
git status
git branch
```
**Expected:** `On branch main`, clean working tree.

---

### Step 2 — Check What f1 Brings In
```bash
# See commits in f1 that are NOT yet in main
git log main..f1 --oneline
```
This shows exactly what will be merged — review before proceeding.

---

### Step 3 — Merge f1 into main
```bash
# Stay on main and merge f1 in
git checkout main
git merge f1 -m "merge: Integrate f1 features into main"
```

> **If a conflict occurs**, Git will pause and list the conflicting files.  
> See the **Conflict Resolution** section below before continuing.

---

### Step 4 — Verify Merge Success
```bash
# Confirm both branches now share the same tip
git log --oneline -8

# Confirm no pending changes
git status

# Check key files exist from both branches
git ls-files | grep support | head -10
git ls-files | grep wallet | head -10
```

---

### Step 5 — Push Updated main to Remote
```bash
git push origin main
```

---

### Step 6 — Sync f1 with the Updated main (Optional but Clean)
```bash
git checkout f1
git merge main -m "sync: Bring f1 up to date with main"
git push origin f1
git checkout main
```
This ensures `f1` and `main` are fully in sync going forward.

---

### Step 7 — Restart Dev Server
```bash
# Terminal 1 — Next.js frontend
cd /home/naji/Documents/Wallet-App/backend/next
npm run dev

# Terminal 2 — Express backend
cd /home/naji/Documents/Wallet-App/backend
npm run dev
```

---

## ⚠️ Conflict Resolution

If Step 3 produces conflicts:

```bash
# See which files have conflicts
git status

# Open each conflicted file, resolve the <<<<< ===== >>>>> markers manually
# Then mark as resolved:
git add <resolved-file>

# Once all conflicts are resolved, complete the merge:
git commit -m "merge: Integrate f1 features into main (conflicts resolved)"
```

> **Rule:** Never use `git merge --abort` unless you want to fully cancel — it does NOT lose data, it just cancels the merge attempt.

---

## 🔍 Verification Checklist

Run these after the merge to confirm everything is working:

```bash
# 1. Git history is clean
git log --oneline -10

# 2. Both branches point to same or compatible commits
git log --oneline f1 -3
git log --oneline main -3

# 3. Support routes accessible
curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/wallet/support
curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/admin/support

# 4. Key files present
ls backend/next/app/wallet/support/page.jsx
ls backend/next/app/admin/support/page.jsx
ls backend/next/lib/email.js
```

---

## 📝 Summary

| Step | Action | Branch |
|---|---|---|
| 1 | Verify clean state | `main` |
| 2 | Inspect f1 commits | — |
| 3 | Merge `f1` → `main` | `main` |
| 4 | Verify merge | `main` |
| 5 | Push to remote | `origin/main` |
| 6 | Sync `f1` with `main` *(optional)* | `f1` |
| 7 | Restart dev servers | — |

**All data is preserved throughout. No commits, files, or history are removed.**
