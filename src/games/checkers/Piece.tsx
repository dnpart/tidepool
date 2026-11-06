// A checkers piece seen from above (the owner chose the mockup's Tokens, Nov 5): a cream counter for you and an ink
// one for the other side, and a king wearing the owner's King's crown with a red diamond (`art/KingCrown.tsx`).
import { KingCrown } from '../../art/KingCrown';
import type { Seat } from './rules';

/** Each side's counter: face, edge (also the rim's shadow) and the ring pressed into it. */
export const PIECE_COLORS: Record<Seat, { face: string; edge: string }> = {
  0: { face: '#FFFBF2', edge: '#B9AE98' },
  1: { face: '#24323B', edge: '#0B1A20' },
};

/** A counter drawn in the box 0 0 40 40. */
export function PieceArt({ seat, king }: { seat: Seat; king: boolean }) {
  const { face, edge } = PIECE_COLORS[seat];
  return (
    <g>
      <circle cx={20} cy={21.6} r={16} fill={edge} />
      <circle cx={20} cy={20} r={16} fill={face} stroke={edge} strokeWidth={1.2} />
      <circle cx={20} cy={20} r={11.5} fill="none" stroke={edge} strokeOpacity={0.55} strokeWidth={1.2} />
      {king && <KingCrown x={8.5} y={11} width={23} />}
    </g>
  );
}
