#!/bin/bash
# Clean restart script for Next.js to fix chunk loading errors

echo "🧹 Clearing Next.js cache..."
cd "$(dirname "$0")"
rm -rf .next

echo "🛑 Stopping Next.js (if running)..."
lsof -ti:4000 | xargs kill -9 2>/dev/null
sleep 2

echo "🚀 Starting Next.js with clean cache..."
PORT=4000 npm run dev

