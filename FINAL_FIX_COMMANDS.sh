#!/bin/bash
# Final Fix Commands - Support Feature Restoration
# Run this script to restore support feature across branches

set -e  # Exit on error

echo "🔧 Fixing Support Feature Branch Issues..."
echo ""

cd /home/naji/Documents/Wallet-App

# Step 1: Verify we're on r2 branch
CURRENT_BRANCH=$(git branch --show-current)
echo "📍 Current branch: $CURRENT_BRANCH"

if [ "$CURRENT_BRANCH" != "r2" ]; then
    echo "⚠️  Warning: Not on r2 branch. Switching to r2..."
    git checkout r2
fi

# Step 2: Check if files need to be committed
if git diff --cached --quiet; then
    echo "✅ All support files are already committed"
else
    echo "📝 Committing support files..."
    git add backend/next/app/wallet/support/ \
            backend/next/app/api/support/ \
            backend/next/app/admin/support/ \
            backend/next/app/api/admin/support/ \
            backend/next/lib/email.js
    
    git commit -m "feat: Add support feature - user support page, admin support management, and email notifications"
    echo "✅ Support files committed to r2"
fi

# Step 3: Merge to main branch
echo ""
echo "🔄 Merging support feature to main branch..."
git checkout main
git merge r2 -m "Merge support feature from r2" || {
    echo "⚠️  Merge conflict detected. Resolving..."
    # If merge conflict, abort and show status
    git merge --abort 2>/dev/null || true
    echo "❌ Merge failed. Please resolve conflicts manually."
    echo "   Run: git checkout main && git merge r2"
    exit 1
}
echo "✅ Merged to main branch"

# Step 4: Switch back to r2
git checkout r2
echo "✅ Switched back to r2 branch"

# Step 5: Verify files exist
echo ""
echo "🔍 Verifying files..."
FILES=(
    "backend/next/app/wallet/support/page.jsx"
    "backend/next/app/api/support/submit/route.js"
    "backend/next/app/admin/support/page.jsx"
    "backend/next/lib/email.js"
)

ALL_EXIST=true
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ $file (missing)"
        ALL_EXIST=false
    fi
done

if [ "$ALL_EXIST" = true ]; then
    echo ""
    echo "✅ All support files are present!"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Restart Next.js dev server:"
    echo "   cd backend/next && npm run dev"
    echo ""
    echo "2. Test support page:"
    echo "   http://localhost:4000/wallet/support"
    echo ""
    echo "3. Test admin support page:"
    echo "   http://localhost:4000/admin/support"
else
    echo ""
    echo "❌ Some files are missing. Please check the file paths."
fi

echo ""
echo "🎉 Fix complete!"

