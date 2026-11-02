// Coral Stack's blocks, as in the mockup (design/block-games/mockups.html, `block`): three coral colors that are only
// decoration, and sand for sandbars. Drawn in a 32-unit box centered on (0, 0); `size` is the cell size.
import type { Cell } from './rules';

export const CORAL_COLORS = { a: '#F29A8A', b: '#F6B07A', c: '#7CC4A8' } as const;
const SHADE = { a: '#DA8B7C', b: '#DD9E6E', c: '#70B097' } as const; // each color × 0.9
const SAND = '#E4CFA2', SAND_DOTS = '#C9AE7C';

export function Block({ kind, cx, cy, size, className, style }: {
  kind: Exclude<Cell, null>;
  cx: number;
  cy: number;
  size: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const c = 32, x = -16, y = -16;
  return (
    // The outer group is free for CSS animations; the position lives on the inner one so they don't clash
    <g className={className} style={style}>
      <g transform={`translate(${cx} ${cy}) scale(${size / 32})`}>
        {kind === 'sand' ? (
          <>
            <rect x={x + 1} y={y + 1} width={c - 2} height={c - 2} rx={c * 0.16} fill={SAND} />
            <g fill={SAND_DOTS}>
              <circle cx={x + c * 0.3} cy={y + c * 0.35} r={c * 0.06} />
              <circle cx={x + c * 0.68} cy={y + c * 0.62} r={c * 0.06} />
              <circle cx={x + c * 0.4} cy={y + c * 0.74} r={c * 0.05} />
            </g>
          </>
        ) : (
          <>
            <rect x={x + 1.5} y={y + 1.5} width={c - 3} height={c - 3} rx={c * 0.22} fill={CORAL_COLORS[kind]} />
            <rect x={x + 1.5} y={y + c * 0.62} width={c - 3} height={c * 0.36} rx={c * 0.18} fill={SHADE[kind]} />
            <g fill="#FFFFFF" opacity={0.55}>
              <circle cx={x + c * 0.32} cy={y + c * 0.32} r={c * 0.07} />
              <circle cx={x + c * 0.62} cy={y + c * 0.4} r={c * 0.06} />
              <circle cx={x + c * 0.45} cy={y + c * 0.58} r={c * 0.05} />
            </g>
          </>
        )}
      </g>
    </g>
  );
}
