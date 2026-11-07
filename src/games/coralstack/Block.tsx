// Coral Stack's blocks, drawn by the owner (design/art-export/08-…svg, src/art/piecesArt.ts): coral in colors that are
// only decoration, and sand. The owner drew pink, orange and green (a, b, c); the lavender, blue and yellow corals that
// join at higher levels (d, e, f) are their pink coral recolored: body, its shade (× 0.9) and the soft dot. Drawn in a
// 32-unit box centered on (0, 0); `size` is the cell size.
import { ArtPiece } from '../../art/Piece';
import type { PieceId } from '../../art/piecesArt';
import type { Cell, Coral } from './rules';

/** The corals the owner drew (the art export shows only these). */
export const DRAWN_CORALS = ['a', 'b', 'c'] as const;

export const CORAL_COLORS: Record<Coral, string> = {
  a: '#F29A8A', b: '#F6B07A', c: '#7CC4A8', d: '#B8A2E6', e: '#86BCE6', f: '#F2CF6B',
};

/** What people call each color, for the words on screen. */
export const CORAL_NAMES: Record<Coral, string> = {
  a: 'pink', b: 'orange', c: 'green', d: 'lavender', e: 'blue', f: 'yellow',
};

const ART: Record<Exclude<Cell, null>, PieceId> = {
  a: 'coralA', b: 'coralB', c: 'coralC', d: 'coralA', e: 'coralA', f: 'coralA', sand: 'sand',
};

/** The pink coral's body, shade and soft dot, swapped for each recolored coral. */
const RECOLOR: Partial<Record<Coral, Record<string, string>>> = {
  d: { '#f29a8a': '#b8a2e6', '#da8b7c': '#a692cf', '#ffc9c2': '#e6dbff' },
  e: { '#f29a8a': '#86bce6', '#da8b7c': '#79a9cf', '#ffc9c2': '#d2ebff' },
  f: { '#f29a8a': '#f2cf6b', '#da8b7c': '#daba60', '#ffc9c2': '#fff1bf' },
};

export function Block({ kind, cx, cy, size, className, style }: {
  kind: Exclude<Cell, null>;
  cx: number;
  cy: number;
  size: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    // The outer group is free for CSS animations; the position lives on the inner one so they don't clash
    <g className={className} style={style}>
      <g transform={`translate(${cx} ${cy}) scale(${size / 32})`}>
        <ArtPiece id={ART[kind]} recolor={kind === 'sand' ? undefined : RECOLOR[kind]} />
      </g>
    </g>
  );
}
