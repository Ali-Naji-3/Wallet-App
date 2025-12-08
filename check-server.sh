#!/bin/bash

echo "=== Checking Backend Server Status ==="
echo ""

# Check if Next.js server is running on port 3000
echo "1. Checking Next.js server (port 3000)..."
if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "   ✅ Next.js server is running!"
    echo "   Health check response:"
    curl -s http://localhost:3000/api/health | python3 -m json.tool 2>/dev/null || curl -s http://localhost:3000/api/health
else
    echo "   ❌ Next.js server is NOT running on port 3000"
    echo "   Start it with: cd backend && npm run next:dev"
fi

echo ""
echo "2. Checking Express server (port 5001)..."
if curl -s http://localhost:5001 > /dev/null 2>&1; then
    echo "   ✅ Express server is running!"
    curl -s http://localhost:5001
else
    echo "   ❌ Express server is NOT running on port 5001"
    echo "   Start it with: cd backend && npm run dev"
fi

echo ""
echo "=== Checking Dependencies ==="
echo ""

# Check backend dependencies
echo "3. Checking backend dependencies..."
if [ -d "backend/node_modules" ]; then
    echo "   ✅ Backend node_modules exists"
else
    echo "   ❌ Backend dependencies not installed"
    echo "   Install with: cd backend && npm install"
fi

# Check Next.js dependencies
echo "4. Checking Next.js dependencies..."
if [ -d "backend/next/node_modules" ]; then
    echo "   ✅ Next.js node_modules exists"
else
    echo "   ❌ Next.js dependencies not installed"
    echo "   Install with: cd backend/next && npm install"
fi

# Check frontend dependencies
echo "5. Checking frontend dependencies..."
if [ -d "frontend/node_modules" ]; then
    echo "   ✅ Frontend node_modules exists"
else
    echo "   ❌ Frontend dependencies not installed"
    echo "   Install with: cd frontend && npm install"
fi

echo ""
echo "=== Port Status ==="
echo "6. Checking which ports are in use..."
if command -v lsof > /dev/null 2>&1; then
    echo "   Port 3000:"
    lsof -i :3000 2>/dev/null || echo "      Not in use"
    echo "   Port 5001:"
    lsof -i :5001 2>/dev/null || echo "      Not in use"
    echo "   Port 5173 (Vite frontend):"
    lsof -i :5173 2>/dev/null || echo "      Not in use"
elif command -v netstat > /dev/null 2>&1; then
    echo "   Port 3000:"
    netstat -tuln 2>/dev/null | grep :3000 || echo "      Not in use"
    echo "   Port 5001:"
    netstat -tuln 2>/dev/null | grep :5001 || echo "      Not in use"
    echo "   Port 5173:"
    netstat -tuln 2>/dev/null | grep :5173 || echo "      Not in use"
else
    echo "   (lsof/netstat not available for port checking)"
fi

echo ""
echo "=== Quick Start Commands ==="
echo "To start Next.js backend:  cd backend && npm run next:dev"
echo "To start Express backend:  cd backend && npm run dev"
echo "To start frontend:         cd frontend && npm run dev"

