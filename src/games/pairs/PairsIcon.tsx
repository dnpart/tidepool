import { INK_DARK } from '../../art/color';
import { FoxHeadAt } from '../../art/FoxOwl';
import { DECKS } from '../../decks/decks';
import { useDeck } from '../../decks/useDeck';
import { useTheme } from '../../theme/ThemeProvider';

/** Two face-up cards side by side with the same face (an octopus, or the fox's head). */
export function PairsIcon({ size = 40 }: { size?: number }) {
  const { octo } = useTheme();
  const deck = useDeck();
  const card = { width: 15, height: 21, rx: 3, fill: DECKS[deck].face, stroke: 'var(--ink)', strokeWidth: 2 };
  const face = (cx: number, cy: number) => deck === 'arctic' ? (
    <FoxHeadAt x={cx - 5.5} y={cy - 4.6} width={11} />
  ) : (
    <>
      <circle cx={cx} cy={cy} r={4.8} fill={octo} />
      <path
        d={`M${cx - 2.2} ${cy - 0.2} q0.8 -1 1.6 0 M${cx + 0.6} ${cy - 0.2} q0.8 -1 1.6 0 M${cx - 1} ${cy + 1.8} q1 0.9 2 0`}
        stroke={INK_DARK}
        strokeWidth={0.9}
        fill="none"
        strokeLinecap="round"
      />
    </>
  );
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <g transform="rotate(-7 12.5 20)">
        <rect {...card} x={5} y={9.5} />
        {face(12.5, 20)}
      </g>
      <g transform="rotate(7 27.5 20)">
        <rect {...card} x={20} y={9.5} />
        {face(27.5, 20)}
      </g>
    </svg>
  );
}
