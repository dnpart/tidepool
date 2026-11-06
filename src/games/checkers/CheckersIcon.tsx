import { PieceArt } from './Piece';

/** Two counters on a corner of the board, the front one crowned. */
export function CheckersIcon({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <rect x={3} y={3} width={17} height={17} rx={3} fill="color-mix(in srgb, var(--accent) 45%, var(--surface))" />
      <rect x={20} y={20} width={17} height={17} rx={3} fill="color-mix(in srgb, var(--accent) 45%, var(--surface))" />
      <svg x={13} y={2} width={24} height={24} viewBox="0 0 40 40"><PieceArt seat={1} king={false} /></svg>
      <svg x={3} y={13} width={25} height={25} viewBox="0 0 40 40"><PieceArt seat={0} king /></svg>
    </svg>
  );
}
