
# Mobile Development Guide

This project uses Capacitor to create native iOS and Android applications from our web app.

## iOS Development

### Prerequisites
- macOS with Xcode 13+ installed
- Node.js and npm

### Setting Up iOS

If you're starting fresh or experiencing workspace issues:

```bash
# Make scripts executable
chmod +x scripts/rebuild-ios.sh
chmod +x scripts/sync-ios.sh

# Complete rebuild of iOS platform
./scripts/rebuild-ios.sh
```

For regular development after initial setup:

```bash
# Sync changes to iOS
./scripts/sync-ios.sh

# Open in Xcode
npx cap open ios
```

### Troubleshooting iOS Workspace Issues

If Xcode shows no files or "No Selection":

1. Run the workspace fix script:
   ```bash
   node scripts/fix-ios-workspace.js
   ```

2. Verify the workspace structure:
   ```bash
   cat ios/App/App.xcworkspace/contents.xcworkspacedata
   ```

3. If problems persist, try a complete rebuild:
   ```bash
   ./scripts/rebuild-ios.sh
   ```

## Android Development

### Prerequisites
- Android Studio
- JDK 11+

### Setting Up Android

```bash
# Add Android platform
npx cap add android

# Sync changes
npm run build
npx cap sync android

# Open in Android Studio
npx cap open android
```

## Development Workflow

1. Make changes to the web app
2. Build the web app: `npm run build`
3. Sync changes to native platforms: `npx cap sync`
4. Test in simulator or on device

## Live Reload

The app is configured to load from:
`https://d8f905f0-9633-4ebf-8ec7-9330adbb61fe.lovableproject.com?forceHideBadge=true`

This enables hot reloading during development.
