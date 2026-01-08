-- ============================================
-- FIX ADMIN USER - SQL Script
-- ============================================
-- This script will:
-- 1. Check if admin user exists
-- 2. Update existing user to admin role
-- 3. Or create new admin user if needed
-- ============================================

-- STEP 1: Check current users
SELECT 'Current Users:' as info;
SELECT id, email, role, is_active FROM users;

-- STEP 2: Update existing user to admin (if exists)
-- Replace 'admin@admin.com' with your email if different
UPDATE users 
SET role = 'admin', is_active = 1 
WHERE email = 'admin@admin.com';

-- STEP 3: Verify admin user
SELECT 'Admin Users After Update:' as info;
SELECT id, email, role, is_active FROM users WHERE role = 'admin';

-- STEP 4: If no admin exists, create one
-- NOTE: You need to replace 'YOUR_BCRYPT_HASH_HERE' with actual hash
-- Generate hash using: node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('admin123', 10));"

-- Uncomment below if you need to create new admin user:
/*
INSERT INTO users (email, password_hash, full_name, role, is_verified, is_active, base_currency, timezone)
VALUES (
  'admin@admin.com',
  'YOUR_BCRYPT_HASH_HERE',  -- Replace this!
  'Admin User',
  'admin',
  1,
  1,
  'USD',
  'UTC'
);
*/

-- STEP 5: Final verification
SELECT 'Final Check - All Admin Users:' as info;
SELECT id, email, full_name, role, is_active, created_at FROM users WHERE role = 'admin';

-- STEP 6: Check if users have wallets
SELECT 'Users with Wallets:' as info;
SELECT u.id, u.email, COUNT(w.id) as wallet_count
FROM users u
LEFT JOIN wallets w ON u.id = w.user_id
GROUP BY u.id, u.email
ORDER BY u.id;

