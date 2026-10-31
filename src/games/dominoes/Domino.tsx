// Domino tiles, ported from design/garden-mockup/games.js (`domino` and `dominoBack`) with the same numbers.

/** Each number has its own pip color, so matching ends are quick to see without counting. */
export const PIP_COLORS: Record<number, string> = {
  1: '#D23F5B', 2: '#E8812F', 3: '#C99A12', 4: '#2E9A6E', 5: '#3B78C4', 6: '#7A5BC4',
};
const PIP_SPOTS: Record<number, [number, number][]> = {
  0: [], 1: [[1, 1]], 2: [[0, 0], [2, 2]], 3: [[0, 0], [1, 1], [2, 2]], 4: [[0, 0], [2, 0], [0, 2], [2, 2]],
  5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]], 6: [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]],
};
const FACE = '#FFFDF8';
const EDGE = '#D9CFBE';

/**
 * A face-up domino: `a` on the left (or top when `vertical`), `b` on the right (or bottom). Horizontal tiles are 2:1;
 * `size` is the short side in px. The svg is 4px larger than the tile so the glow ring fits.
 */
export function Domino({
  a, b, size, vertical = false, glow = false, x, y, className, style,
}: {
  a: number; b: number; size: number; vertical?: boolean; glow?: boolean;
  /** Position when nested in another svg. */
  x?: number; y?: number;
  className?: string; style?: React.CSSProperties;
}) {
  const W = vertical ? size : size * 2;
  const H = vertical ? size * 2 : size;
  const half = (n: number, ox: number, oy: number) =>
    PIP_SPOTS[n].map(([c, r], i) => {
      const [col, row] = vertical ? [c, r] : [r, c];
      return (
        <circle
          key={`${ox}-${oy}-${i}`}
          cx={ox + size * (0.24 + col * 0.26)}
          cy={oy + size * (0.24 + row * 0.26)}
          r={size * 0.085}
          fill={PIP_COLORS[n]}
        />
      );
    });
  const [bx, by] = vertical ? [0, size] : [size, 0];
  return (
    <svg
      width={W + 4}
      height={H + 4}
      viewBox={`-2 -2 ${W + 4} ${H + 4}`}
      x={x}
      y={y}
      overflow="visible"
      aria-hidden="true"
      className={className}
      style={style}
    >
      {glow && (
        <rect x={-2} y={-2} width={W + 4} height={H + 4} rx={size * 0.22 + 2} fill="none" stroke="var(--accent)" strokeWidth={3} />
      )}
      <rect x={0.75} y={0.75} width={W - 1.5} height={H - 1.5} rx={size * 0.2} fill={FACE} stroke={EDGE} strokeWidth={1.5} />
      <path
        d={vertical ? `M${size * 0.18} ${size} H${size * 0.82}` : `M${size} ${size * 0.18} V${size * 0.82}`}
        stroke={EDGE}
        strokeWidth={1.4}
      />
      {half(a, 0, 0)}
      {half(b, bx, by)}
    </svg>
  );
}

/** A face-down domino in the deck's card back color, with a little sparkle. */
export function DominoBack({ size, color, vertical = true }: { size: number; color: string; vertical?: boolean }) {
  const W = vertical ? size : size * 2;
  const H = vertical ? size * 2 : size;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
      <rect x={0.5} y={0.5} width={W - 1} height={H - 1} rx={size * 0.22} fill={color} stroke="rgba(255,255,255,.35)" />
      <path d={`M${W / 2} ${H / 2 - 3} l1 2 l2 1 l-2 1 l-1 2 l-1 -2 l-2 -1 l2 -1 Z`} fill="#FFF1C2" opacity={0.8} />
    </svg>
  );
}
