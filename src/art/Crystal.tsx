import { ArtPiece } from './Piece';

/** The owner's six-armed snow crystal (24×24 box), in the theme's crystal color by default. Inside another SVG, pass x and y. */
export function Crystal({
  size = 20, color = 'var(--crystal)', x, y,
}: { size?: number; color?: string; strokeWidth?: number; x?: number; y?: number }) {
  return (
    <svg x={x} y={y} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <ArtPiece id="crystal" recolor={{ '#8fb2d0': color }} />
    </svg>
  );
}
