// The King's crown from the owner's Fox + Owl drawings (the Hearts King, design/art-export/02-characters-fox-owl.svg),
// for checkers kings (Nov 5, the owner's choice): the gold crown and its three white diamonds as drawn, with the suit in
// its middle swapped for a red diamond the same shape as the white ones.
import { FOX_OWL_CELLS, type FoxOwlNode } from './foxOwlArt';

const GOLD = '#f6c752';
export const CROWN_RED = '#D23F5B';

const cell = FOX_OWL_CELLS.Hearts_King;
const gold = cell.nodes.find((n) => n.attrs.fill === GOLD)!;
const within = (n: FoxOwlNode) => {
  const [x, y, w, h] = n.box;
  const [gx, gy, gw, gh] = gold.box;
  return n !== gold && x >= gx && y >= gy - 1 && x + w <= gx + gw && y + h <= gy + gh;
};
/** The three white diamonds, as drawn. */
const gems = cell.nodes.filter((n) => within(n) && n.attrs.fill === '#ffffff');
/** The suit symbol in the middle, which the red diamond replaces (its center, in viewBox units). */
const suit = cell.nodes.find((n) => within(n) && n.attrs.fill !== '#ffffff')!;
const [sx, sy, sw, sh] = suit.box;
const top = gems.reduce((a, b) => (b.box[1] < a.box[1] ? b : a));

// Back from viewBox units into the cell's Illustrator units, where the crown is drawn
const [, , , , ox, oy] = cell.transform.match(/-?[\d.]+/g)!.map(Number);
const toArt = (x: number, y: number) => [(x - ox) * 4, (y - oy) * 4];
const [cx, cy] = toArt(sx + sw / 2, sy + sh / 2);
/** The red diamond: the white ones' rounded square, as wide as the suit it replaces. */
const side = (Math.max(sw, sh) * 4) / Math.SQRT2;
const corner = (Number(top.attrs.rx) / Number(top.attrs.width)) * side;

/** The crown's box in viewBox units, with room for its outline. */
export const CROWN_BOX = { x: gold.box[0] - 0.6, y: gold.box[1] - 0.6, w: gold.box[2] + 1.2, h: gold.box[3] + 1.2 };

/** The crown drawn in its cell's viewBox units (0 -8 64 68), for use inside another svg. */
export function KingCrownArt() {
  return (
    <g transform={cell.transform}>
      <path {...gold.attrs} />
      {gems.map((n, i) => <rect key={i} {...n.attrs} />)}
      <rect x={-side / 2} y={-side / 2} width={side} height={side} rx={corner} ry={corner} fill={CROWN_RED}
        transform={`translate(${Math.round(cx * 10) / 10} ${Math.round(cy * 10) / 10}) rotate(45)`} />
    </g>
  );
}

/** The crown placed inside another svg, `width` wide with its top-left at (x, y). */
export function KingCrown({ x, y, width }: { x: number; y: number; width: number }) {
  return (
    <svg x={x} y={y} width={width} height={(width * CROWN_BOX.h) / CROWN_BOX.w}
      viewBox={`${CROWN_BOX.x} ${CROWN_BOX.y} ${CROWN_BOX.w} ${CROWN_BOX.h}`} overflow="visible">
      <KingCrownArt />
    </svg>
  );
}
