# BugsCrushReboot — TestFlight & App Store Release Guide

This document prepares **BugsCrushReboot** (`com.ams.BugsCrushReboot`) for distribution. The native Objective-C app shipped as **3.2**; this Capacitor rewrite is version **4.0** (build **1**).

---

## Prerequisites

| Item | Value |
|------|--------|
| Bundle ID | `com.ams.BugsCrushReboot` |
| Team ID | `B7QMBU3EE6` (in Xcode project) |
| Display name | BugsCrushReboot |
| Min iOS | 15.0 |
| Xcode scheme | `App` → `ios/App/App.xcodeproj` |

You need:

1. **Apple Developer Program** membership.
2. **App Store Connect** — create or use the **BugsCrushReboot** app record with bundle ID `com.ams.BugsCrushReboot`.
3. **Xcode 15+** signed in with your Apple ID (team selected in Signing & Capabilities).

---

## 1. Production build (every release)

From the project root:

```bash
npm run build:ios
```

This runs `vite build` and `npx cap sync ios` (copies web assets into `ios/App/App/public`).

Optional — full archive + IPA export (requires valid distribution certificate):

```bash
chmod +x scripts/build-ios-release.sh
./scripts/build-ios-release.sh
```

---

## 2. Version & build numbers

Before **each** TestFlight or App Store upload, increment in Xcode:

**Target App → General**

- **Version** (`MARKETING_VERSION`) — user-facing, e.g. `4.0`, `4.0.1`, `4.1`
- **Build** (`CURRENT_PROJECT_VERSION`) — must increase for every upload (e.g. `1`, `2`, `3`)

Keep `package.json` `"version"` in sync with marketing version for consistency.

If updating the **existing** App Store listing (previously 3.2), use version **≥ 4.0** and a new build number.

---

## 3. TestFlight checklist

### Xcode

1. Open `ios/App/App.xcodeproj`.
2. Select target **App** → **Signing & Capabilities**:
   - Team: your team
   - **Automatically manage signing**: ON
   - Bundle Identifier: `com.ams.BugsCrushReboot`
3. Scheme: **App**, destination: **Any iOS Device (arm64)**.
4. **Product → Archive** (Release configuration).
5. In **Organizer** → **Distribute App** → **App Store Connect** → **Upload**.

### App Store Connect

1. [App Store Connect](https://appstoreconnect.apple.com) → **My Apps** → **BugsCrushReboot** (create app with bundle ID `com.ams.BugsCrushReboot` if needed).
2. **TestFlight** tab → wait for build processing (often 5–30 minutes).
3. **Compliance**: answer export encryption — app uses only standard HTTPS; **Info.plist** includes `ITSAppUsesNonExemptEncryption` = `false` (no custom encryption).
4. Add **internal** testers (immediate) or **external** testers (requires Beta App Review for first external build).
5. Test on device: install via TestFlight, verify audio, gameplay, mute, game over / victory modals, portrait layout.

### TestFlight testing focus

- [ ] First tap starts music and SFX
- [ ] Sounds work with mute switch on (playback session configured)
- [ ] Game Over / Victory dialogs centered
- [ ] Safe area on notched iPhones
- [ ] No debug overlays (Release uses `CAPACITOR_DEBUG=false`)
- [ ] Offline play (no network required after install)

---

## 4. App Store submission checklist

### App information

- **Name**: BugsCrushReboot
- **Subtitle** (optional): e.g. “Match bugs in the jungle”
- **Category**: Games → Puzzle (or match original listing)
- **Age rating**: complete questionnaire (likely 4+, no violence beyond cartoon bugs)
- **Copyright**: © Your Name / AMS

### Screenshots & preview

Pre-generated assets live in **`app-store-assets/screenshots/`** (5 scenes × 4 device sizes). Regenerate anytime:

```bash
npm run screenshots
```

| Folder | Size | App Store Connect slot |
|--------|------|------------------------|
| `iphone-6.7/` | 1290×2796 | 6.7" display (**required**) |
| `iphone-6.5/` | 1284×2778 | 6.5" display |
| `iphone-5.5/` | 1242×2208 | 5.5" display |
| `ipad-12.9/` | 2048×2732 | 12.9" iPad Pro |

App icon (1024×1024): **`app-store-assets/icons/AppIcon-1024.png`** (also installed in Xcode).

Minimum: **3** screenshots per device size. See `app-store-assets/README.md`.

### App Privacy (nutrition labels)

This build:

- Does **not** collect user data
- Does **not** use tracking
- Loads **Google Fonts** at runtime (`fonts.googleapis.com`) — declare “Other Data” only if Apple asks about network content; optional: self-host font to avoid third-party requests

In App Store Connect → **App Privacy** → indicate **no data collection** if accurate.

### Review notes

```
BugsCrushReboot is a match-3 puzzle game. Tap two adjacent bugs to swap.
Match 3+ to clear. No login required. Audio can be muted with the speaker
button (top right). First tap enables sound (iOS policy).
```

Provide a demo account only if you add login later.

### Submission

1. TestFlight build approved for testing (recommended).
2. **App Store** tab → **+ Version** → select build **4.0 (x)**.
3. Fill description, keywords, support URL, marketing URL (optional).
4. **Submit for Review**.

---

## 5. Post-launch updates

```bash
# 1. Bump version/build in Xcode
# 2. Build and sync
npm run build:ios
# 3. Archive & upload
```

Update **What’s New** in App Store Connect for each release.

---

## 6. Known project layout

| Path | Purpose |
|------|---------|
| `src/App.jsx` | Game + audio |
| `public/sounds/` | WAV assets (bundled into app) |
| `ios/App/` | Capacitor iOS host |
| `capacitor.config.json` | `appId`, `webDir` |
| `ios/ExportOptions.plist` | App Store export settings |
| `ios/App/App/PrivacyInfo.xcprivacy` | Apple privacy manifest |

---

## 7. Troubleshooting

| Issue | Fix |
|-------|-----|
| Upload fails: invalid bundle | Increment build number |
| Missing compliance | Answer encryption question in App Store Connect |
| Signing error | Select correct team; register bundle ID in Developer portal |
| Blank screen on device | Run `npm run build:ios` before archiving |
| Sounds missing | Ensure `public/sounds` exists; run `cap sync` |
| Wrong app in Connect | Bundle ID must be `com.ams.BugsCrushReboot` |

---

## Quick reference — Xcode-only upload

1. `npm run build:ios`
2. Open `ios/App/App.xcodeproj`
3. Increment **Build**
4. **Product → Archive → Distribute → App Store Connect**
