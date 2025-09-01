#!/bin/bash
# check-system.sh - בדיקת מערכת

echo "🔍 Checking system health..."
echo ""

# Check Node.js
if command -v node &> /dev/null; then
    echo "✅ Node.js: $(node --version)"
else
    echo "❌ Node.js not found"
fi

# Check npm
if command -v npm &> /dev/null; then
    echo "✅ npm: $(npm --version)"
else
    echo "❌ npm not found"
fi

# Check Firebase CLI
if command -v firebase &> /dev/null; then
    echo "✅ Firebase CLI: $(firebase --version)"
else
    echo "❌ Firebase CLI not found"
fi

# Check Git
if command -v git &> /dev/null; then
    echo "✅ Git: $(git --version)"
else
    echo "❌ Git not found"
fi

# Check Python
if command -v python3 &> /dev/null; then
    echo "✅ Python: $(python3 --version)"
elif command -v python &> /dev/null; then
    echo "✅ Python: $(python --version)"
else
    echo "❌ Python not found"
fi

echo ""
echo "📁 Checking project files..."

# Check firebase.json
if [ -f "firebase.json" ]; then
    echo "✅ firebase.json exists"
else
    echo "❌ firebase.json missing"
fi

# Check functions
if [ -d "functions" ] && [ -f "functions/index.js" ]; then
    echo "✅ functions/index.js exists"
else
    echo "❌ functions/index.js missing"
fi

# Check public
if [ -d "public" ] && [ -f "public/index.html" ]; then
    echo "✅ public/index.html exists"
else
    echo "❌ public/index.html missing"
fi

# Check node_modules in functions
if [ -d "functions/node_modules" ]; then
    echo "✅ functions/node_modules exists"
else
    echo "⚠️  functions/node_modules missing - run: cd functions && npm install"
fi

echo ""
echo "🔐 Checking Firebase login..."
firebase projects:list --json > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Firebase authentication OK"
else
    echo "❌ Not logged in to Firebase - run: firebase login"
fi

echo ""
echo "✅ System check complete!"
