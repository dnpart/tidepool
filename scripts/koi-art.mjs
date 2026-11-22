// Turns the owner's koi (drawn in Boxy SVG on Nov 22, loose on the page of design/art-export/09-pond-hop-ponds.svg,
// beside the Koi Garden dark pond) into src/art/koiArt.ts. Run with `npm run art:koi` (needs Playwright's Chromium).
//
// The owner drew one koi, white-gray with black patches, as a replacement for the old shiro; every koi now takes its
// shape (KoiFish recolors it per kind). Boxy writes many transforms as CSS (transform-origin, transform-box), so the
// page works each shape's full transform out in Chromium; the paths and ellipses keep their numbers as drawn. Roles:
// the gray path is the body, the unfilled paths the whiskers, the tan path past the body's back end the tail, the other
// tan paths fins, the two big dark ellipses patches (the owner, Nov 22), and the two small ellipses the eyes: a dark one
// on the body and a light one on the head's patch ('patchEye', which KoiFish darkens where the patch isn't dark).
// The koi is laid in the old KoiFish frame: swimming toward +x, from the nose at x 14 to the tail's tip at x -21.
import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const MASTER = new URL('../design/art-export/09-pond-hop-ponds.svg', import.meta.url);
const OUT = new URL('../src/art/koiArt.ts', import.meta.url);
const NOSE = 14, TAIL_TIP = -21;

/** Runs in the page: each shape of the loose koi group, its transform within that group, and its paint. */
function read() {
  const svg = document.querySelector('svg');
  const known = new Set(['Background', 'Frames_guides', 'Art', 'Labels']);
  const loose = [...svg.children].filter((el) => el.tagName === 'g' && !known.has(el.id));
  if (loose.length !== 1) throw new Error(`expected one loose group (the koi), found ${loose.length}`);
  const group = loose[0];
  const inv = group.getCTM().inverse();
  return [...group.querySelectorAll('path, ellipse')].map((el) => {
    const m = inv.multiply(el.getCTM());
    const cs = getComputedStyle(el);
    const box = el.getBBox();
    const corners = [[box.x, box.y], [box.x + box.width, box.y], [box.x, box.y + box.height], [box.x + box.width, box.y + box.height]]
      .map(([x, y]) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f]);
    return {
      tag: el.tagName,
      d: el.getAttribute('d'),
      ellipse: el.tagName === 'ellipse' ? ['cx', 'cy', 'rx', 'ry'].map((a) => +el.getAttribute(a)) : null,
      m: [m.a, m.b, m.c, m.d, m.e, m.f],
      fill: cs.fill,
      stroke: cs.stroke,
      strokeWidth: parseFloat(cs.strokeWidth),
      linecap: cs.strokeLinecap,
      xs: corners.map((c) => c[0]),
      ys: corners.map((c) => c[1]),
    };
  });
}

const browser = await chromium.launch();
const page = await browser.newPage();
const svgText = (await readFile(MASTER, 'utf8')).replace(/<\?xml[^>]*>/, '');
await page.setContent(`<html><body style="margin:0">${svgText}</body></html>`);
const shapes = await page.evaluate(read);
await browser.close();

const GRAY = 'rgb(216, 216, 216)', TAN = 'rgb(187, 171, 153)', DARK = 'rgb(44, 44, 44)';
const body = shapes.find((s) => s.tag === 'path' && s.fill === GRAY);
if (!body) throw new Error('no body (the gray path) found');
const min = (a) => Math.min(...a), max = (a) => Math.max(...a);
// The body is long up and down the page; the whiskers are at the head.
const bodyTop = min(body.ys), bodyBottom = max(body.ys), mid = (min(body.xs) + max(body.xs)) / 2;
const whiskers = shapes.filter((s) => s.fill === 'none');
const headUp = whiskers.length ? min(whiskers.flatMap((s) => s.ys)) < (bodyTop + bodyBottom) / 2 : true;
if (!headUp) throw new Error('the koi points down the page; only up is handled');
const tailTip = max(shapes.filter((s) => s.fill === TAN).flatMap((s) => s.ys));
const k = (NOSE - TAIL_TIP) / (tailTip - bodyTop);
// From the drawing's frame (head up) to the koi's: up becomes +x, the nose lands on x 14, the middle line on y 0.
const K = [0, k, -k, 0, NOSE + k * bodyTop, -k * mid];
const mul = (a, b) => [
  a[0] * b[0] + a[2] * b[1], a[1] * b[0] + a[3] * b[1],
  a[0] * b[2] + a[2] * b[3], a[1] * b[2] + a[3] * b[3],
  a[0] * b[4] + a[2] * b[5] + a[4], a[1] * b[4] + a[3] * b[5] + a[5],
];
const round = (v, p = 4) => +v.toFixed(p);

const out = shapes.map((s) => {
  let role;
  if (s === body) role = 'body';
  else if (s.fill === 'none') role = 'whisker';
  else if (s.fill === GRAY) role = 'patchEye';
  else if (s.fill === TAN) role = min(s.ys) >= bodyBottom - (bodyBottom - bodyTop) * 0.2 ? 'tail' : 'fin';
  else if (s.fill === DARK) role = s.ellipse && s.ellipse[2] * s.ellipse[3] < 4 ? 'eye' : 'patch';
  else throw new Error(`unexpected color ${s.fill}`);
  const shape = { role, m: mul(K, s.m).map((v) => round(v)) };
  if (s.ellipse) shape.ellipse = s.ellipse;
  else shape.d = s.d;
  if (role === 'whisker') Object.assign(shape, { strokeWidth: s.strokeWidth || 1 });
  return shape;
});
const tail = shapes.find((s, i) => out[i].role === 'tail');
// The tail sways about where it meets the body: the middle of its front edge
const root = [round(NOSE - k * (min(tail.ys) - bodyTop) - 0.8, 2), 0];

const roles = out.map((s) => s.role).join(', ');
console.log(`koi: ${out.length} shapes (${roles}), scale ${k.toFixed(4)}, tail root ${root}`);
await writeFile(OUT, `// Made by scripts/koi-art.mjs from the owner's koi in design/art-export/09-pond-hop-ponds.svg. Don't edit by hand.
// Each shape as drawn, with one transform into the koi's frame: swimming toward +x, nose at x ${NOSE}, tail tip at x ${TAIL_TIP}.

export type KoiRole = 'body' | 'fin' | 'tail' | 'patch' | 'eye' | 'patchEye' | 'whisker';
export interface KoiShape {
  role: KoiRole;
  m: [number, number, number, number, number, number];
  d?: string;
  ellipse?: [number, number, number, number];
  strokeWidth?: number;
}

/** In drawing order. */
export const KOI_SHAPES: KoiShape[] = [
${out.map((s) => `  ${JSON.stringify(s)},`).join('\n')}
];

/** Where the tail meets the body, in the koi's frame: the tail sways about it. */
export const KOI_TAIL_ROOT: [number, number] = ${JSON.stringify(root)};
`);
