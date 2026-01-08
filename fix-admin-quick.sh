#!/bin/bash

# ============================================
# Quick Admin Fix Script
# ============================================

echo "🔍 Admin User Quick Fix Script"
echo "================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Get database name from .env
echo "📁 Step 1: Finding database name..."
cd "$(dirname "$0")/backend"

if [ -f .env ]; then
    DB_NAME=$(grep MYSQL_DB .env | cut -d '=' -f2 | tr -d ' "'"'"'')
    DB_USER=$(grep MYSQL_USER .env | cut -d '=' -f2 | tr -d ' "'"'"'')
    DB_PASS=$(grep MYSQL_PASSWORD .env | cut -d '=' -f2 | tr -d ' "'"'"'')
    
    echo -e "${GREEN}✓${NC} Database: $DB_NAME"
    echo -e "${GREEN}✓${NC} User: $DB_USER"
else
    echo -e "${RED}✗${NC} .env file not found!"
    echo "Please create backend/.env file first"
    exit 1
fi

echo ""

# Step 2: Check current users
echo "👥 Step 2: Checking current users..."
echo ""

mysql -u "$DB_USER" -p"$DB_PASS" -e "
USE $DB_NAME;
SELECT id, email, role, is_active FROM users;
" 2>/dev/null

if [ $? -ne 0 ]; then
    echo -e "${RED}✗${NC} Failed to connect to database"
    echo "Please check your database credentials"
    exit 1
fi

echo ""

# Step 3: Fix admin user
echo "🔧 Step 3: Updating admin user role..."

mysql -u "$DB_USER" -p"$DB_PASS" -e "
USE $DB_NAME;
UPDATE users SET role = 'admin', is_active = 1 WHERE email = 'admin@admin.com';
" 2>/dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Admin role updated successfully"
else
    echo -e "${YELLOW}⚠${NC} Update may have failed or user doesn't exist"
fi

echo ""

# Step 4: Verify admin user
echo "✅ Step 4: Verifying admin user..."
echo ""

ADMIN_COUNT=$(mysql -u "$DB_USER" -p"$DB_PASS" -se "
USE $DB_NAME;
SELECT COUNT(*) FROM users WHERE role = 'admin' AND email = 'admin@admin.com';
" 2>/dev/null)

if [ "$ADMIN_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓✓✓ SUCCESS! Admin user exists${NC}"
    echo ""
    mysql -u "$DB_USER" -p"$DB_PASS" -e "
    USE $DB_NAME;
    SELECT id, email, role, is_active FROM users WHERE role = 'admin';
    " 2>/dev/null
else
    echo -e "${RED}✗ No admin user found!${NC}"
    echo ""
    echo "Creating admin user..."
    
    # Generate password hash
    cd "$(dirname "$0")/backend"
    HASH=$(node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('admin123', 10));")
    
    mysql -u "$DB_USER" -p"$DB_PASS" -e "
    USE $DB_NAME;
    INSERT INTO users (email, password_hash, full_name, role, is_verified, is_active, base_currency, timezone)
    VALUES ('admin@admin.com', '$HASH', 'Admin User', 'admin', 1, 1, 'USD', 'UTC');
    " 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Admin user created successfully!${NC}"
        echo ""
        echo "Credentials:"
        echo "  Email: admin@admin.com"
        echo "  Password: admin123"
    else
        echo -e "${RED}✗ Failed to create admin user${NC}"
    fi
fi

echo ""
echo "================================"
echo "🎉 Done!"
echo ""
echo "Next steps:"
echo "1. Restart your backend server (Ctrl+C and npm run dev)"
echo "2. Clear browser cache (localStorage.clear() in console)"
echo "3. Login again with: admin@admin.com / admin123"
echo ""

