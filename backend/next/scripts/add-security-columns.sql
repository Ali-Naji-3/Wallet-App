-- Add security-related columns to users table
-- Run this script if columns don't exist

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS two_factor_enabled TINYINT(1) DEFAULT 0,
ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(255) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS security_questions_set TINYINT(1) DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_password_change TIMESTAMP NULL DEFAULT NULL;

-- If MySQL doesn't support IF NOT EXISTS, use individual ALTER statements:
-- ALTER TABLE users ADD COLUMN two_factor_enabled TINYINT(1) DEFAULT 0;
-- ALTER TABLE users ADD COLUMN two_factor_secret VARCHAR(255) DEFAULT NULL;
-- ALTER TABLE users ADD COLUMN security_questions_set TINYINT(1) DEFAULT 0;
-- ALTER TABLE users ADD COLUMN last_password_change TIMESTAMP NULL DEFAULT NULL;

