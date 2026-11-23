// Turns the owner's luna moths (drawn in Boxy SVG on Nov 22, loose on the page of
// design/art-export/04-characters-mushroom-moth.svg, each part a group the owner titled: Luna Moth, Wing, Body, Head,
// Eye, Shine, Shadow, Antenne, Legs, Eyes) into src/art/mothArt.ts. Run with `npm run art:moth` (needs Playwright's
// Chromium).
//
// The owner drew three moths side by side: Clubs (green wings, coral edges, orange antennae), Spades (mint wings,
// periwinkle edges, purple antennae) and the Spades moth again with closed, curved eyes (the sleepy face, also used for
// happy until the owner draws one). Boxy writes many transforms as CSS, so the page works each shape's full transform out
// in Chromium; shapes keep their numbers as drawn. Each moth is laid into the characters' viewBox (0 -8 64 68): 60 wide,
// centered on x 32, standing on y 60, like the old moth. Anchors (head, body, eyes, mouth) are measured for the crowns,
// bow ties and mustaches, which come from the owner's octopus drawings (royalArt.ts).
import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const MASTER = new URL('../design/art-export/04-characters-mushroom-moth.svg', import.meta.url);
const OUT = new URL('../src/art/mothArt.ts', import.meta.url);
const WIDTH = 60, CENTER_X = 32, BOTTOM = 60;

/** Runs in the page: every shape of each loose moth, its titles, transform to the page, geometry and resolved paint. */
function read() {
  const svg = document.querySelector('svg');
  const known = new Set(['Background', 'Frames_guides', 'Art', 'Labels']);
  const loose = [...svg.children].filter((el) => el.tagName === 'g' && !known.has(el.id));
  const titleOf = (el) => [...el.children].find((c) => c.tagName === 'title')?.textContent ?? null;
  const root = svg.getCTM().inverse();
  const GEOMETRY = ['d', 'cx', 'cy', 'rx', 'ry', 'r', 'x', 'y', 'width', 'height'];
  return loose.map((group) => {
    const box = group.getBoundingClientRect();
    const shapes = [...group.querySelectorAll('path, ellipse, circle, rect')].map((el) => {
      const titles = [];
      for (let e = el; e && e !== svg; e = e.parentElement) {
        const t = titleOf(e);
        if (t) titles.unshift(t);
      }
      const m = root.multiply(el.getCTM());
      const cs = getComputedStyle(el);
      const geometry = {};
      for (const a of GEOMETRY) if (el.hasAttribute(a)) geometry[a] = el.getAttribute(a);
      const r = el.getBoundingClientRect();
      return {
        tag: el.tagName, titles, geometry, m: [m.a, m.b, m.c, m.d, m.e, m.f],
        fill: cs.fill, stroke: cs.stroke, strokeWidth: cs.strokeWidth, linecap: cs.strokeLinecap, linejoin: cs.strokeLinejoin,
        opacity: cs.opacity, hidden: cs.visibility === 'hidden' || cs.display === 'none',
        box: [r.x, r.y, r.width, r.height],
      };
    });
    return { box: [box.x, box.y, box.width, box.height], shapes };
  });
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 3600, height: 1500 } });
await page.setContent(`<html><body style="margin:0">${(await readFile(MASTER, 'utf8')).replace(/<\?xml[^>]*>/, '')}</body></html>`);
const moths = await page.evaluate(read);
await browser.close();
if (moths.length !== 3) throw new Error(`expected three loose moths, found ${moths.length}`);
moths.sort((a, b) => a.box[0] - b.box[0]);
const [clubs, spades, sleepy] = moths;

/** rgb()/rgba() to hex and alpha. */
function color(css) {
  if (!css || css === 'none') return { hex: 'none', alpha: 1 };
  const m = css.match(/rgba?\(([^)]+)\)/);
  if (!m) return { hex: css, alpha: 1 };
  const [r, g, b, a = '1'] = m[1].split(',').map((s) => s.trim());
  const hex = `#${[r, g, b].map((v) => Number(v).toString(16).padStart(2, '0')).join('').toUpperCase()}`;
  return { hex, alpha: Number(a) };
}
const round = (v, p = 4) => +Number(v).toFixed(p);

function roleOf(s) {
  const own = s.titles.at(-1);
  if (s.titles.includes('Eyes')) return 'closedEye';
  if (own === 'Eye') return 'eye';
  if (own === 'Shine') return 'shine';
  if (s.titles.includes('Antenne')) return 'antenna';
  if (s.titles.includes('Legs')) return 'leg';
  if (s.titles.includes('Wing')) return 'wing';
  if (own === 'Shadow') return 'shadow';
  if (s.titles.includes('Head')) return 'head';
  return 'body';
}

/** One moth's shapes in the viewBox, with T mapping its page box into the target box. */
function lay(moth, T) {
  return moth.shapes.filter((s) => !s.hidden).map((s) => {
    const role = roleOf(s);
    const m = [
      T.k * s.m[0], T.k * s.m[1], T.k * s.m[2], T.k * s.m[3], T.k * s.m[4] + T.x, T.k * s.m[5] + T.y,
    ].map((v) => round(v));
    const attrs = { ...s.geometry };
    const fill = color(s.fill), strokeColor = color(s.stroke);
    const width = parseFloat(s.strokeWidth) || 0;
    attrs.fill = fill.hex;
    if (fill.hex !== 'none' && fill.alpha < 1) attrs.fillOpacity = String(round(fill.alpha, 3));
    if (strokeColor.hex !== 'none' && strokeColor.alpha > 0 && width > 0) {
      attrs.stroke = strokeColor.hex;
      attrs.strokeWidth = String(width);
      if (strokeColor.alpha < 1) attrs.strokeOpacity = String(round(strokeColor.alpha, 3));
      if (s.linecap !== 'butt') attrs.strokeLinecap = s.linecap;
      if (s.linejoin !== 'miter') attrs.strokeLinejoin = s.linejoin;
    }
    if (Number(s.opacity) < 1) attrs.opacity = s.opacity;
    const box = [(s.box[0]) * T.k + T.x, s.box[1] * T.k + T.y, s.box[2] * T.k, s.box[3] * T.k].map((v) => round(v, 2));
    return { role, tag: s.tag, attrs, m, box };
  });
}
function fit(moth) {
  const [x, y, w, h] = moth.box;
  const k = WIDTH / w;
  return { k, x: CENTER_X - (x + w / 2) * k, y: BOTTOM - (y + h) * k };
}

const out = { clubs: lay(clubs, fit(clubs)), spades: lay(spades, fit(spades)) };
const closed = lay(sleepy, fit(sleepy)).filter((s) => s.role === 'closedEye');
if (closed.length !== 2) throw new Error(`expected two closed eyes, found ${closed.length}`);

// Anchors from the Spades moth (the two are drawn alike)
const union = (boxes) => {
  const x0 = Math.min(...boxes.map((b) => b[0])), y0 = Math.min(...boxes.map((b) => b[1]));
  const x1 = Math.max(...boxes.map((b) => b[0] + b[2])), y1 = Math.max(...boxes.map((b) => b[1] + b[3]));
  return [x0, y0, x1 - x0, y1 - y0].map((v) => round(v, 2));
};
const sp = out.spades;
const head = union(sp.filter((s) => s.role === 'head').map((s) => s.box));
const body = union(sp.filter((s) => s.role === 'body').map((s) => s.box));
const eyes = union(sp.filter((s) => s.role === 'eye').map((s) => s.box));
const anchors = { head, body, eyes, top: union(sp.map((s) => s.box))[1] };
for (const suit of ['clubs', 'spades']) {
  const roles = out[suit].reduce((n, s) => ({ ...n, [s.role]: (n[s.role] ?? 0) + 1 }), {});
  console.log(suit, JSON.stringify(roles));
}
console.log('anchors', JSON.stringify(anchors));

const line = (s) => `  ${JSON.stringify(s)},`;
await writeFile(OUT, `// Made by scripts/moth-art.mjs from the owner's moths in design/art-export/04-characters-mushroom-moth.svg.
// Don't edit by hand: change the SVG and run \`npm run art:moth\`.
// Every shape as drawn, with one transform (m) into the characters' viewBox 0 -8 64 68; box is its extent there.

export type MothRole = 'wing' | 'body' | 'head' | 'shadow' | 'eye' | 'shine' | 'antenna' | 'leg' | 'closedEye';
export interface MothShape {
  role: MothRole;
  tag: 'path' | 'ellipse' | 'circle' | 'rect';
  attrs: Record<string, string>;
  m: [number, number, number, number, number, number];
  box: [number, number, number, number];
}

/** The Clubs moth, in drawing order. */
export const MOTH_CLUBS: MothShape[] = [
${out.clubs.map(line).join('\n')}
];

/** The Spades moth, in drawing order. */
export const MOTH_SPADES: MothShape[] = [
${out.spades.map(line).join('\n')}
];

/** The closed, curved eyes (drawn on the Spades moth; recolored to each moth's eye color). */
export const MOTH_CLOSED_EYES: MothShape[] = [
${closed.map(line).join('\n')}
];

/** Boxes (x, y, width, height) in the viewBox for placing crowns, bow ties and mustaches; top is the antennae's tip. */
export const MOTH_ANCHORS = ${JSON.stringify(anchors)} as const;
`);
