// The owner's crowns, bow tie and mustache, taken from their octopus drawings (src/art/octoMantaArt.ts, imported from
// design/art-export/01-characters-octo-manta.svg) into src/art/royalArt.ts, so every other character can wear them.
// Run with `npm run art:royal` after `npm run art:octo`.
//
// Queen and King crowns are taken per suit from <Suit>_Queen / <Suit>_King: the shapes tagged crown, plus any shape
// sitting on the crown that the octopus import tagged otherwise (one white jewel). The bow tie is the Hearts Jack's
// (wings with an outline, the knot and two stitches); its colors are recolored to each card's suit color (wing color and
// a darker shade). The mustache is the Hearts King's. The lashes are the Spades Queen manta's (one for each eye, at
// its top outer corner), with the eye each belongs to, so they can be fitted to another character's eyes. Shapes keep their numbers as drawn, with the octopus cell's
// transform; box is each part's extent in the characters' viewBox, so it can be fitted onto another character.
import { writeFile } from 'node:fs/promises';

const { OCTO_MANTA_CELLS: cells } = await import('../src/art/octoMantaArt.ts');
const OUT = new URL('../src/art/royalArt.ts', import.meta.url);
const SUITS = ['hearts', 'diamonds', 'spades', 'clubs'];
const cap = (s) => s[0].toUpperCase() + s.slice(1);

const union = (nodes) => {
  const x0 = Math.min(...nodes.map((n) => n.box[0])), y0 = Math.min(...nodes.map((n) => n.box[1]));
  const x1 = Math.max(...nodes.map((n) => n.box[0] + n.box[2])), y1 = Math.max(...nodes.map((n) => n.box[1] + n.box[3]));
  return [x0, y0, x1 - x0, y1 - y0].map((v) => +v.toFixed(2));
};
const part = (cellId, nodes) => ({ transform: cells[cellId].transform, nodes: nodes.map(({ tag, attrs }) => ({ tag, attrs })), box: union(nodes) });

function crown(cellId) {
  const nodes = cells[cellId].nodes;
  const tagged = nodes.filter((n) => n.part === 'crown');
  const [x, y, w, h] = union(tagged);
  // A jewel the import tagged as body: it sits on the crown, above its lower edge, inside its width
  const stray = nodes.filter((n) => n.part !== 'crown' && n.box[1] + n.box[3] < y + h * 0.6
    && n.box[0] >= x - 1 && n.box[0] + n.box[2] <= x + w + 1);
  return part(cellId, nodes.filter((n) => tagged.includes(n) || stray.includes(n)));
}

function bowtie(cellId) {
  const nodes = cells[cellId].nodes;
  const wings = nodes.filter((n) => n.attrs.stroke && n.box[1] > 20);
  if (wings.length !== 2) throw new Error(`${cellId}: expected two outlined bow tie wings, found ${wings.length}`);
  const wing = wings[0].attrs.fill, dark = wings[0].attrs.stroke;
  const [x, y, w, h] = union(wings);
  const inside = (n) => n.box[0] >= x - 0.5 && n.box[1] >= y - 0.5 && n.box[0] + n.box[2] <= x + w + 0.5 && n.box[1] + n.box[3] <= y + h + 0.5;
  const tie = nodes.filter((n) => inside(n) && (n.attrs.fill === wing || n.attrs.fill === dark));
  return { ...part(cellId, tie), wing, dark };
}

function mustache(cellId) {
  const found = cells[cellId].nodes.filter((n) => n.part === 'body' && n.box[2] > 9 && n.box[3] < 7 && n.box[1] > 20 && n.box[1] < 40
    && /^#1b2533$/i.test(n.attrs.fill ?? ''));
  if (found.length !== 1) throw new Error(`${cellId}: expected one mustache, found ${found.length}`);
  return part(cellId, found);
}

function lashes(cellId) {
  const nodes = cells[cellId].nodes.filter((n) => n.part === 'eyes' && /^#1b2533$/i.test(n.attrs.fill ?? ''));
  const eyes = nodes.filter((n) => n.box[2] > 4).sort((a, b) => a.box[0] - b.box[0]);
  const small = nodes.filter((n) => n.box[2] <= 4).sort((a, b) => a.box[0] - b.box[0]);
  if (eyes.length !== 2 || small.length !== 2) throw new Error(`${cellId}: expected two eyes and two lashes`);
  return { left: { ...part(cellId, [small[0]]), eye: eyes[0].box }, right: { ...part(cellId, [small[1]]), eye: eyes[1].box } };
}

const crowns = { queen: {}, king: {} };
for (const suit of SUITS) {
  crowns.queen[suit] = crown(`${cap(suit)}_Queen`);
  crowns.king[suit] = crown(`${cap(suit)}_King`);
}
const tie = bowtie('Hearts_Jack');
const stache = mustache('Hearts_King');
const lash = lashes('Spades_Queen');
for (const suit of SUITS) console.log(suit, 'queen', crowns.queen[suit].nodes.length, 'king', crowns.king[suit].nodes.length);
console.log('bow tie', tie.nodes.length, tie.box, 'mustache', stache.box);

await writeFile(OUT, `// Made by scripts/royal-art.mjs from the owner's octopus drawings (octoMantaArt.ts). Don't edit by hand.
// The owner's crowns (per suit), bow tie and mustache, as drawn, for every character to wear.

export interface RoyalPart {
  /** The octopus cell's transform, from the drawing's coordinates into the viewBox 0 -8 64 68. */
  transform: string;
  nodes: { tag: string; attrs: Record<string, string> }[];
  /** x, y, width, height in that viewBox. */
  box: [number, number, number, number];
}
type Suit = 'hearts' | 'diamonds' | 'spades' | 'clubs';

export const ROYAL_CROWNS: Record<'queen' | 'king', Record<Suit, RoyalPart>> = ${JSON.stringify(crowns, null, 1)};

/** Recolored per suit: \`wing\` becomes the suit color, \`dark\` a darker shade of it. */
export const ROYAL_BOWTIE: RoyalPart & { wing: string; dark: string } = ${JSON.stringify(tie, null, 1)};

export const ROYAL_MUSTACHE: RoyalPart = ${JSON.stringify(stache, null, 1)};

/** A Queen's lashes, one per eye, each with the box of the eye it sits on (x, y, width, height in the viewBox). */
export const ROYAL_LASHES: Record<'left' | 'right', RoyalPart & { eye: [number, number, number, number] }> = ${JSON.stringify(lash, null, 1)};
`);
