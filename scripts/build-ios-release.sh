#!/bin/bash
# Builds the web app, syncs Capacitor iOS, and creates an App Store archive.
# Requires: Xcode, valid signing for team B7QMBU3EE6, bundle id com.ams.BugsCrushReboot
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
IOS_DIR="$ROOT/ios/App"
SCHEME="App"
ARCHIVE_PATH="$ROOT/build/BugsCrushReboot.xcarchive"
EXPORT_PATH="$ROOT/build/export"

cd "$ROOT"

echo "==> Installing dependencies"
npm ci

echo "==> Building web assets (production)"
npm run build

echo "==> Syncing Capacitor iOS"
npx cap sync ios

echo "==> Archiving (Release)"
mkdir -p "$ROOT/build"
xcodebuild \
  -project "$IOS_DIR/App.xcodeproj" \
  -scheme "$SCHEME" \
  -configuration Release \
  -destination "generic/platform=iOS" \
  -archivePath "$ARCHIVE_PATH" \
  archive

echo "==> Exporting for App Store Connect"
rm -rf "$EXPORT_PATH"
xcodebuild \
  -exportArchive \
  -archivePath "$ARCHIVE_PATH" \
  -exportPath "$EXPORT_PATH" \
  -exportOptionsPlist "$ROOT/ios/ExportOptions.plist"

echo ""
echo "Done. Upload from Xcode Organizer or run:"
echo "  xcrun altool --upload-app -f \"$EXPORT_PATH/App.ipa\" -t ios -u YOUR_APPLE_ID"
echo ""
echo "Archive: $ARCHIVE_PATH"
