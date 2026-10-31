import { BACKS } from '../../cards/CardBack';
import { useCardBack } from '../../decks/useDeck';

/** Two face-down cards and a little speech bubble with a question mark. */
export function FishyIcon({ size = 40 }: { size?: number }) {
  const back = BACKS[useCardBack()];
  const card = { width: 15, height: 21, rx: 3, fill: back.bg, stroke: 'var(--ink)', strokeWidth: 2 };
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <rect {...card} x={5} y={14} transform="rotate(-12 12 24)" />
      <rect {...card} x={14} y={13} transform="rotate(8 21 23)" />
      <path
        d="M24 4h10a4 4 0 0 1 4 4v6a4 4 0 0 1-4 4h-5l-4 3.5 0.8-3.5H24a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4z"
        fill="var(--surface)"
        stroke="var(--ink)"
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <text x={29} y={15.3} textAnchor="middle" style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 10, fill: 'var(--ink)' }}>?</text>
    </svg>
  );
}
