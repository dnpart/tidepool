// Turns the owner's black cat seen from behind (drawn in Boxy SVG on Nov 27, loose on the page of
// design/art-export/13-gone-fishing.svg, each part titled: Body, Tail, Paw, Head, Ear) into src/art/catBackArt.ts.
// Run with `npm run art:catback` (needs Playwright's Chromium).
//
// Boxy writes some transforms as CSS (the ears' transform-origin), so the page works each shape's full transform out in
// Chromium; shapes keep their numbers as drawn. The cat is laid out with the bottom middle of its body at (0, 0), at a
// sixth of the page's size (the scale of the box it was drawn beside), and the paw's tip is kept as an anchor for the
// rings where it touches the water.
import { execFileSync } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
// The owner's cat came in commit 97478be; read that copy so later uploads of file 13 can't break the import
const SOURCE = '97478be:design/art-export/13-gone-fishing.svg';
const OUT = new URL('../src/art/catBackArt.ts', import.meta.url);
const SCALE = 1 / 6;

/** Runs in the page: each shape of the loose cat with its title, transform to the page, geometry and resolved paint. */
function read() {
  const svg = document.querySelector('svg');
  const known = new Set(['Background', 'Frames_guides', 'Art', 'Labels']);
  const [group] = [...svg.children].filter((el) => el.tagName === 'g' && !known.has(el.id));
  const titleOf = (el) => [...el.children].find((c) => c.tagName === 'title')?.textContent ?? null;
  const root = svg.getCTM().inverse();
  return [...group.querySelectorAll('path, ellipse')].map((el) => {
    const m = root.multiply(el.getCTM());
    const cs = getComputedStyle(el);
    const geometry = el.tagName === 'path' ? { d: el.getAttribute('d') }
      : { cx: +el.getAttribute('cx'), cy: +el.getAttribute('cy'), rx: +el.getAttribute('rx'), ry: +el.getAttribute('ry') };
    const paint = (v) => {
      const c = /rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)/.exec(v);
      return c ? `#${[c[1], c[2], c[3]].map((n) => Math.round(+n).toString(16).padStart(2, '0')).join('').toUpperCase()}` : v;
    };
    return {
      role: titleOf(el), tag: el.tagName, geometry, m: [m.a, m.b, m.c, m.d, m.e, m.f],
      fill: paint(cs.fill), stroke: paint(cs.stroke), strokeWidth: parseFloat(cs.strokeWidth), linecap: cs.strokeLinecap,
      start: el.tagName === 'path' ? (() => { const p = el.getPointAtLength(0); return [p.x, p.y]; })() : null,
    };
  });
}

const svgText = execFileSync('git', ['show', SOURCE], { encoding: 'utf8' });
const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent(svgText);
const shapes = await page.evaluate(read);
await browser.close();

const body = shapes.find((s) => s.role === 'Body');
// The body's bottom middle, on the page
const [bx, by] = [body.m[0] * body.geometry.cx + body.m[2] * body.geometry.cy + body.m[4],
  body.m[1] * body.geometry.cx + body.m[3] * body.geometry.cy + body.m[5] + body.geometry.ry * body.m[3]];
const r = (v, n = 4) => Math.round(v * 10 ** n) / 10 ** n;
const lay = ([a, b, c, d, e, f]) => [a, b, c, d, (e - bx), (f - by)].map((v) => r(v * SCALE));
const at = (m, [x, y]) => [r((m[0] * x + m[2] * y + m[4] - bx) * SCALE, 2), r((m[1] * x + m[3] * y + m[5] - by) * SCALE, 2)];
const paw = shapes.find((s) => s.role === 'Paw');

const out = shapes.map((s) => ({
  role: s.role.toLowerCase(), tag: s.tag, ...s.geometry, m: lay(s.m),
  fill: s.fill === 'none' ? undefined : s.fill,
  ...(s.fill === 'none' ? { stroke: s.stroke, strokeWidth: s.strokeWidth, linecap: s.linecap } : {}),
}));
const file = `// Made by scripts/cat-back-art.mjs from the owner's black cat seen from behind in design/art-export/13-gone-fishing.svg
// (commit 97478be). Don't edit by hand. Each shape as drawn, with one transform into the cat's frame: the bottom middle
// of its body at (0, 0), a sixth of the page's size.

export type CatBackRole = 'body' | 'tail' | 'paw' | 'head' | 'ear';
export interface CatBackShape {
  role: CatBackRole;
  tag: 'path' | 'ellipse';
  m: [number, number, number, number, number, number];
  d?: string;
  cx?: number; cy?: number; rx?: number; ry?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  linecap?: 'round' | 'butt' | 'square';
}

/** In drawing order. */
export const CAT_BACK_SHAPES: CatBackShape[] = [
${out.map((s) => `  ${JSON.stringify(s)},`).join('\n')}
];

/** The tip of the raised paw, in the cat's frame (where it touches the water). */
export const CAT_BACK_PAW: [number, number] = ${JSON.stringify(at(paw.m, paw.start))};
`;
await writeFile(OUT, file);
console.log(`wrote ${out.length} shapes; paw tip at ${at(paw.m, paw.start)}`);
