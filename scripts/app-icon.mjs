// Makes the app icon from the owner's happy Hearts octopus (the number cards' drawing): public/icon.svg, and from it
// icon-512.png, icon-192.png and apple-touch-icon.png (180). Run with `npm run art:icon` after `npm run art:octo`.
// The octopus sits well inside the middle 80% so round and squircle phone masks never clip it (the 512 is maskable).
import { writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { OCTO_MANTA_CELLS } from '../src/art/octoMantaArt.ts';

const { chromium } = createRequire(import.meta.url)('playwright');
const BG = '#E4F3F0'; // Lagoon's light background, as before
const cell = OCTO_MANTA_CELLS.Hearts_number_cards;

// The octopus in the viewBox 0 -8 64 68 spans x 0–64, y about 7–59; frame it in a square with room all round
const VIEW = '-14 -13 92 92';
const kebab = (k) => k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
const shapes = cell.nodes.map((n) => `<${n.tag} ${Object.entries(n.attrs).map(([k, v]) => `${kebab(k)}="${v}"`).join(' ')}/>`);
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VIEW}">
  <!-- The owner's happy Hearts octopus (design/art-export/01-characters-octo-manta.svg) on Lagoon's background.
       Made by scripts/app-icon.mjs; don't edit by hand. -->
  <rect x="-14" y="-13" width="92" height="92" fill="${BG}"/>
  <g transform="${cell.transform}">
    ${shapes.join('\n    ')}
  </g>
</svg>
`;
await writeFile(new URL('../public/icon.svg', import.meta.url), svg);

const browser = await chromium.launch();
for (const [file, size] of [['icon-512.png', 512], ['icon-192.png', 192], ['apple-touch-icon.png', 180]]) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(`<body style="margin:0">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body>`);
  await page.screenshot({ path: new URL(`../public/${file}`, import.meta.url).pathname, omitBackground: false });
  await page.close();
}
await browser.close();
console.log('Wrote public/icon.svg, icon-512.png, icon-192.png and apple-touch-icon.png');
