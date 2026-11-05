// The Pond Hop board, with the geometry of design/garden-mockup/pond-hop.html (40 track holes, four lily pads with their
// hops, a corner and home lane per seat) on the pond the owner chose Nov 4 (Pond.tsx: water filling the circle, the
// track's stones as its rocky edge, the home lanes on piers).
import { useId, type KeyboardEvent } from 'react';
import { ArtPiece } from '../../art/Piece';
import { BOARD, CENTER as C, CORNER_SPOTS, cornerOf, DIE_COLORS, holeAt, laneAt, MARBLE_COLORS, marbleAt, POND, type PondKind } from './board';
import { Fireflies, PondScene } from './Pond';
import { STARTS, TRACK } from './rules';
import styles from './PondHop.module.css';

/** A marble, as the owner drew it (src/art/piecesArt.ts), `r` units in radius. */
export function Marble({ x, y, r, seat, opacity }: { x: number; y: number; r: number; seat: number; opacity?: number }) {
  return (
    <g opacity={opacity} transform={`translate(${x} ${y}) scale(${r / 8})`}>
      <ArtPiece id={`marble${seat}` as 'marble0'} />
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

/** The last hop across the pond, for its mark: a skate mark on ice, ripples on water, a trail in honey. */
export interface HopTrail {
  /** A new id for every hop, so the mark draws again. */
  id: number;
  from: [number, number];
  to: [number, number];
}

const r2 = (n: number) => Math.round(n * 100) / 100;

type Mode = 'light' | 'dark';

/** Where a hop's straight path is over the pond: the fractions of the way along it that enter and leave the water. */
function overPond([x1, y1]: [number, number], [x2, y2]: [number, number]): [number, number] {
  const dx = x2 - x1, dy = y2 - y1, fx = x1 - C, fy = y1 - C;
  const a = dx * dx + dy * dy || 1, b = 2 * (fx * dx + fy * dy), c = fx * fx + fy * fy - POND * POND;
  const d = b * b - 4 * a * c;
  if (d <= 0) return [0.5, 0.5];
  return [Math.max(0, (-b - Math.sqrt(d)) / (2 * a)), Math.min(1, (-b + Math.sqrt(d)) / (2 * a))];
}

/** Lines along the hop's path, shifted `offset` to one side or the other (pass 1, -1 or 0). */
const sidePaths = (hop: HopTrail, offset: number) => {
  const [x1, y1] = hop.from;
  const [x2, y2] = hop.to;
  const len = Math.hypot(x2 - x1, y2 - y1) || 1;
  const nx = (-(y2 - y1) / len) * offset;
  const ny = ((x2 - x1) / len) * offset;
  return (s: number) => `M${r2(x1 + s * nx)} ${r2(y1 + s * ny)} L${r2(x2 + s * nx)} ${r2(y2 + s * ny)}`;
};

/** A hop's mark: ripple rings where it skips over water, a skate mark on ice, a honey trail that sinks back in. */
function HopMark({ hop, kind, mode, id }: { hop: HopTrail; kind: PondKind; mode: Mode; id: string }) {
  if (kind === 'water' || kind === 'leaves' || kind === 'koi') {
    const [enter, leave] = overPond(hop.from, hop.to);
    const ring = mode === 'dark' ? '#CFE8DA' : '#FFFFFF';
    return (
      <g className={styles.ripples} fill="none" stroke={ring} strokeWidth={1.6}>
        {[0.25, 0.5, 0.75].map((k) => {
          const t = enter + (leave - enter) * k;
          return (
            <circle key={k} cx={r2(hop.from[0] + (hop.to[0] - hop.from[0]) * t)} cy={r2(hop.from[1] + (hop.to[1] - hop.from[1]) * t)}
              r={9} style={{ animationDelay: `${Math.round(t * 360)}ms` }} />
          );
        })}
      </g>
    );
  }
  const clip = (
    <clipPath id={`hop${id}`}>
      <circle cx={C} cy={C} r={POND - 1} />
    </clipPath>
  );
  if (kind === 'honey') {
    const line = sidePaths(hop, 0.7);
    return (
      <g className={styles.trail} data-kind="honey" clipPath={`url(#hop${id})`} fill="none" strokeLinecap="round">
        {clip}
        <path pathLength={1} d={line(0)} stroke={mode === 'dark' ? '#6E3D08' : '#A9620F'} strokeWidth={4.5} opacity={0.75} />
        <path pathLength={1} d={line(-1)} stroke={mode === 'dark' ? '#FFF3D6' : '#FFFFFF'} strokeWidth={1.2} opacity={0.7} />
      </g>
    );
  }
  const line = sidePaths(hop, 2);
  return (
    <g className={styles.trail} clipPath={`url(#hop${id})`} fill="none" stroke={mode === 'dark' ? '#DCEBFA' : '#FFFFFF'} strokeWidth={1.2} strokeLinecap="round">
      {clip}
      {[1, -1].map((s) => <path key={s} pathLength={1} d={line(s)} />)}
    </g>
  );
}

const press = (onSelect: () => void) => (e: KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    onSelect();
  }
};

export function Board({
  marbles, size, targets, label, pond = 'water', mode = 'light', hop, swim = false,
}: {
  marbles: number[][]; size: number; targets: Target[]; label: string;
  /** The palette's pond: water, Winter's ice, Forest's leaves, Honeycomb's honey or Koi Garden's koi. */
  pond?: PondKind;
  mode?: Mode;
  /** The last hop, marked on the pond. */
  hop?: HopTrail | null;
  /** Let Koi Garden's koi swim (the screen turns it off with Reduce motion). */
  swim?: boolean;
}) {
  const id = useId().replace(/:/g, '');
  const seats = marbles.length;
  // Corners nobody sits in are drawn faintly
  const empty: number[] = STARTS.slice(seats);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${BOARD} ${BOARD}`} className={styles.board}>
      <title>{label}</title>
      <rect x={1} y={1} width={BOARD - 2} height={BOARD - 2} rx={36} className={styles.panel} strokeWidth={1.5} />
      <PondScene kind={pond} mode={mode} id={id} swim={swim}>
        {hop && <HopMark key={hop.id} hop={hop} kind={pond} mode={mode} id={id} />}
      </PondScene>
      {/* track holes, on the stones and lily pads */}
      {Array.from({ length: TRACK }, (_, i) => {
        const [x, y] = holeAt(i);
        return <circle key={i} cx={x} cy={y} r={6.6} className={styles.hole} />;
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
              return <circle key={k} cx={lx} cy={ly} r={6.6} fill={light} opacity={0.85} />;
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
      {pond === 'leaves' && mode === 'dark' && <Fireflies />}
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

/** A die face (games.js `die`), in the color of the seat whose turn it is, with white pips. */
export function Die({ value, size, seat = 0 }: { value: number; size: number; seat?: number }) {
  const spots: Record<number, [number, number][]> = {
    1: [[1, 1]], 2: [[0, 0], [2, 2]], 3: [[0, 0], [1, 1], [2, 2]], 4: [[0, 0], [2, 0], [0, 2], [2, 2]],
    5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]], 6: [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]],
  };
  const [face, edge] = DIE_COLORS[seat];
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect x={3} y={3} width={58} height={58} rx={14} fill={face} stroke={edge} strokeWidth={2.5} />
      {spots[value].map(([c, r], i) => (
        <circle key={i} cx={16 + c * 16} cy={16 + r * 16} r={5.4} fill="#FFFFFF" />
      ))}
    </svg>
  );
}
