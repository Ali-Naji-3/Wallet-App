#!/bin/bash
# Quick Fix Script for Nodemailer Issue

set -e

echo "🔧 Fixing Nodemailer Module Not Found Issue..."
echo ""

cd /home/naji/Documents/Wallet-App/backend/next

# Step 1: Install nodemailer
echo "📦 Step 1: Installing nodemailer..."
npm install nodemailer

# Step 2: Verify installation
echo ""
echo "✅ Step 2: Verifying installation..."
if npm list nodemailer > /dev/null 2>&1; then
    echo "✅ Nodemailer installed successfully"
    npm list nodemailer | grep nodemailer
else
    echo "❌ Installation failed"
    exit 1
fi

# Step 3: Check .env.local
echo ""
echo "📝 Step 3: Checking .env.local configuration..."
if [ -f ".env.local" ]; then
    echo "✅ .env.local exists"
    if grep -q "SMTP_USER" .env.local && grep -q "SMTP_PASS" .env.local; then
        echo "✅ SMTP credentials found in .env.local"
    else
        echo "⚠️  SMTP credentials not found in .env.local"
        echo ""
        echo "Add these to .env.local:"
        echo "SMTP_HOST=smtp.gmail.com"
        echo "SMTP_PORT=587"
        echo "SMTP_SECURE=false"
        echo "SMTP_USER=your-email@gmail.com"
        echo "SMTP_PASS=your-app-password"
    fi
else
    echo "⚠️  .env.local not found"
    echo "Creating .env.local template..."
    cat > .env.local << 'EOF'
# SMTP Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Optional
SUPPORT_EMAIL=support@fxwallet.com
NEXT_PUBLIC_APP_URL=http://localhost:4000
EOF
    echo "✅ Created .env.local template"
    echo "⚠️  Please edit .env.local with your actual SMTP credentials"
fi

# Step 4: Test nodemailer import
echo ""
echo "🧪 Step 4: Testing nodemailer import..."
if node -e "import('nodemailer').then(() => console.log('✅ Nodemailer imports successfully')).catch(e => { console.error('❌ Import failed:', e.message); process.exit(1); })" 2>&1 | grep -q "✅"; then
    echo "✅ Nodemailer module can be imported"
else
    echo "❌ Nodemailer import test failed"
    exit 1
fi

echo ""
echo "✅ All checks passed!"
echo ""
echo "📋 Next Steps:"
echo "1. Edit .env.local with your SMTP credentials"
echo "2. Restart Next.js server: npm run dev"
echo "3. Test support API: curl -X POST http://localhost:4000/api/support/submit -H 'Content-Type: application/json' -d '{\"email\":\"test@test.com\",\"message\":\"test\"}'"
echo ""
echo "🎉 Fix complete!"

