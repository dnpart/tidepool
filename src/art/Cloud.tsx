import { ArtPiece } from './Piece';

/** The owner's cloud (viewBox 0 0 80 44, src/art/piecesArt.ts). */
export function Cloud({
  width = 120, className, style,
}: { width?: number; className?: string; style?: React.CSSProperties }) {
  return (
    <svg width={width} height={width * 0.55} viewBox="0 0 80 44" className={className} style={style} aria-hidden="true">
      <ArtPiece id="cloud" />
    </svg>
  );
}
