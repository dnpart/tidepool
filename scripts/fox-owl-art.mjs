// Turns the owner's redrawn Fox + Owl sheet (design/art-export/02-characters-fox-owl.svg) into src/art/foxOwlArt.ts.
// Run with `npm run art:fox` after the SVG changes (needs Playwright's Chromium, as in cloud sessions).
//
// Every shape is kept exactly as drawn, in Illustrator's coordinates; each cell gets one transform that maps its frame
// (256 × 272, from the art export) back into the creatures' 0 -8 64 68 viewBox. Each shape is also tagged with the part
// it belongs to, so the app can give a character another cell's eyes (happy on a matched Tide Pairs card, sleepy when
// paused):
//   eyes   the eyes and everything inside them (irises, highlights), lashes, and closed or happy eye lines: the
//          dark shapes off the middle of the face, plus whatever sits inside one of them
//   body   everything else (the body, cheeks, nose, mouth or mustache, crown, bow tie)
import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { repairSmoothCurves } from './repair-smooth-curves.mjs';

const { chromium } = createRequire(import.meta.url)('playwright');
const MASTER = new URL('../design/art-export/02-characters-fox-owl.svg', import.meta.url);
const OUT = new URL('../src/art/foxOwlArt.ts', import.meta.url);

const MANIFEST = JSON.parse(await readFile(new URL('../design/art-export/manifest.json', import.meta.url), 'utf8'));
/** Each cell's group id in the SVG and the top-left of its frame (the point that lands on 0, -8). */
const CELLS = Object.fromEntries(
  MANIFEST.filter((m) => m.file === '02-characters-fox-owl.svg').map((m) => [m.id, [m.frame.x, m.frame.y]]),
);
const SCALE = 4; // Illustrator units per viewBox unit
const GEOMETRY = ['d', 'x', 'y', 'width', 'height', 'rx', 'ry', 'cx', 'cy', 'r', 'points', 'x1', 'y1', 'x2', 'y2', 'transform'];
const PAINT = {
  fill: 'fill', stroke: 'stroke', 'stroke-width': 'strokeWidth', 'stroke-linejoin': 'strokeLinejoin',
  'stroke-linecap': 'strokeLinecap', 'stroke-miterlimit': 'strokeMiterlimit', 'fill-rule': 'fillRule', opacity: 'opacity',
};
const PAINT_DEFAULTS = {
  stroke: 'none', 'stroke-width': '1px', 'stroke-linejoin': 'miter', 'stroke-linecap': 'butt', 'stroke-miterlimit': '4',
  'fill-rule': 'nonzero', opacity: '1',
};

/** Runs in the page: every shape of every cell with its geometry, resolved paint and box in the SVG's coordinates. */
function read({ cells, frames, geometry, paint }) {
  const root = document.querySelector('svg');
  const toRoot = root.getCTM().inverse();
  const hex = (v) => {
    const m = /^rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)/.exec(v);
    return m ? `#${[m[1], m[2], m[3]].map((n) => Math.round(Number(n)).toString(16).padStart(2, '0')).join('')}` : v;
  };
  // A drawing left outside the named groups (pasted at the top level) stands for the cell it sits in
  const loose = {};
  for (const g of root.children) {
    if (g.id || g.tagName !== 'g') continue;
    const b = g.getBBox();
    const [cx, cy] = [b.x + b.width / 2, b.y + b.height / 2];
    const hit = Object.entries(frames).find(([, [x, y]]) => cx > x && cx < x + 256 && cy > y && cy < y + 272);
    if (hit) loose[hit[0]] = g;
  }
  const out = { loose: Object.keys(loose) };
  for (const id of cells) {
    const group = loose[id] ?? document.getElementById(id);
    if (!group) throw new Error(`Missing group ${id}`);
    out[id] = [...group.querySelectorAll('path, rect, circle, ellipse, polygon, polyline, line')].map((el) => {
      const m = toRoot.multiply(el.getCTM());
      const b = el.getBBox();
      const pts = [[b.x, b.y], [b.x + b.width, b.y], [b.x, b.y + b.height], [b.x + b.width, b.y + b.height]]
        .map(([x, y]) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f]);
      const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
      const cs = getComputedStyle(el);
      const attrs = {};
      for (const a of geometry) if (el.hasAttribute(a)) attrs[a] = el.getAttribute(a);
      // A shape's own transform is kept; transforms on the groups around it are folded in (they're rare)
      const own = el.transform.baseVal.consolidate()?.matrix;
      const outer = own ? m.multiply(own.inverse()) : m;
      const style = {};
      for (const p of paint) style[p] = p === 'fill' || p === 'stroke' ? hex(cs.getPropertyValue(p)) : cs.getPropertyValue(p);
      return {
        tag: el.tagName, attrs, style, outer: [outer.a, outer.b, outer.c, outer.d, outer.e, outer.f],
        box: [Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)],
      };
    });
  }
  return out;
}

const r2 = (n) => Math.round(n * 100) / 100;
const lum = (hex) => {
  const h = hex.replace('#', '');
  if (h.length !== 6) return 1;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const isDark = (c) => c && c !== 'none' && c.startsWith('#') && lum(c) < 0.3;
const inside = (a, b, pad = 1) => a[0] >= b[0] - pad && a[1] >= b[1] - pad && a[0] + a[2] <= b[0] + b[2] + pad && a[1] + a[3] <= b[1] + b[3] + pad;

function classify(shapes, [fx, fy]) {
  const local = (s) => {
    const [x, y, w, h] = s.box;
    return { cx: x + w / 2 - fx, cy: y + h / 2 - fy, w, h };
  };
  // The character's middle is the middle of its biggest shape (the owls sit a little right of the frame's middle)
  const biggest = shapes.reduce((a, b) => (b.box[2] * b.box[3] > a.box[2] * a.box[3] ? b : a));
  const mid = biggest.box[0] + biggest.box[2] / 2;
  // The eye band: below the ears and crown, above the bow tie, and to one side of the middle (the nose, mouth and
  // mustache cross it)
  const eyeShape = (s) => {
    const { cy, w, h } = local(s);
    const [x, , bw] = s.box;
    return (isDark(s.style.fill) || isDark(s.style.stroke)) && cy > 70 && cy < 165 && (x + bw < mid - 2 || x > mid + 2)
      && w < 70 && h < 50;
  };
  const eyes = shapes.filter(eyeShape);
  return shapes.map((s) => {
    const part = eyes.includes(s) || eyes.some((e) => s !== e && inside(s.box, e.box) && s.box[2] < e.box[2]) ? 'eyes' : 'body';
    const attrs = { ...s.attrs };
    const [a, b, c, d, e, f] = s.outer.map(r2);
    if (a !== 1 || b !== 0 || c !== 0 || d !== 1 || e !== 0 || f !== 0) {
      const outer = `matrix(${a} ${b} ${c} ${d} ${e} ${f})`;
      attrs.transform = attrs.transform ? `${outer} ${attrs.transform}` : outer;
    }
    for (const [css, prop] of Object.entries(PAINT)) {
      const v = s.style[css];
      if (v && v !== PAINT_DEFAULTS[css]) attrs[prop] = v.replace(/px$/, '');
    }
    const [x, y, w, h] = s.box;
    const box = [r2((x - fx) / SCALE), r2((y - fy) / SCALE - 8), r2(w / SCALE), r2(h / SCALE)];
    return { tag: s.tag, part, attrs, box };
  });
}

const { svg, repairs } = repairSmoothCurves(await readFile(MASTER, 'utf8'));
const visible = repairs.filter((r) => r.moved >= 1);
console.log(`Repaired ${repairs.length} curve handles written as "s" (${visible.length} moved a unit or more)`);
for (const r of visible) console.log(`  path starting at ${r.at}, segment ${r.segment}: handle moved ${r.moved}`);
const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent(svg);
const raw = await page.evaluate(read, { cells: Object.keys(CELLS), frames: CELLS, geometry: GEOMETRY, paint: Object.keys(PAINT) });
for (const id of raw.loose) console.log(`${id}: using the drawing pasted outside its group (the group's own drawing is under it)`);
await browser.close();

const cells = {};
for (const [id, origin] of Object.entries(CELLS)) {
  const [fx, fy] = origin;
  cells[id] = {
    transform: `matrix(${1 / SCALE} 0 0 ${1 / SCALE} ${r2(-fx / SCALE)} ${r2(-fy / SCALE - 8)})`,
    origin,
    nodes: classify(raw[id], origin),
  };
}

await writeFile(OUT, `// Generated by scripts/fox-owl-art.mjs from design/art-export/02-characters-fox-owl.svg (the owner's drawings).
// Do not edit by hand: change the SVG and run \`npm run art:fox\`.

export type FoxOwlCellId = ${Object.keys(CELLS).map((id) => `'${id}'`).join(' | ')};

/** Which part of the character a shape belongs to, so eyes can be swapped between cells. */
export type FoxOwlPart = 'body' | 'eyes';

export interface FoxOwlNode {
  tag: 'path' | 'rect' | 'circle' | 'ellipse' | 'polygon' | 'polyline' | 'line';
  part: FoxOwlPart;
  /** Geometry in Illustrator coordinates and paint as React props. */
  attrs: Record<string, string>;
  /** x, y, width, height in the viewBox 0 -8 64 68. */
  box: [number, number, number, number];
}

export interface FoxOwlCell {
  /** Maps the cell from Illustrator coordinates into the viewBox 0 -8 64 68. */
  transform: string;
  /** Top-left of the cell's frame in Illustrator coordinates (the point that lands on 0, -8). */
  origin: [number, number];
  nodes: FoxOwlNode[];
}

export const FOX_OWL_CELLS: Record<FoxOwlCellId, FoxOwlCell> = ${JSON.stringify(cells, null, 1)};
`);
console.log(Object.entries(cells).map(([id, c]) => `${id}: ${c.nodes.filter((n) => n.part === 'eyes').length} eyes of ${c.nodes.length}`).join('\n'));
