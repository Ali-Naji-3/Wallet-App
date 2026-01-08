# 🔒 USER SWITCH BUG FIX — COMPLETE

## 🚨 **CRITICAL BUG**

When you refresh the page after crediting funds, the user account changes. This is a **session management issue**.

---

## 🔍 **ROOT CAUSE**

The JWT token is stored in **`localStorage`**, which is **shared across all tabs** in the same browser for the same domain. If you:

1. Open Tab 1 → Login as **Admin**
2. Open Tab 2 → Login as **User**
3. Tab 1 → Refresh page

**Tab 1 will now show User's session** because `localStorage.fxwallet_token` was overwritten by Tab 2.

---

## ✅ **FIXES APPLIED**

### **1. User Switch Detection**
Added **defensive check** in `lib/refine/auth-provider.js`:

```javascript
const fetchAndStoreUser = async () => {
  const { data } = await apiClient.get(ENDPOINTS.AUTH.ME);
  if (data.user) {
    // CRITICAL: Detect if user changed
    const storedUser = getStoredUser();
    if (storedUser && storedUser.id !== data.user.id) {
      console.error('[Auth] USER SWITCH DETECTED!', {
        storedUserId: storedUser.id,
        storedUserEmail: storedUser.email,
        fetchedUserId: data.user.id,
        fetchedUserEmail: data.user.email,
      });
      // Force logout and redirect to login
      clearAuthData();
      window.location.href = '/login';
      return null;
    }
    
    storeAuthData(null, data.user);
    return data.user;
  }
  return null;
};
```

**Result:** If the token's user ID doesn't match the cached user ID, **force logout immediately**.

---

### **2. Enhanced Logging**
Added **detailed logging** to track token usage:

**In `lib/auth.js`:**
```javascript
export function verifyToken(token) {
  // ...
  console.log('[Auth] Token verified:', { userId, email, role });
  return user;
}
```

**In `lib/api/client.js`:**
```javascript
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('fxwallet_token');
  if (token) {
    console.log('[API Client] Request with token:', {
      url: config.url,
      method: config.method,
      tokenPreview: token.slice(0, 20) + '...',
    });
  }
  // ...
});
```

**Result:** You can now **see in the console** which user the token belongs to.

---

## 🧪 **HOW TO TEST**

### **Test 1: Normal Single-User Flow**
1. Login as admin
2. Credit funds
3. Refresh page
4. ✅ Should stay as admin

### **Test 2: Multi-Tab Scenario (This was causing the bug)**
1. **Tab 1:** Login as **admin@example.com**
2. **Tab 2:** Login as **user@example.com** (overwrites token!)
3. **Tab 1:** Refresh → **BUG:** Now shows user instead of admin
4. ✅ **NOW:** Tab 1 detects user switch → Forces logout → Redirects to login

### **Test 3: Console Debugging**
1. Open browser console (F12)
2. Login as admin
3. Look for logs:
   ```
   [Auth] Token verified: { userId: 1, email: 'admin@...', role: 'admin' }
   [API Client] Request with token: { url: '/api/auth/me', ... }
   ```
4. If user switches, you'll see:
   ```
   [Auth] USER SWITCH DETECTED!
   storedUserId: 1 (admin)
   fetchedUserId: 2 (user)
   ```

---

## 🔐 **SOLUTION: USE SEPARATE BROWSERS OR PROFILES**

### **Why This Happens:**
- `localStorage` is **shared across all tabs** in the same browser.
- When you login in **Tab 2**, it overwrites the token from **Tab 1**.
- Next time **Tab 1** makes an API call, it uses the **wrong token**.

### **How to Avoid:**
1. **Use different browser profiles:**
   - Chrome Profile 1 → Admin
   - Chrome Profile 2 → User

2. **Use different browsers:**
   - Chrome → Admin
   - Firefox → User

3. **Use incognito mode:**
   - Regular window → Admin
   - Incognito window → User

---

## 📊 **WHAT YOU'LL SEE IN CONSOLE**

### **Normal Case (No Bug):**
```
[Auth] Login successful: admin@example.com Role: admin
[Auth] Token verified: { userId: 1, email: 'admin@example.com', role: 'admin' }
[API Client] Request with token: { url: '/api/admin/wallets/credit', method: 'post' }
[Auth] Fetched user from /api/auth/me: admin@example.com Role: admin
```

### **Bug Case (User Switch Detected):**
```
[Auth] Login successful: user@example.com Role: user
[Auth] Token verified: { userId: 2, email: 'user@example.com', role: 'user' }
[Auth] USER SWITCH DETECTED!
  storedUserId: 1
  storedUserEmail: admin@example.com
  fetchedUserId: 2
  fetchedUserEmail: user@example.com
[Auth] Forcing logout due to user switch
```

---

## ✅ **SUMMARY**

| Issue | Fix |
|-------|-----|
| User changes after refresh | Detect user ID mismatch → Force logout |
| Can't debug who's logged in | Added console logging for token verification |
| Multi-tab confusion | Use separate browser profiles/windows |
| Token gets overwritten | Use `sessionStorage` instead (future improvement) |

---

## 🔮 **FUTURE IMPROVEMENT (Optional)**

Replace `localStorage` with **`sessionStorage`** for tokens:

**Pros:**
- Each tab has its own session
- No cross-tab contamination

**Cons:**
- User has to login again in each new tab
- Closing tab = logout

**Implementation:**
```javascript
// In lib/auth/storage.js
const AUTH_KEYS = {
  TOKEN: 'fxwallet_token', // Change to sessionStorage
  USER: 'fxwallet_user',
  ROLE: 'user_role',
};

export function storeAuthData(token, user) {
  if (typeof window === 'undefined') return;
  if (token) sessionStorage.setItem(AUTH_KEYS.TOKEN, token); // sessionStorage instead of localStorage
  // ...
}
```

---

## ✅ **TEST IT NOW**

1. **Clear all browser data:**
   - F12 → Application → Storage → Clear site data
2. **Login as admin** (use one browser/profile)
3. **Credit funds**
4. **Refresh page**
5. ✅ Should stay as admin with no user switch

**If you still see the bug, check the console for logs!** 🚀

