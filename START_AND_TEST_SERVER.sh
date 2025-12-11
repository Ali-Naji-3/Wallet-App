#!/bin/bash
# Start Next.js Server on Port 4000 and Test Support API

set -e

echo "🚀 Starting Next.js Server and Testing Support API"
echo "=================================================="
echo ""

cd /home/naji/Documents/Wallet-App/backend/next

# Step 1: Check if port 4000 is in use
echo "📋 Step 1: Checking port 4000..."
PORT_PID=$(lsof -ti:4000 2>/dev/null || echo "")

if [ -n "$PORT_PID" ]; then
    echo "⚠️  Port 4000 is already in use by process: $PORT_PID"
    echo "   Process details:"
    ps -p $PORT_PID -o pid,cmd --no-headers 2>/dev/null || echo "   (Process details unavailable)"
    echo ""
    read -p "   Kill this process and start new server? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "   Stopping process $PORT_PID..."
        kill $PORT_PID 2>/dev/null || kill -9 $PORT_PID 2>/dev/null
        sleep 2
        echo "   ✅ Process stopped"
    else
        echo "   ❌ Aborting - port 4000 is in use"
        exit 1
    fi
else
    echo "   ✅ Port 4000 is free"
fi

# Step 2: Check for existing Next.js processes
echo ""
echo "📋 Step 2: Checking for existing Next.js processes..."
EXISTING_PROCESSES=$(ps aux | grep -E "[n]ext dev" | grep -v grep | wc -l)
if [ "$EXISTING_PROCESSES" -gt 0 ]; then
    echo "   ⚠️  Found $EXISTING_PROCESSES Next.js process(es)"
    echo "   Stopping existing processes..."
    pkill -f "next dev" 2>/dev/null || true
    sleep 2
    echo "   ✅ Existing processes stopped"
else
    echo "   ✅ No existing Next.js processes found"
fi

# Step 3: Verify nodemailer is installed
echo ""
echo "📋 Step 3: Verifying nodemailer installation..."
if npm list nodemailer > /dev/null 2>&1; then
    NODEMAILER_VERSION=$(npm list nodemailer 2>/dev/null | grep nodemailer | awk '{print $NF}' | tr -d '└─')
    echo "   ✅ Nodemailer installed: $NODEMAILER_VERSION"
else
    echo "   ❌ Nodemailer not found - installing..."
    npm install nodemailer
    echo "   ✅ Nodemailer installed"
fi

# Step 4: Check SMTP configuration
echo ""
echo "📋 Step 4: Checking SMTP configuration..."
if [ -f ".env.local" ]; then
    if grep -q "SMTP_USER=" .env.local && grep -q "SMTP_PASS=" .env.local; then
        SMTP_USER=$(grep "^SMTP_USER=" .env.local | cut -d'=' -f2)
        echo "   ✅ SMTP configured for: $SMTP_USER"
    else
        echo "   ⚠️  SMTP credentials not found in .env.local"
        echo "   Email sending will be disabled"
    fi
else
    echo "   ⚠️  .env.local file not found"
    echo "   Email sending will be disabled"
fi

# Step 5: Start the server
echo ""
echo "📋 Step 5: Starting Next.js server on port 4000..."
echo "   Command: npm run dev"
echo ""

# Start server in background
npm run dev > /tmp/nextjs-server.log 2>&1 &
SERVER_PID=$!

echo "   Server starting (PID: $SERVER_PID)"
echo "   Logs: /tmp/nextjs-server.log"

# Wait for server to start
echo "   ⏳ Waiting for server to start..."
for i in {1..30}; do
    if curl -s http://localhost:4000/api/health > /dev/null 2>&1; then
        echo "   ✅ Server is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "   ❌ Server failed to start after 30 seconds"
        echo "   Check logs: tail -f /tmp/nextjs-server.log"
        exit 1
    fi
    sleep 1
    echo -n "."
done
echo ""

# Step 6: Test Support API
echo ""
echo "📋 Step 6: Testing Support API endpoint..."
echo "   Endpoint: POST http://localhost:4000/api/support/submit"
echo ""

TEST_PAYLOAD='{
  "email": "test@example.com",
  "subject": "Test Support Request",
  "message": "This is a test message to verify email sending works."
}'

echo "   Request payload:"
echo "$TEST_PAYLOAD" | jq '.' 2>/dev/null || echo "$TEST_PAYLOAD"
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:4000/api/support/submit \
  -H "Content-Type: application/json" \
  -d "$TEST_PAYLOAD" 2>&1)

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "   Response (HTTP $HTTP_CODE):"
echo "   ============================="
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

# Step 7: Analyze response
echo "📋 Step 7: Analyzing response..."
if echo "$BODY" | grep -q '"success":true'; then
    echo "   ✅ Support request submitted successfully"
    
    if echo "$BODY" | grep -q '"email_sent":true'; then
        echo "   ✅ Email notification sent successfully"
    elif echo "$BODY" | grep -q '"email_sent":false'; then
        EMAIL_ERROR=$(echo "$BODY" | jq -r '.email_error // "Unknown error"' 2>/dev/null || echo "Email service not configured")
        echo "   ⚠️  Email not sent: $EMAIL_ERROR"
        echo ""
        echo "   💡 To enable email sending:"
        echo "      1. Add SMTP credentials to .env.local:"
        echo "         SMTP_HOST=smtp.gmail.com"
        echo "         SMTP_PORT=587"
        echo "         SMTP_SECURE=false"
        echo "         SMTP_USER=your-email@gmail.com"
        echo "         SMTP_PASS=your-app-password"
        echo "      2. Restart the server"
    fi
    
    TICKET_ID=$(echo "$BODY" | jq -r '.ticket_id // "N/A"' 2>/dev/null || echo "N/A")
    echo "   📝 Ticket ID: $TICKET_ID"
else
    echo "   ❌ Support request failed"
    echo "   Check server logs: tail -f /tmp/nextjs-server.log"
fi

# Summary
echo ""
echo "=================================================="
echo "✅ Summary"
echo "=================================================="
echo "Server Status: ✅ Running on port 4000 (PID: $SERVER_PID)"
echo "API Endpoint: ✅ http://localhost:4000/api/support/submit"
echo "Server Logs: 📋 tail -f /tmp/nextjs-server.log"
echo "Stop Server: 🛑 kill $SERVER_PID"
echo ""
echo "🌐 Support Page: http://localhost:4000/wallet/support"
echo "🔧 Admin Support: http://localhost:4000/admin/support"
echo ""

