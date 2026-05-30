# App Store assets — BugsCrushReboot

## Icons

| File | Size | Use |
|------|------|-----|
| `icons/AppIcon-1024.png` | 1024×1024 | App Store Connect → App Icon |
| `ios/App/App/Assets.xcassets/AppIcon.appiconset/` | same | Xcode / IPA (already copied) |

Apple requirements: PNG or JPEG, **no transparency**, no rounded corners in the file, RGB color space.

## Screenshots

Generated under `screenshots/` by device class:

| Folder | Resolution | App Store Connect |
|--------|------------|-------------------|
| `iphone-6.7/` | 1290 × 2796 | 6.7" display (iPhone 15/16 Pro Max, etc.) — **required** |
| `iphone-6.5/` | 1284 × 2778 | 6.5" display |
| `iphone-5.5/` | 1242 × 2208 | 5.5" display (legacy) |
| `ipad-12.9/` | 2048 × 2732 | 12.9" iPad Pro |

Each folder contains 5 PNGs:

1. `01-gameplay.png` — active board
2. `02-hint.png` — hint highlighting
3. `03-combo.png` — combo popup
4. `04-levelup.png` — level up
5. `05-victory.png` — win screen

### Regenerate

```bash
npm install
npm run screenshots
```

Uses Playwright + `screenshot-template.html` (matches in-game UI).

### Upload

App Store Connect → your app → **App Store** tab → **Screenshots** → drag files for each device size (minimum **3** per size).

## Marketing (optional)

You can add localized caption overlays in Connect or replace PNGs with designed frames; Apple does not require text on screenshots.
