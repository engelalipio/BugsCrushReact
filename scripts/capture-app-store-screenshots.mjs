#!/usr/bin/env node
/**
 * Captures App Store screenshots from screenshot-template.html
 * Requires: npm install -D playwright && npx playwright install chromium
 */
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const TEMPLATE = path.join(ROOT, 'app-store-assets/screenshot-template.html');
const OUT = path.join(ROOT, 'app-store-assets/screenshots');

const SCENES = ['gameplay', 'hint', 'combo', 'levelup', 'victory'];

const SIZES = {
  'iphone-6.7': { width: 1290, height: 2796 },
  'iphone-6.5': { width: 1284, height: 2778 },
  'iphone-5.5': { width: 1242, height: 2208 },
  'ipad-12.9': { width: 2048, height: 2732 },
};

async function main() {
  if (!fs.existsSync(TEMPLATE)) {
    console.error('Missing template:', TEMPLATE);
    process.exit(1);
  }

  const browser = await chromium.launch();
  const templateUrl = `file://${TEMPLATE}`;

  for (const [folder, size] of Object.entries(SIZES)) {
    const dir = path.join(OUT, folder);
    fs.mkdirSync(dir, { recursive: true });

    for (let i = 0; i < SCENES.length; i++) {
      const scene = SCENES[i];
      const page = await browser.newPage({
        viewport: { width: size.width, height: size.height },
        deviceScaleFactor: 1,
      });
      await page.goto(`${templateUrl}?scene=${scene}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(400);
      const file = path.join(dir, `${String(i + 1).padStart(2, '0')}-${scene}.png`);
      await page.screenshot({ path: file, type: 'png' });
      await page.close();
      console.log('✓', path.relative(ROOT, file));
    }
  }

  await browser.close();
  console.log('\nDone. Upload folders under app-store-assets/screenshots/ to App Store Connect.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
