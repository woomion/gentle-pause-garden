
#!/bin/bash
set -e

echo "🏗️ Building web assets..."
npm run build

echo "🔄 Running workspace fix script..."
node scripts/fix-ios-workspace.js

echo "🔄 Syncing Capacitor..."
npx cap sync ios

echo "✅ iOS sync complete!"
echo "🚀 You can now open Xcode with: npx cap open ios"
