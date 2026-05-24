# BugsCrushReact

Bugs Crush revamped with React, Vite, and Capacitor for iOS.

## Setup

```bash
npm install
npm run dev
```

## iOS

```bash
npm run build
npx cap copy ios
```

Open `ios/App/App.xcodeproj` in Xcode, then build and run on a device or simulator.

## Deploy script

`./deploy.sh` copies `~/Downloads/bug-blast.jsx` into `src/App.jsx`, builds, and syncs to iOS.
