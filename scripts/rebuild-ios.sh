
#!/bin/bash
set -e

echo "🧹 Cleaning up iOS build artifacts..."
rm -rf ios
rm -rf node_modules/.cache/capacitor-ios

echo "🏗️ Building web assets..."
npm run build

echo "➕ Adding iOS platform..."
npx cap add ios --verbose

echo "🔄 Running workspace fix script..."
node scripts/fix-ios-workspace.js

echo "🔄 Syncing Capacitor..."
npx cap sync ios

echo "✅ iOS workspace rebuild complete!"
echo "🚀 You can now open Xcode with: npx cap open ios"
