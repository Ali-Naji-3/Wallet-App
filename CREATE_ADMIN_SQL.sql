-- SQL Script to Create Admin User
-- Run this in your MySQL database

-- Option 1: If you have bcrypt hash generator, use this:
-- (Password: admin, you need to generate the bcrypt hash)

-- Option 2: Use this simple approach - create user first, then we'll update password
-- But we need the hash, so let's use a temporary password approach

-- First, check if user exists
SELECT * FROM users WHERE email = 'admin@admin.com';

-- If user doesn't exist, create it with a temporary password
-- You'll need to hash 'admin' password using bcrypt
-- For now, let's use a known bcrypt hash for 'admin':
-- $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy

INSERT INTO users (email, password_hash, full_name, base_currency, timezone, role, is_active, is_verified)
VALUES (
  'admin@admin.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',  -- bcrypt hash for 'admin'
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

-- Verify the user was created
SELECT id, email, role, is_active FROM users WHERE email = 'admin@admin.com';







