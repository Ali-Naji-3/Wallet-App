#!/bin/bash

# Card Management Feature Setup Script
# This script sets up the payment cards feature

echo "🚀 Setting up Card Management Feature..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if database credentials file exists
if [ ! -f "backend/.env" ]; then
    echo -e "${RED}❌ Error: backend/.env file not found${NC}"
    echo "Please create backend/.env file with database credentials"
    exit 1
fi

# Load database credentials from .env
source backend/.env

echo -e "${YELLOW}📊 Creating payment_cards table...${NC}"
echo ""

# Run the SQL script
mysql -u ${DB_USER:-root} -p${DB_PASSWORD} ${DB_NAME:-wallet_app} < backend/database/create-payment-cards-table.sql 2>&1

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Payment cards table created successfully!${NC}"
    echo ""
    echo -e "${GREEN}🎉 Card Management Feature is ready!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Start your Next.js server:"
    echo "   cd backend/next && npm run dev"
    echo ""
    echo "2. Navigate to: http://localhost:3000/wallet/dashboard"
    echo "3. Click 'Add Card' button to test the feature"
    echo ""
    echo "📖 Read CARD_MANAGEMENT_SETUP.md for complete documentation"
else
    echo ""
    echo -e "${RED}❌ Failed to create table${NC}"
    echo ""
    echo "Please run manually:"
    echo "mysql -u your_username -p wallet_app < backend/database/create-payment-cards-table.sql"
fi


