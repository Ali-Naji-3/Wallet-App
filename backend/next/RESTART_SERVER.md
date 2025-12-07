# Fix for 404 Static Files Error

## Quick Fix

1. **Stop the current Next.js dev server** (Ctrl+C in the terminal)

2. **Clean the build cache:**
   ```bash
   cd backend/next
   rm -rf .next
   ```

3. **Restart the dev server:**
   ```bash
   PORT=4000 npm run dev
   ```

4. **Wait for the server to fully start** (you'll see "Ready" message)

5. **Refresh your browser** - the static files should now load correctly

## Alternative: Full Clean Rebuild

If the above doesn't work:

```bash
cd backend/next
rm -rf .next node_modules/.cache
npm run dev
```

The dev server will automatically rebuild all static assets on startup.

