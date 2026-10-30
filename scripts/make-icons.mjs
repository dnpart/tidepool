// Renders public/icon.svg to the PNG icons the manifest and iOS need.
// Run with `npm run icons` after changing the SVG (needs Playwright + Chromium).
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

// Playwright is preinstalled globally rather than a project dependency
const { chromium } = createRequire(import.meta.url)('playwright');

const svg = await readFile(new URL('../public/icon.svg', import.meta.url), 'utf8');
const sizes = { 'icon-512.png': 512, 'icon-192.png': 192, 'apple-touch-icon.png': 180 };

const browser = await chromium.launch();
const page = await browser.newPage();
for (const [file, size] of Object.entries(sizes)) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<style>html,body{margin:0}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`,
  );
  await page.locator('svg').screenshot({ path: new URL(`../public/${file}`, import.meta.url).pathname });
  console.log(`wrote public/${file}`);
}
await browser.close();
