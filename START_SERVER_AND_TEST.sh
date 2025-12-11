#!/bin/bash
# Start Next.js Server and Test Support API

set -e

echo "🚀 Starting Next.js Development Server..."
echo ""

cd /home/naji/Documents/Wallet-App/backend/next

# Check if server is already running
if lsof -ti:4000 > /dev/null 2>&1; then
    echo "⚠️  Server is already running on port 4000"
    echo "   Stopping existing server..."
    kill $(lsof -ti:4000) 2>/dev/null || true
    sleep 2
fi

# Start the server in background
echo "📦 Starting Next.js server on port 4000..."
npm run dev > /tmp/nextjs-server.log 2>&1 &
SERVER_PID=$!

echo "⏳ Waiting for server to start..."
sleep 5

# Check if server started successfully
if lsof -ti:4000 > /dev/null 2>&1; then
    echo "✅ Server started successfully (PID: $SERVER_PID)"
    echo ""
    echo "🧪 Testing Support API endpoint..."
    echo ""
    
    # Test the API
    curl -X POST http://localhost:4000/api/support/submit \
      -H "Content-Type: application/json" \
      -d '{
        "email": "test@example.com",
        "subject": "Test Support Request",
        "message": "This is a test message to verify email sending works."
      }' 2>&1 | jq '.' 2>/dev/null || curl -X POST http://localhost:4000/api/support/submit \
      -H "Content-Type: application/json" \
      -d '{
        "email": "test@example.com",
        "subject": "Test Support Request",
        "message": "This is a test message to verify email sending works."
      }'
    
    echo ""
    echo ""
    echo "✅ Server is running!"
    echo "📋 Server logs: tail -f /tmp/nextjs-server.log"
    echo "🛑 Stop server: kill $SERVER_PID"
    echo ""
    echo "🌐 Support Page: http://localhost:4000/wallet/support"
    echo "🔧 Admin Support: http://localhost:4000/admin/support"
else
    echo "❌ Server failed to start"
    echo "📋 Check logs: cat /tmp/nextjs-server.log"
    exit 1
fi

