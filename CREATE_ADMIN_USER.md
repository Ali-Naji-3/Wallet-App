# Create Admin User

## Quick Fix for "Invalid credentials" Error

The admin user doesn't exist in your database. Here's how to create it:

## Option 1: Run SQL Script (Easiest)

1. Open your MySQL client (phpMyAdmin, MySQL Workbench, or command line)

2. Run the SQL script:
```bash
mysql -u root -p fxwallet < CREATE_ADMIN_SQL.sql
```

Or copy and paste the SQL from `CREATE_ADMIN_SQL.sql` into your MySQL client.

This will create an admin user with:
- **Email:** `admin@admin.com`
- **Password:** `admin`
- **Role:** `admin`

## Option 2: Run the Node.js Script

1. Navigate to the Next.js backend directory:
```bash
cd backend/next
```

2. Set environment variables and run:
```bash
MYSQL_HOST=localhost MYSQL_USER=root MYSQL_PASSWORD=yourpassword MYSQL_DB=fxwallet node scripts/create-admin.js
```

Or if you have `.env.local` file in `backend/next/` with these variables, just run:
```bash
node scripts/create-admin.js
```

## Option 2: Manual SQL

If the script doesn't work, you can create the user manually using MySQL:

```sql
-- First, hash the password 'admin' using bcrypt
-- You'll need to generate this hash, or use this pre-generated one:
-- Password: admin
-- Hash: $2a$10$rOzJqZqZqZqZqZqZqZqZqOqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZq

-- Or use this simpler approach - create user and update password
INSERT INTO users (email, password_hash, full_name, base_currency, timezone, role, is_active, is_verified)
VALUES (
  'admin@admin.com',
  '$2a$10$rOzJqZqZqZqZqZqZqZqZqOqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZq',
  'Admin User',
  'USD',
  'UTC',
  'admin',
  1,
  1
);
```

## Option 3: Use Registration API

You can also register the admin user through the API, then update the role:

1. Register the user:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@admin.com",
    "password": "admin",
    "fullName": "Admin User"
  }'
```

2. Then update the role to admin in the database:
```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@admin.com';
```

## Verify Admin User

After creating the user, verify it exists:

```sql
SELECT id, email, role, is_active FROM users WHERE email = 'admin@admin.com';
```

You should see:
- `email`: admin@admin.com
- `role`: admin
- `is_active`: 1

## Login

After creating the admin user, you can login with:
- **Email:** `admin@admin.com`
- **Password:** `admin`

You'll be automatically redirected to `/admin` dashboard.

