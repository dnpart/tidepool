// Turns the owner's Illustrator file (design/art-export/01-characters-octo-manta.svg) into src/art/octoMantaArt.ts.
// Run with `npm run art:octo` after the SVG changes (needs Playwright's Chromium, as in cloud sessions).
//
// Every shape is kept exactly as drawn, in Illustrator's coordinates; each cell gets one transform that maps its frame
// (256 × 272, from the art export) back into the creatures' 0 -8 64 68 viewBox. Each shape is also tagged with the part
// it belongs to, so the app can swap eyes between cells or lend a crown to the waving octopus:
//   crown  the gold crown and everything drawn inside it (gems, the suit jewel)
//   eyes   eyes, highlights, lashes and brows: dark or pale shapes, and tiny ones, off the middle of the face
//   cheeks the white cheeks, shaped like the suit (hearts, diamonds, and the mantas' own)
//   body   everything else (the body, cheeks, mouth or mustache, bow tie)
import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { repairSmoothCurves } from './repair-smooth-curves.mjs';

const { chromium } = createRequire(import.meta.url)('playwright');
const MASTER = new URL('../design/art-export/01-characters-octo-manta.svg', import.meta.url);
const OUT = new URL('../src/art/octoMantaArt.ts', import.meta.url);

/** Each cell's group id in the SVG and the top-left of its frame (the point that lands on 0, -8). */
export const CELLS = {
  Hearts_Ace: [60, 290], Hearts_number_cards: [352, 290], Hearts_Jack: [644, 290], Hearts_Queen: [936, 290],
  Hearts_King: [1228, 290], Diamonds_Ace: [1520, 290], Diamonds_number_cards: [1812, 290], Diamonds_Jack: [2104, 290],
  Diamonds_Queen: [2396, 290], Diamonds_King: [2688, 290], Spades_Ace: [2980, 290], Spades_number_cards: [3272, 290],
  Spades_Jack: [60, 644], Spades_Queen: [352, 644], Spades_King: [644, 644], Clubs_Ace: [936, 644],
  Clubs_number_cards: [1228, 644], Clubs_Jack: [1520, 644], Clubs_Queen: [1812, 644], Clubs_King: [2104, 644],
  Waving: [2396, 644], Sleepy: [2688, 644], Manta: [2980, 644], Sleepy_manta: [3272, 644],
};
const SCALE = 4; // Illustrator units per viewBox unit
const MID = 128; // the middle of a 256-wide frame
const GEOMETRY = ['d', 'x', 'y', 'width', 'height', 'rx', 'ry', 'cx', 'cy', 'r', 'points', 'x1', 'y1', 'x2', 'y2', 'transform'];
const PAINT = {
  fill: 'fill', stroke: 'stroke', 'stroke-width': 'strokeWidth', 'stroke-linejoin': 'strokeLinejoin',
  'stroke-linecap': 'strokeLinecap', 'stroke-miterlimit': 'strokeMiterlimit', 'fill-rule': 'fillRule', opacity: 'opacity',
};
const PAINT_DEFAULTS = {
  stroke: 'none', 'stroke-width': '1px', 'stroke-linejoin': 'miter', 'stroke-linecap': 'butt', 'stroke-miterlimit': '4',
  'fill-rule': 'nonzero', opacity: '1',
};
const EYE_COLORS = new Set(['#1b2533', '#e6f1ff', '#d7e6f9']);
const GOLD = '#f6c752';

/** Runs in the page: every shape of every cell with its geometry, resolved paint and box in the SVG's coordinates. */
function read({ cells, geometry, paint }) {
  const root = document.querySelector('svg');
  const toRoot = root.getCTM().inverse();
  const hex = (v) => {
    const m = /^rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)/.exec(v);
    return m ? `#${[m[1], m[2], m[3]].map((n) => Math.round(Number(n)).toString(16).padStart(2, '0')).join('')}` : v;
  };
  const out = {};
  for (const id of cells) {
    const group = document.getElementById(id);
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
      const style = {};
      for (const p of paint) style[p] = p === 'fill' || p === 'stroke' ? hex(cs.getPropertyValue(p)) : cs.getPropertyValue(p);
      return { tag: el.tagName, attrs, style, box: [Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)] };
    });
  }
  return out;
}

const r2 = (n) => Math.round(n * 100) / 100;

function classify(shapes, [fx, fy]) {
  const crown = shapes.find((s) => s.style.fill === GOLD);
  const inCrown = (b) => crown && b[0] >= crown.box[0] - 3 && b[1] >= crown.box[1] - 3
    && b[0] + b[2] <= crown.box[0] + crown.box[2] + 3 && b[1] + b[3] <= crown.box[1] + crown.box[3] + 3;
  return shapes.map((s) => {
    const [x, y, w, h] = s.box;
    const cx = x + w / 2 - fx, cy = y + h / 2 - fy;
    let part = 'body';
    if (s === crown || inCrown(s.box)) part = 'crown';
    else if (Math.abs(cx - MID) > 8 && cy > 80 && cy < 180) {
      if (EYE_COLORS.has(s.style.fill) || (w * h < 150 && s.style.fill !== '#ffffff')) part = 'eyes';
      else if (s.style.fill === '#ffffff') part = 'cheeks';
    }
    const attrs = { ...s.attrs };
    for (const [css, prop] of Object.entries(PAINT)) {
      const v = s.style[css];
      if (v && v !== PAINT_DEFAULTS[css]) attrs[prop] = v.replace(/px$/, '');
    }
    // The box in viewBox units, for working out how tall a character stands
    const box = [r2((x - fx) / SCALE), r2((y - fy) / SCALE - 8), r2(w / SCALE), r2(h / SCALE)];
    return { tag: s.tag, part, attrs, box };
  });
}

/** Colors that change between two cells drawn alike (same shapes in the same places, one suit each). */
function recolor(a, b) {
  const map = {};
  for (const s of a) {
    const twin = b.find((t) => t.tag === s.tag && s.box.every((v, i) => Math.abs(v - t.box[i]) <= 1));
    if (!twin) continue;
    for (const k of ['fill', 'stroke']) {
      const from = s.attrs[k], to = twin.attrs[k];
      if (!from || !to || from === to || from === 'none') continue;
      if (map[from] && map[from] !== to) throw new Error(`${from} turns into both ${map[from]} and ${to}`);
      map[from] = to;
    }
  }
  return map;
}

// Illustrator's "s" shorthand can bend a curve the owner didn't (see repair-smooth-curves.mjs); fix those first
const { svg, repairs } = repairSmoothCurves(await readFile(MASTER, 'utf8'));
const visible = repairs.filter((r) => r.moved >= 1);
console.log(`Repaired ${repairs.length} curve handles written as "s" (${visible.length} moved a unit or more):`);
for (const r of visible) console.log(`  path starting at ${r.at}, segment ${r.segment}: handle moved ${r.moved}`);
const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent(svg);
const raw = await page.evaluate(read, { cells: Object.keys(CELLS), geometry: GEOMETRY, paint: Object.keys(PAINT) });
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
const recolors = {
  octopus: recolor(cells.Hearts_number_cards.nodes, cells.Diamonds_number_cards.nodes),
  manta: recolor(cells.Spades_number_cards.nodes, cells.Clubs_number_cards.nodes),
};
// The Jacks' bow ties and the crowns' jewels come in each suit's own colors, so only bodies are recolored
const counts = Object.entries(cells).map(([id, c]) =>
  `${id}: ${['body', 'eyes', 'cheeks', 'crown'].map((p) => `${c.nodes.filter((n) => n.part === p).length} ${p}`).join(', ')}`);

await writeFile(OUT, `// Generated by scripts/octo-manta-art.mjs from design/art-export/01-characters-octo-manta.svg (the owner's drawings).
// Do not edit by hand: change the SVG and run \`npm run art:octo\`.

export type OctoMantaCellId = ${Object.keys(CELLS).map((id) => `'${id}'`).join(' | ')};

/** Which part of the character a shape belongs to, so eyes can be swapped and crowns lent between cells. */
export type OctoMantaPart = 'body' | 'eyes' | 'cheeks' | 'crown';

export interface OctoMantaNode {
  tag: 'path' | 'rect' | 'circle' | 'ellipse' | 'polygon' | 'polyline' | 'line';
  part: OctoMantaPart;
  /** Geometry in Illustrator coordinates and paint as React props. */
  attrs: Record<string, string>;
  /** x, y, width, height in the viewBox 0 -8 64 68. */
  box: [number, number, number, number];
}

export interface OctoMantaCell {
  /** Maps the cell from Illustrator coordinates into the viewBox 0 -8 64 68. */
  transform: string;
  /** Top-left of the cell's frame in Illustrator coordinates (the point that lands on 0, -8). */
  origin: [number, number];
  nodes: OctoMantaNode[];
}

export const OCTO_MANTA_CELLS: Record<OctoMantaCellId, OctoMantaCell> = ${JSON.stringify(cells, null, 1)};

/** Body colors from the owner's drawings: Hearts to Diamonds for the octopus, Spades to Clubs for the manta. */
export const OCTO_MANTA_RECOLOR = ${JSON.stringify(recolors, null, 1)} as const;
`);
console.log(counts.join('\n'));
console.log('recolor', JSON.stringify(recolors));
