// Pieces shared by the Bee + Sloth, Mushroom + Moth and Cats characters: crowns, bow ties, mustaches, suit badges and
// the art's soft light side. The crowns, bow tie and mustache are the owner's, from their octopus drawings
// (royalArt.ts, Nov 22); the badges and light side come from design/garden-mockup/art.js.
import { createElement } from 'react';
import type { Hat } from './Creature';
import { ROYAL_BOWTIE, ROYAL_CROWNS, ROYAL_LASHES, ROYAL_MUSTACHE, type RoyalPart } from './royalArt';
import type { Suit } from '../cards/deck';
import { shade } from './color';
import { SUIT_PATHS } from './Suit';

export const stroke = (color: string, width = 1.6) => ({
  fill: 'none', stroke: color, strokeWidth: width, strokeLinecap: 'round', strokeLinejoin: 'round',
} as const);

/** Draws one of the owner's parts `width` wide, centered on `cx`, its bottom on `bottom` (or its middle on `cy`). */
function Fitted({ part, cx, width, bottom, cy, recolor }: {
  part: RoyalPart; cx: number; width: number; bottom?: number; cy?: number; recolor?: Record<string, string>;
}) {
  const [x, y, w, h] = part.box;
  const k = width / w;
  const ty = bottom !== undefined ? bottom - (y + h) * k : (cy ?? 0) - (y + h / 2) * k;
  const tx = cx - (x + w / 2) * k;
  const paint = (v?: string) => (v && recolor?.[v.toLowerCase()]) || v;
  return (
    <g transform={`translate(${r3(tx)} ${r3(ty)}) scale(${r3(k)})`}>
      <g transform={part.transform}>
        {part.nodes.map(({ tag, attrs }, i) => createElement(tag, { key: i, ...attrs, fill: paint(attrs.fill), stroke: paint(attrs.stroke) }))}
      </g>
    </g>
  );
}
const r3 = (v: number) => Math.round(v * 1000) / 1000;

/**
 * Where each character's crowns sit: [bottom, width] for the King's and the Queen's. The owner's rule (Nov 22, as on their
 * octopus): the crown's bottom corners line up with the edges of the head, so each width is the head's width at the
 * crown's bottom, measured from the head shapes. The bottom sits a little into the head (6% of its height, the Queen's
 * half a unit higher), and on the moth just above its eyes for both.
 */
export const CROWN_FIT = {
  sloth: { king: [6.7, 17.9], queen: [6.2, 15.9] },
  bee: { king: [14.5, 19.9], queen: [14, 18] },
  mushroom: { king: [4.6, 20], queen: [4.1, 16.7] },
  cat: { king: [7.8, 19], queen: [7.3, 16.4] },
  // The moth's Queen sits as low as its King, so it covers the bottom of the antennae (the owner, Nov 23)
  moth: { king: [19.9, 9.2], queen: [19.9, 9.2] },
} as const;

/** The owner's Queen or King crown for the suit (from their octopus drawings), fitted to the character's head. */
export function Crown({ hat, suit, fit, cx = 32, dy = 0 }: {
  hat?: Hat; suit: Suit; fit: keyof typeof CROWN_FIT; cx?: number; dy?: number;
}) {
  if (!hat) return null;
  const [bottom, width] = CROWN_FIT[fit][hat];
  return <Fitted part={ROYAL_CROWNS[hat][suit]} cx={cx} width={width} bottom={bottom + dy} />;
}

/** The owner's bow tie in `color` (its outline and knot a shade darker), centered on (cx, cy), `width` wide. */
export function BowTie({ cx, cy, color, width = 13.6 }: { cx: number; cy: number; color?: string; width?: number }) {
  if (!color) return null;
  const recolor = { [ROYAL_BOWTIE.wing.toLowerCase()]: color, [ROYAL_BOWTIE.dark.toLowerCase()]: shade(color, 0.75) };
  return <Fitted part={ROYAL_BOWTIE} cx={cx} cy={cy} width={width} recolor={recolor} />;
}

/** The owner's King mustache, centered on (cx, cy), `width` wide; `color` only where theirs wouldn't show (black fur). */
export function Mustache({ cx = 32, cy, width = 11, color }: { cx?: number; cy: number; width?: number; color?: string }) {
  const own = ROYAL_MUSTACHE.nodes[0].attrs.fill.toLowerCase();
  return <Fitted part={ROYAL_MUSTACHE} cx={cx} cy={cy} width={width} recolor={color ? { [own]: color } : undefined} />;
}

/**
 * The owner's Queen lash (from their manta) for one eye, fitted to that eye's box (x, y, width, height): sized by the
 * eye's width and kept at the same spot on its top outer corner, in `color` (the eye's own).
 */
const LASH_THIN = 0.65;

export function Lash({ side, eye, color }: { side: 'left' | 'right'; eye: readonly number[]; color: string }) {
  const src = ROYAL_LASHES[side];
  const [ex, ey, ew] = src.eye;
  const [lx, ly] = src.box;
  const k = eye[2] / ew;
  const tx = side === 'left' ? eye[0] + (lx - ex) * k : eye[0] + eye[2] - (ex + ew - lx) * k;
  const ty = eye[1] + (ly - ey) * k;
  // Thinner than the manta's (the owner, Nov 23): squeezed sideways about its middle, keeping its length
  const cx = tx + (src.box[2] * k) / 2;
  return (
    <g transform={`translate(${r3(cx)} 0) scale(${LASH_THIN} 1) translate(${r3(-cx)} 0)`}>
      <g transform={`translate(${r3(tx - lx * k)} ${r3(ty - ly * k)}) scale(${r3(k)})`}>
        <g transform={src.transform}>
          {src.nodes.map(({ tag, attrs }, i) => createElement(tag, { key: i, ...attrs, fill: color }))}
        </g>
      </g>
    </g>
  );
}

export function Badge({ suit, color, x, y, scale }: { suit: Suit; color?: string; x: number; y: number; scale: number }) {
  if (!color) return null;
  return <path transform={`translate(${x} ${y}) scale(${scale})`} d={SUIT_PATHS[suit]} fill={color} />;
}

/** The lighter right side of a shape (the art's soft vertical split): `split` painted inside the clip shape. */
export function LightHalf({ id, clip, split, color }: { id: string; clip: React.ReactNode; split: string; color: string }) {
  return (
    <>
      <clipPath id={id}>{clip}</clipPath>
      <path clipPath={`url(#${id})`} fill={color} d={split} />
    </>
  );
}
