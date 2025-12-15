#!/bin/bash
# Stop all development servers before shutdown

echo "🛑 Stopping all development servers..."

# Stop backend server
pkill -f "node.*server.js" 2>/dev/null && echo "✅ Backend server stopped" || echo "ℹ️  Backend server not running"

# Stop Next.js dev server
pkill -f "next.*dev" 2>/dev/null && echo "✅ Next.js server stopped" || echo "ℹ️  Next.js server not running"

# Stop nodemon
pkill -f "nodemon" 2>/dev/null && echo "✅ Nodemon stopped" || echo "ℹ️  Nodemon not running"

# Wait a moment for processes to exit
sleep 1

# Check if any Node processes are still running
if pgrep -f "node.*server.js|next.*dev|nodemon" > /dev/null; then
    echo "⚠️  Some processes still running, forcing kill..."
    pkill -9 -f "node.*server.js"
    pkill -9 -f "next.*dev"
    pkill -9 -f "nodemon"
    sleep 1
fi

echo "✅ All development servers stopped. Safe to shutdown!"

