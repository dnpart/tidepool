import { INK_DARK } from '../../art/color';
import { DECKS } from '../../decks/decks';
import { useDeck } from '../../decks/useDeck';
import { useTheme } from '../../theme/ThemeProvider';

/** Two cards with speed lines; the second card is a manta, or a snowy owl (as in the Fox + Owl mockup). */
export function SpeedIcon({ size = 40 }: { size?: number }) {
  const { manta, accent } = useTheme();
  const deck = useDeck();
  const owl = deck === 'arctic';
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <path d="M3 15h6M2 20h7M3 25h6" stroke={accent} strokeWidth={2} strokeLinecap="round" />
      <rect x={11} y={9} width={14} height={20} rx={3} fill={DECKS[deck].face} stroke="var(--ink)" strokeWidth={2} transform="rotate(-8 18 19)" />
      <rect x={20} y={11} width={14} height={20} rx={3} fill={owl ? '#ECEBFC' : manta} stroke="var(--ink)" strokeWidth={2} transform="rotate(8 27 21)" />
      {owl ? (
        <g transform="rotate(8 27 21)">
          <circle cx={24.6} cy={19.5} r={1.2} fill="#3E4A5A" />
          <circle cx={29.4} cy={19.5} r={1.2} fill="#3E4A5A" />
          <path d="M26.1 21.3 L27.9 21.3 L27 23.4 Z" fill="#5873A6" />
        </g>
      ) : (
        <g transform="rotate(8 27 21)">
          <circle cx={25} cy={19.5} r={0.9} fill={INK_DARK} />
          <circle cx={29} cy={19.5} r={0.9} fill={INK_DARK} />
          <path d="M25.6 22.4 q1.4 1.2 2.8 0" stroke={INK_DARK} strokeWidth={0.9} fill="none" strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
}
