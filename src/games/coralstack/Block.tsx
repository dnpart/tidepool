// Coral Stack's blocks, drawn by the owner (design/art-export/08-…svg, src/art/piecesArt.ts): three coral colors that
// are only decoration, and sand. Drawn in a 32-unit box centered on (0, 0); `size` is the cell size.
import { ArtPiece } from '../../art/Piece';
import type { Cell } from './rules';

export const CORAL_COLORS = { a: '#F29A8A', b: '#F6B07A', c: '#7CC4A8' } as const;
const ART = { a: 'coralA', b: 'coralB', c: 'coralC', sand: 'sand' } as const;

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
      <g transform={`translate(${cx} ${cy}) scale(${size / 32})`}><ArtPiece id={ART[kind]} /></g>
    </g>
  );
}
