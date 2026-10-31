// The Pond Hop board, ported from design/garden-mockup/pond-hop.html with the same numbers: a rounded panel, the pond,
// 40 track holes, four lily pads with their hops, and a corner and home lane per seat.
import type { KeyboardEvent } from 'react';
import { BOARD, CENTER, CORNER_SPOTS, cornerOf, holeAt, laneAt, MARBLE_COLORS, marbleAt, POND } from './board';
import { PADS, STARTS, TRACK } from './rules';
import styles from './PondHop.module.css';

/** A marble with a lighter highlight and a white glint (games.js `marble`). */
export function Marble({ x, y, r, seat, opacity }: { x: number; y: number; r: number; seat: number; opacity?: number }) {
  const [color, light] = MARBLE_COLORS[seat];
  return (
    <g opacity={opacity}>
      <circle cx={x} cy={y} r={r} fill={color} />
      <circle cx={x - r * 0.3} cy={y - r * 0.32} r={r * 0.36} fill={light} opacity={0.9} />
      <circle cx={x - r * 0.38} cy={y - r * 0.4} r={r * 0.13} fill="#FFF" />
    </g>
  );
}

/** A spot to tap: a marble that can move, or a hole a marble can reach. */
export interface Target {
  key: string;
  x: number;
  y: number;
  label: string;
  /** A marble rather than a hole: drawn as a solid ring. */
  marble?: boolean;
  selected?: boolean;
  onSelect: () => void;
}

const press = (onSelect: () => void) => (e: KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    onSelect();
  }
};

export function Board({
  marbles, size, targets, label,
}: { marbles: number[][]; size: number; targets: Target[]; label: string }) {
  const seats = marbles.length;
  // Corners nobody sits in are drawn faintly
  const empty: number[] = STARTS.slice(seats);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${BOARD} ${BOARD}`} className={styles.board}>
      <title>{label}</title>
      <rect x={1} y={1} width={BOARD - 2} height={BOARD - 2} rx={36} className={styles.panel} strokeWidth={1.5} />
      {/* the pond */}
      <circle cx={CENTER} cy={CENTER} r={POND} fill="#B9E1E3" />
      <circle cx={CENTER} cy={CENTER} r={POND} fill="none" stroke="#8CC8CB" strokeWidth={2} />
      <g fill="none" stroke="#FFFFFF" strokeWidth={1.6} strokeLinecap="round" opacity={0.7}>
        <path d={`M${CENTER - 26} ${CENTER - 14} q8 -5 16 0`} />
        <path d={`M${CENTER + 8} ${CENTER + 18} q8 -5 16 0`} />
        <path d={`M${CENTER - 10} ${CENTER + 30} q6 -4 12 0`} />
      </g>
      {/* lily pad hops across the pond */}
      {[[5, 25], [15, 35]].map(([p, q]) => {
        const [x1, y1] = holeAt(p);
        const [x2, y2] = holeAt(q);
        return (
          <path
            key={p}
            d={`M${x1} ${y1} L${x2} ${y2}`}
            stroke="#5E9C6B"
            strokeWidth={2}
            strokeDasharray="3 6"
            strokeLinecap="round"
            opacity={0.55}
          />
        );
      })}
      <g transform={`translate(${CENTER} ${CENTER})`}>
        <circle r={9} fill="#7CC08A" />
        <path d="M0 0 L9 -3 L9 3 Z" fill="#B9E1E3" />
        <circle cx={-2} cy={-2} r={3.2} fill="#F4A6BE" />
        <circle cx={-2} cy={-2} r={1.3} fill="#F7C948" />
      </g>
      {/* track holes, with the lily pads under theirs */}
      {Array.from({ length: TRACK }, (_, i) => {
        const [x, y] = holeAt(i);
        return (
          <g key={i}>
            {(PADS as readonly number[]).includes(i) && (
              <g transform={`translate(${x} ${y}) rotate(${(i * 360) / TRACK})`}>
                <path d="M0 0 m-11 0 a11 11 0 1 0 22 0 a11 11 0 1 0 -22 0 Z M0 0 L-4 -11 L4 -11 Z" fill="#7CC08A" fillRule="evenodd" />
              </g>
            )}
            <circle cx={x} cy={y} r={6.6} className={styles.hole} />
          </g>
        );
      })}
      {/* each seat's start ring, lane and corner */}
      {STARTS.slice(0, seats).map((start, seat) => {
        const [x, y] = holeAt(start);
        const [color, light] = MARBLE_COLORS[seat];
        const [bx, by] = cornerOf(start).base;
        return (
          <g key={start}>
            <circle cx={x} cy={y} r={9.5} fill="none" stroke={color} strokeWidth={2.4} />
            {[0, 1, 2, 3].map((k) => {
              const [lx, ly] = laneAt(start, k);
              return <circle key={k} cx={lx} cy={ly} r={7} fill={light} opacity={0.45} />;
            })}
            <rect x={bx - 28} y={by - 28} width={56} height={56} rx={18} fill={light} opacity={0.35} />
            {CORNER_SPOTS.map(([dx, dy], k) => (
              <circle key={k} cx={bx + dx} cy={by + dy} r={7} className={styles.hole} />
            ))}
          </g>
        );
      })}
      {empty.map((start) => {
        const [x, y] = holeAt(start);
        const [bx, by] = cornerOf(start).base;
        return (
          <g key={start} className={styles.emptySeat}>
            <circle cx={x} cy={y} r={9.5} fill="none" strokeWidth={2} />
            {[0, 1, 2, 3].map((k) => {
              const [lx, ly] = laneAt(start, k);
              return <circle key={k} cx={lx} cy={ly} r={7} />;
            })}
            <rect x={bx - 28} y={by - 28} width={56} height={56} rx={18} />
          </g>
        );
      })}
      <text x={42} y={318 - 34} textAnchor="middle" className={styles.you}>You</text>
      {/* the marbles, which slide to their new spots */}
      {marbles.map((own, seat) =>
        own.map((progress, i) => {
          const [x, y] = marbleAt(seat, i, progress);
          return (
            <g key={`${seat}-${i}`} className={styles.marble} style={{ transform: `translate(${x}px, ${y}px)` }}>
              <Marble x={0} y={0} r={8} seat={seat} />
            </g>
          );
        }),
      )}
      {/* where you can move: glowing marbles and holes, each a button */}
      {targets.map((t) => (
        <g
          key={t.key}
          role="button"
          tabIndex={0}
          aria-label={t.label}
          aria-pressed={t.marble ? t.selected === true : undefined}
          className={styles.target}
          data-marble={t.marble || undefined}
          data-selected={t.selected || undefined}
          onClick={t.onSelect}
          onKeyDown={press(t.onSelect)}
        >
          <circle cx={t.x} cy={t.y} r={16} className={styles.hit} />
          <circle
            cx={t.x}
            cy={t.y}
            r={12}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={2.6}
            strokeDasharray={t.marble ? undefined : '4 3'}
            className={styles.ring}
          />
        </g>
      ))}
    </svg>
  );
}

/** A die face (games.js `die`). */
export function Die({ value, size }: { value: number; size: number }) {
  const spots: Record<number, [number, number][]> = {
    1: [[1, 1]], 2: [[0, 0], [2, 2]], 3: [[0, 0], [1, 1], [2, 2]], 4: [[0, 0], [2, 0], [0, 2], [2, 2]],
    5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]], 6: [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]],
  };
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect x={3} y={3} width={58} height={58} rx={14} fill="#FFFDF8" stroke="#D9CFBE" strokeWidth={2} />
      {spots[value].map(([c, r], i) => (
        <circle key={i} cx={16 + c * 16} cy={16 + r * 16} r={5.4} fill="#2B3350" />
      ))}
    </svg>
  );
}
