-- ============================================
-- QUICK ADMIN USER SETUP
-- ============================================
-- Copy and paste this entire script into your MySQL client
-- This will create admin@admin.com with password "admin"

-- Step 1: Check if user already exists (optional)
SELECT id, email, role, is_active FROM users WHERE email = 'admin@admin.com';

-- Step 2: Create or update admin user
INSERT INTO users (email, password_hash, full_name, base_currency, timezone, role, is_active, is_verified)
VALUES (
  'admin@admin.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',  -- bcrypt hash for password: admin
  'Admin User',
  'USD',
  'UTC',
  'admin',
  1,
  1
)
ON DUPLICATE KEY UPDATE
  role = 'admin',
  is_active = 1,
  is_verified = 1,
  password_hash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

-- Step 3: Verify the user was created/updated
SELECT id, email, role, is_active, is_verified FROM users WHERE email = 'admin@admin.com';

-- ============================================
-- ✅ DONE! You can now login with:
--    Email: admin@admin.com
--    Password: admin
-- ============================================




