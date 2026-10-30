import { SUIT_PATHS } from '../../art/Suit';
import { SUIT_STYLE } from '../../cards/deck';
import { useTheme } from '../../theme/ThemeProvider';

/** An Ace and a King fanned, with "21" in a small accent circle. */
export function BlackjackIcon({ size = 40 }: { size?: number }) {
  const { accent, onAccent } = useTheme();
  const card = { width: 15, height: 21, rx: 3, fill: '#FFFDF8', stroke: 'var(--ink)', strokeWidth: 2 };
  const letter = { fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 7 } as const;
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <g transform="rotate(-12 13 24)">
        <rect {...card} x={6} y={11} />
        <text x={8.5} y={18.5} style={{ ...letter, fill: 'var(--rank-hearts)' }}>A</text>
        <path d={SUIT_PATHS.hearts} fill={SUIT_STYLE.hearts.symbol} transform="translate(10 21) scale(0.3)" />
      </g>
      <g transform="rotate(10 25 24)">
        <rect {...card} x={17} y={10} />
        <text x={19.5} y={17.5} style={{ ...letter, fill: SUIT_STYLE.spades.symbol }}>K</text>
        <path d={SUIT_PATHS.spades} fill={SUIT_STYLE.spades.symbol} transform="translate(21 20) scale(0.3)" />
      </g>
      <circle cx={31} cy={9} r={7.5} fill={accent} />
      <text x={31} y={11.6} textAnchor="middle" style={{ ...letter, fontSize: 7.5, fill: onAccent }}>21</text>
    </svg>
  );
}
