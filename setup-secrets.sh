#!/bin/bash
# setup-secrets.sh - הגדרת secrets לפיתוח מקומי

echo "🔐 Setting up Firebase Functions secrets..."
echo ""

# Check if logged in to Firebase
echo "Checking Firebase authentication..."
firebase projects:list --json > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ Not logged in to Firebase"
    echo "Please run: firebase login"
    exit 1
fi

echo "✅ Firebase authentication OK"
echo ""

# Function to set secret
set_secret() {
    local secret_name=$1
    local description=$2
    
    echo "Setting $secret_name..."
    echo "Description: $description"
    read -p "Enter value for $secret_name (or press Enter to skip): " secret_value
    
    if [ -n "$secret_value" ]; then
        echo "$secret_value" | firebase functions:secrets:set "$secret_name"
        if [ $? -eq 0 ]; then
            echo "✅ $secret_name set successfully"
        else
            echo "❌ Failed to set $secret_name"
        fi
    else
        echo "⏭️  Skipped $secret_name"
    fi
    echo ""
}

# Set required secrets
echo "📝 Setting up required secrets for Vibe Studio:"
echo ""

set_secret "GEMINI_API_KEY" "Google Gemini AI API key - get from: https://makersuite.google.com/app/apikey"

set_secret "BITLY_ACCESS_TOKEN" "Bitly access token for short URLs - get from: https://app.bitly.com/settings/api/"

set_secret "FIRECLASS_SERVICE_ACCOUNT" "FireClass service account JSON (paste the entire JSON content)"

echo "🎉 Secrets setup complete!"
echo ""
echo "💡 To verify secrets were set correctly:"
echo "   firebase functions:secrets:access GEMINI_API_KEY"
echo "   firebase functions:secrets:access BITLY_ACCESS_TOKEN"
echo "   firebase functions:secrets:access FIRECLASS_SERVICE_ACCOUNT"
echo ""
echo "🚀 You can now run the emulators!"
