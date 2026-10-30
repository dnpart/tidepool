// Turns the owner's Illustrator file (design/fox-owl-deck.svg) into src/art/foxOwlArt.ts.
// Run with `npm run art` after the SVG changes. Every shape is kept exactly as drawn; each cell gets a
// transform that maps it from the 6× Illustrator layout back into the creatures' 0 -8 64 68 viewBox.
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

/** Illustrator layer name -> cell id used in the app, with the cell's column and row in the 448 × 528 grid. */
export const CELLS = {
  Fox_Hearts_MASTER: ['foxHearts', 0, 0],
  Fox_Diamonds: ['foxDiamonds', 1, 0],
  Waving_fox: ['foxWaving', 2, 0],
  Sleepy_fox: ['foxSleepy', 3, 0],
  Queen_fox: ['foxQueen', 4, 0],
  Owl_Spades_MASTER: ['owlSpades', 0, 1],
  Owl_Clubs: ['owlClubs', 1, 1],
  Sleepy_owl: ['owlSleepy', 2, 1],
  Jack_owl: ['owlJack', 3, 1],
  King_owl: ['owlKing', 4, 1],
  Jack_fox: ['foxJack', 0, 2],
  King_fox: ['foxKing', 1, 2],
  Queen_owl: ['owlQueen', 2, 2],
};

const origin = (col, row) => [64 + 448 * col, 168 + 528 * row];

// SVG presentation attributes the art uses, as React props
const ATTRS = {
  d: 'd', cx: 'cx', cy: 'cy', r: 'r', rx: 'rx', ry: 'ry', x: 'x', y: 'y', width: 'width', height: 'height',
  points: 'points', transform: 'transform', fill: 'fill', stroke: 'stroke', opacity: 'opacity',
  'stroke-width': 'strokeWidth', 'stroke-linecap': 'strokeLinecap', 'stroke-linejoin': 'strokeLinejoin',
  'stroke-miterlimit': 'strokeMiterlimit', 'fill-rule': 'fillRule',
};
const SHAPES = new Set(['g', 'path', 'circle', 'ellipse', 'rect', 'polygon', 'line', 'polyline']);

/** A small parser for Illustrator's SVG export: elements, quoted attributes and the <style> text. */
function parse(svg) {
  const root = { tag: 'root', attrs: {}, children: [] };
  const stack = [root];
  const token = /<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<(\/?)([\w:-]+)((?:\s+[\w:-]+="[^"]*")*)\s*(\/?)>|([^<]+)/g;
  for (const m of svg.matchAll(token)) {
    const [, close, tag, attrText, selfClose, text] = m;
    const top = stack[stack.length - 1];
    if (text !== undefined) {
      if (top.tag === 'style') top.text = (top.text ?? '') + text;
      continue;
    }
    if (!tag) continue;
    if (close) {
      stack.pop();
      continue;
    }
    const attrs = Object.fromEntries([...attrText.matchAll(/([\w:-]+)="([^"]*)"/g)].map((a) => [a[1], a[2]]));
    const node = { tag, attrs, children: [] };
    top.children.push(node);
    if (!selfClose) stack.push(node);
  }
  return root;
}

function classStyles(styleText) {
  const map = {};
  for (const [, selectors, body] of styleText.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
    const decls = Object.fromEntries(
      body.split(';').filter((d) => d.includes(':')).map((d) => d.split(':').map((s) => s.trim())),
    );
    for (const sel of selectors.split(',')) {
      const name = sel.trim().replace(/^\./, '');
      map[name] = { ...map[name], ...decls };
    }
  }
  return map;
}

/** Illustrator ids get suffixes for duplicates ("Eyes_51", "Tail2", "Lashes_qo"); the name is the id without them. */
const layerName = (id) => id.replace(/(_(\d+|jf|kf|qo|jack))+$/, '').replace(/(?<=[A-Za-z])\d+$/, '');

function convert(node, css) {
  if (!SHAPES.has(node.tag)) return null;
  const props = {};
  for (const cls of (node.attrs.class ?? '').split(/\s+/).filter(Boolean)) {
    for (const [k, v] of Object.entries(css[cls] ?? {})) if (ATTRS[k]) props[ATTRS[k]] = v.replace(/px$/, '');
  }
  for (const [k, v] of Object.entries(node.attrs)) if (ATTRS[k]) props[ATTRS[k]] = v;
  const out = { tag: node.tag };
  if (node.attrs.id) out.name = layerName(node.attrs.id);
  out.attrs = props;
  const children = node.children.map((c) => convert(c, css)).filter(Boolean);
  if (children.length) out.children = children;
  return out;
}

/** Which cell a loose top-level shape belongs to (the waving fox's toe beans sit outside its layer). */
function cellAt(node) {
  const x = Number(node.attrs.cx ?? node.attrs.x);
  const y = Number(node.attrs.cy ?? node.attrs.y);
  const col = Math.floor((x - 32) / 448);
  const row = Math.floor((y - 104) / 528);
  return Object.keys(CELLS).find((k) => CELLS[k][1] === col && CELLS[k][2] === row);
}

export function buildArt(svg) {
  const doc = parse(svg).children.find((n) => n.tag === 'svg');
  const styleNode = doc.children.find((n) => n.tag === 'defs')?.children.find((n) => n.tag === 'style');
  const css = classStyles(styleNode?.text ?? '');
  const cells = {};
  for (const [layer, [id, col, row]] of Object.entries(CELLS)) {
    const group = doc.children.find((n) => n.attrs.id === layer);
    if (!group) throw new Error(`Missing layer ${layer} in fox-owl-deck.svg`);
    const [ox, oy] = origin(col, row);
    const layers = group.children.map((c) => convert(c, css)).filter(Boolean);
    const loose = doc.children.filter((n) => !n.attrs.id && SHAPES.has(n.tag) && cellAt(n) === layer);
    layers.push(...loose.map((n) => convert(n, css)));
    cells[id] = { transform: `matrix(${1 / 6} 0 0 ${1 / 6} ${-ox / 6} ${-oy / 6})`, origin: [ox, oy], layers };
  }
  const ids = Object.values(CELLS).map(([id]) => `'${id}'`).join(' | ');
  return `// Generated by scripts/fox-owl-art.mjs from design/fox-owl-deck.svg (the owner's Illustrator file).
// Do not edit by hand: change the SVG and run \`npm run art\`.

export type FoxOwlCellId = ${ids};

export interface ArtNode {
  tag: 'g' | 'path' | 'circle' | 'ellipse' | 'rect' | 'polygon' | 'line' | 'polyline';
  /** Illustrator layer name without its duplicate suffix, e.g. "Eyes", "Lashes", "Inner_ears_suit_color". */
  name?: string;
  attrs: Record<string, string>;
  children?: ArtNode[];
}

export interface ArtCell {
  /** Maps the cell from Illustrator coordinates into the viewBox 0 -8 64 68. */
  transform: string;
  /** Top-left of the cell in Illustrator coordinates (the point that lands on 0, -8). */
  origin: [number, number];
  layers: ArtNode[];
}

export const FOX_OWL_CELLS: Record<FoxOwlCellId, ArtCell> = ${JSON.stringify(cells, null, 1)};
`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const svg = await readFile(new URL('../design/fox-owl-deck.svg', import.meta.url), 'utf8');
  await writeFile(new URL('../src/art/foxOwlArt.ts', import.meta.url), buildArt(svg));
  console.log('wrote src/art/foxOwlArt.ts');
}
