// Turns the owner's redrawn game pieces and sky pieces (design/art-export/08-pieces-ponds-sky-app-icon.svg) into
// src/art/piecesArt.ts. Run with `npm run art:pieces` after the SVG changes (needs Playwright's Chromium).
//
// Each piece keeps its shapes exactly as drawn (after repair-smooth-curves.mjs), in Illustrator's coordinates, with one
// transform per piece that maps its frame back into the box the app draws it in (the viewBox and scale the art export
// recorded in manifest.json). Gradients come along, and each drawing gets its own copy of them in the app.
// The ponds in this file are a mockup reference for now (the owner asked for mockups first), so they're not imported;
// nor are the suit symbols, which came back as they went out.
import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { repairSmoothCurves } from './repair-smooth-curves.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const FILE = '08-pieces-ponds-sky-app-icon.svg';
const MASTER = new URL(`../design/art-export/${FILE}`, import.meta.url);
const OUT = new URL('../src/art/piecesArt.ts', import.meta.url);
const manifest = require('../design/art-export/manifest.json').filter((m) => m.file === FILE);

/** The app's name for each piece, by its group id in the SVG. */
export const PIECES = {
  Bubble_Pals_and_Tide_Swap_Octopus: 'octo',
  Bubble_Pals_and_Tide_Swap_Manta: 'manta',
  Bubble_Pals_and_Tide_Swap_Starfish: 'star',
  Bubble_Pals_and_Tide_Swap_Turtle: 'turtle',
  Bubble_Pals_and_Tide_Swap_Jellyfish: 'jelly',
  Bubble_Pals_and_Tide_Swap_Pearl: 'pearl',
  Bubble_Pals_and_Tide_Swap_Pebble: 'pebble',
  Bubble_Pals_and_Tide_Swap_Bottom_shell: 'shellBottom',
  Bubble_Pals_and_Tide_Swap_Top_shell: 'shellTop',
  Coral_Stack_Coral_A: 'coralA',
  Coral_Stack_Coral_B: 'coralB',
  Coral_Stack_Coral_C: 'coralC',
  Coral_Stack_Sand: 'sand',
  Pond_Hop_marbles_Coral_marble: 'marble0',
  Pond_Hop_marbles_Blue_marble: 'marble1',
  Pond_Hop_marbles_Gold_marble: 'marble2',
  Pond_Hop_marbles_Purple_marble: 'marble3',
  Lagoon_and_Coral_Reef_Cloud: 'cloud',
  Winter_Snow_crystal: 'crystal',
  Forest_Falling_leaf: 'leaf',
};

const GEOMETRY = ['d', 'x', 'y', 'width', 'height', 'rx', 'ry', 'cx', 'cy', 'r', 'points', 'x1', 'y1', 'x2', 'y2'];
const PAINT = {
  fill: 'fill', 'fill-opacity': 'fillOpacity', 'fill-rule': 'fillRule', stroke: 'stroke', 'stroke-width': 'strokeWidth',
  'stroke-opacity': 'strokeOpacity', 'stroke-linejoin': 'strokeLinejoin', 'stroke-linecap': 'strokeLinecap',
  'stroke-miterlimit': 'strokeMiterlimit', opacity: 'opacity',
};
const DEFAULTS = {
  'fill-opacity': '1', 'fill-rule': 'nonzero', stroke: 'none', 'stroke-width': '1px', 'stroke-opacity': '1',
  'stroke-linejoin': 'miter', 'stroke-linecap': 'butt', 'stroke-miterlimit': '4', opacity: '1',
};

/** Runs in the page: each piece's shapes (geometry, resolved paint, full transform) and the gradients they use. */
function read({ ids, geometry, paint }) {
  const root = document.querySelector('svg');
  const toRoot = root.getCTM().inverse();
  const hex = (v) => {
    const m = /^rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)$/.exec(v.trim());
    if (!m) return v.replace(/url\(["']?#([^"')]+)["']?\)/, 'url(#$1)');
    return `#${[m[1], m[2], m[3]].map((n) => Math.round(Number(n)).toString(16).padStart(2, '0')).join('')}`;
  };
  const gradients = {};
  const pieces = {};
  for (const id of ids) {
    const group = document.getElementById(id);
    if (!group) throw new Error(`Missing group ${id}`);
    pieces[id] = [...group.querySelectorAll('path, rect, circle, ellipse, polygon, polyline, line')].map((el) => {
      const m = toRoot.multiply(el.getCTM());
      const attrs = {};
      for (const a of geometry) if (el.hasAttribute(a)) attrs[a] = el.getAttribute(a);
      const identity = [m.a - 1, m.b, m.c, m.d - 1, m.e, m.f].every((v) => Math.abs(v) < 1e-6);
      if (!identity) attrs.transform = `matrix(${[m.a, m.b, m.c, m.d, m.e, m.f].map((v) => Math.round(v * 1e5) / 1e5).join(' ')})`;
      const cs = getComputedStyle(el);
      const style = {};
      for (const p of paint) style[p] = p === 'fill' || p === 'stroke' ? hex(cs.getPropertyValue(p)) : cs.getPropertyValue(p);
      for (const p of ['fill', 'stroke']) {
        const ref = /^url\(#(.+)\)$/.exec(style[p]);
        if (!ref || gradients[ref[1]]) continue;
        const g = document.getElementById(ref[1]);
        const gAttrs = {};
        for (const a of g.attributes) if (a.name !== 'id') gAttrs[a.name] = a.value;
        gradients[ref[1]] = {
          tag: g.tagName,
          attrs: gAttrs,
          stops: [...g.querySelectorAll('stop')].map((s) => {
            const sc = getComputedStyle(s);
            return { offset: s.getAttribute('offset'), color: hex(sc.stopColor), opacity: sc.stopOpacity };
          }),
        };
      }
      return { tag: el.tagName, attrs, style };
    });
  }
  return { pieces, gradients };
}

// The browser's names for gradient attributes, as React props
const GRADIENT_PROPS = {
  cx: 'cx', cy: 'cy', fx: 'fx', fy: 'fy', r: 'r', x1: 'x1', y1: 'y1', x2: 'x2', y2: 'y2',
  gradientTransform: 'gradientTransform', gradientUnits: 'gradientUnits', spreadMethod: 'spreadMethod',
};

const { svg, repairs } = repairSmoothCurves(await readFile(MASTER, 'utf8'));
console.log(`Repaired ${repairs.length} curve handles written as "s" (${repairs.filter((r) => r.moved >= 1).length} moved a unit or more)`);
const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent(svg);
const raw = await page.evaluate(read, { ids: Object.keys(PIECES), geometry: GEOMETRY, paint: Object.keys(PAINT) });
await browser.close();

const r5 = (n) => Math.round(n * 1e5) / 1e5;
const pieces = {};
for (const [id, name] of Object.entries(PIECES)) {
  const m = manifest.find((p) => p.id === id);
  if (!m) throw new Error(`${id} is not in manifest.json`);
  const s = m.scale; // page units per app unit
  const [vx, vy] = m.viewBox;
  pieces[name] = {
    transform: `matrix(${r5(1 / s)} 0 0 ${r5(1 / s)} ${r5(vx - m.frame.x / s)} ${r5(vy - m.frame.y / s)})`,
    nodes: raw.pieces[id].map(({ tag, attrs, style }) => {
      const out = { ...attrs };
      for (const [css, prop] of Object.entries(PAINT)) {
        const v = style[css];
        if (v && v !== DEFAULTS[css]) out[prop] = v.replace(/px$/, '');
      }
      return { tag, attrs: out };
    }),
  };
}
const gradients = Object.fromEntries(Object.entries(raw.gradients).map(([id, g]) => [id, {
  tag: g.tag,
  attrs: Object.fromEntries(Object.entries(g.attrs).filter(([k]) => GRADIENT_PROPS[k]).map(([k, v]) => [GRADIENT_PROPS[k], v])),
  stops: g.stops,
}]));

await writeFile(OUT, `// Generated by scripts/pieces-art.mjs from design/art-export/${FILE} (the owner's drawings).
// Do not edit by hand: change the SVG and run \`npm run art:pieces\`.

export type PieceId = ${Object.values(PIECES).map((n) => `'${n}'`).join(' | ')};

export interface PieceNode {
  tag: 'path' | 'rect' | 'circle' | 'ellipse' | 'polygon' | 'polyline' | 'line';
  /** Geometry in Illustrator coordinates and paint as React props; fills may be url(#gradient). */
  attrs: Record<string, string>;
}

export interface PieceArt {
  /** Maps the piece from Illustrator coordinates into the box the app draws it in. */
  transform: string;
  nodes: PieceNode[];
}

export interface PieceGradient {
  tag: 'linearGradient' | 'radialGradient';
  attrs: Record<string, string>;
  stops: { offset: string; color: string; opacity: string }[];
}

export const PIECES: Record<PieceId, PieceArt> = ${JSON.stringify(pieces, null, 1)};

export const PIECE_GRADIENTS: Record<string, PieceGradient> = ${JSON.stringify(gradients, null, 1)};
`);
console.log(Object.entries(pieces).map(([n, p]) => `${n}: ${p.nodes.length}`).join(', '));
