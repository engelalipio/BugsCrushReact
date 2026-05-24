# BugsCrushReboot

Bugs Crush revamped with React, Vite, and Capacitor for iOS.

| | |
|--|--|
| **App name** | BugsCrushReboot |
| **Bundle ID** | `com.ams.BugsCrushReboot` |
| **Version** | 4.0 (Capacitor rewrite; native app was 3.2) |
| **iOS project** | `ios/App/App.xcodeproj` |

## Development

```bash
npm install
npm run dev          # browser at http://localhost:5173
npm run build:ios    # production web build + cap sync ios
```

Open `ios/App/App.xcodeproj` in Xcode to run on a device or simulator.

## Releasing to TestFlight / App Store

See **[docs/RELEASE.md](docs/RELEASE.md)** for the full checklist, versioning, and upload steps.

Quick path:

1. `npm run build:ios`
2. Open Xcode → increment **Build** number
3. **Product → Archive → Distribute to App Store Connect**

Optional CLI archive: `./scripts/build-ios-release.sh`

## Deploy script (legacy)

`./deploy.sh` copies `~/Downloads/bug-blast.jsx` into `src/App.jsx`, builds, and syncs to iOS.
