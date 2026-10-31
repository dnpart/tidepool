import { PIP_COLORS } from './Domino';

const SPOTS: Record<number, [number, number][]> = {
  3: [[0, 0], [1, 1], [2, 2]], 5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]], 6: [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]],
};

/** Two tiles end to end, 3 | 5 meeting 5 | 6, outlined in ink like the other game icons. */
export function DominoesIcon({ size = 40 }: { size?: number }) {
  const half = 9;
  const pips = (n: number, ox: number) =>
    SPOTS[n].map(([c, r], i) => (
      <circle key={`${ox}-${i}`} cx={ox + 2 + c * 2.5} cy={-half / 2 + 2 + r * 2.5} r={1.05} fill={PIP_COLORS[n]} />
    ));
  const tile = (x: number, a: number, b: number) => (
    <g>
      <rect x={x} y={-half / 2} width={half * 2} height={half} rx={2.4} fill="#FFFDF8" stroke="var(--ink)" strokeWidth={1.8} />
      <path d={`M${x + half} ${-half / 2 + 1.8} V${half / 2 - 1.8}`} stroke="var(--ink)" strokeWidth={1.2} opacity={0.45} />
      {pips(a, x)}
      {pips(b, x + half)}
    </g>
  );
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <g transform="translate(20 20) rotate(-28)">
        {tile(-18.5, 3, 5)}
        {tile(0.5, 5, 6)}
      </g>
    </svg>
  );
}
