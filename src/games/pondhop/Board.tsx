// The Pond Hop board, ported from design/garden-mockup/pond-hop.html with the same numbers: a rounded panel, the pond,
// 40 track holes, four lily pads with their hops, and a corner and home lane per seat.
import { useId, type KeyboardEvent } from 'react';
import { ArtPiece } from '../../art/Piece';
import {
  BOARD, CENTER, CORNER_SPOTS, cornerOf, DIE_COLORS, FOREST, holeAt, HONEY, ICE, type Ice, laneAt, MARBLE_COLORS, marbleAt, POND,
  type PondKind,
} from './board';
import { PADS, STARTS, TRACK } from './rules';
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

/** A lump of snow: overlapping circles over a shade copy nudged down. */
function Snow({ x, y, parts, fill, shade, drop = 1.4 }: {
  x: number; y: number; parts: [number, number, number][]; fill: string; shade: string; drop?: number;
}) {
  const at = (dy: number, color: string) =>
    parts.map(([dx, py, r], i) => <circle key={`${color}${i}`} cx={r2(x + dx)} cy={r2(y + py + dy)} r={r} fill={color} />);
  return <g>{at(drop, shade)}{at(0, fill)}</g>;
}

/** A snowbank on the pond's rim at angle t (degrees: 0 is right, 90 is down). */
function Bank({ t, ice, size = 1 }: { t: number; ice: Ice; size?: number }) {
  const a = (t * Math.PI) / 180;
  const x = CENTER + Math.cos(a) * (POND + 1);
  const y = CENTER + Math.sin(a) * (POND + 1);
  const tx = -Math.sin(a);
  const ty = Math.cos(a);
  return (
    <Snow x={x} y={y} fill={ice.snow} shade={ice.shade}
      parts={[[0, 0, 4.6 * size], [tx * 5.5, ty * 5.5, 3.6 * size], [-tx * 5, -ty * 5, 3.2 * size]]} />
  );
}

const C = CENTER;
const CRACKS = [
  `M${C - 43} ${C - 10} l12 4 l8 -6 l10 3 M${C - 31} ${C - 6} l2 9`,
  `M${C + 22} ${C - 39} l-5 11 l6 8 l-4 8`,
  `M${C + 10} ${C + 44} l3 -12 l10 -5`,
];
const GLINTS: [number, number, number][] = [[C - 22, C + 14, 9], [C - 15, C + 20, 4.5], [C + 14, C - 4, 7]];
const BANKS: [number, number][] = [[-6, 1], [168, 1], [98, 0.95]];

/** Winter's frozen pond: pale ice, a frosty edge, cracks, glints and a little snow banked on the rim. */
function FrozenPond({ ice, id }: { ice: Ice; id: string }) {
  return (
    <g>
      <defs>
        <radialGradient id={`ice${id}`} cx=".42" cy=".38" r=".7">
          <stop offset="0" stopColor={ice.inner} />
          <stop offset="1" stopColor={ice.outer} />
        </radialGradient>
      </defs>
      <circle cx={C} cy={C} r={POND} fill={`url(#ice${id})`} />
      <circle cx={C} cy={C} r={POND - 3.5} fill="none" stroke={ice.frost} strokeWidth={3} opacity={ice.frostOpacity} />
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        {CRACKS.map((d) => (
          <g key={d}>
            <path d={d} transform="translate(.7 .7)" stroke={ice.groove} strokeWidth={1.5} opacity={0.9} />
            <path d={d} stroke={ice.crack} strokeWidth={1.1} />
          </g>
        ))}
      </g>
      <g stroke={ice.glint} strokeWidth={1.8} strokeLinecap="round" opacity={ice.glintOpacity}>
        {GLINTS.map(([x, y, l]) => <path key={x} d={`M${x} ${y} l${r2(l * 0.75)} ${r2(-l * 0.66)}`} />)}
      </g>
      <circle cx={C} cy={C} r={POND} fill="none" stroke={ice.rim} strokeWidth={2} />
      {BANKS.map(([t, size]) => <Bank key={t} t={t} ice={ice} size={size} />)}
    </g>
  );
}

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

/** A hop's mark: a skate mark on ice, ripple rings where it skips over water, a honey trail that sinks back in. */
function HopMark({ hop, kind, mode, id }: { hop: HopTrail; kind: PondKind; mode: Mode; id: string }) {
  if (kind === 'leaves') {
    const [enter, leave] = overPond(hop.from, hop.to);
    const ring = FOREST[mode].ring;
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
    const h = HONEY[mode];
    const line = sidePaths(hop, 0.7);
    return (
      <g className={styles.trail} data-kind="honey" clipPath={`url(#hop${id})`} fill="none" strokeLinecap="round">
        {clip}
        <path pathLength={1} d={line(0)} stroke={h.trail} strokeWidth={4.5} opacity={0.75} />
        <path pathLength={1} d={line(-1)} stroke={h.shine} strokeWidth={1.2} opacity={0.7} />
      </g>
    );
  }
  const ice = ICE[mode];
  const line = sidePaths(hop, 2);
  return (
    <g className={styles.trail} clipPath={`url(#hop${id})`} fill="none" stroke={ice.glint} strokeWidth={1.2} strokeLinecap="round">
      {clip}
      {[1, -1].map((s) => <path key={s} pathLength={1} d={line(s)} />)}
    </g>
  );
}

const LEAVES: [number, number, number, string][] = [
  [C - 27, C - 17, 30, '#E39B4B'], [C + 26, C + 9, -60, '#E8C15A'], [C - 13, C + 29, 110, '#C9653D'], [C + 17, C - 28, 200, '#8DB86B'],
];
const REEDS = [18, 162, 252];
const FIREFLIES: [number, number, number][] = [[C - 20, C - 30, 0], [C + 30, C - 6, 1.1], [C - 6, C + 20, 2]];

const Ripples = ({ color, opacity }: { color: string; opacity: number }) => (
  <g fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" opacity={opacity}>
    <path d={`M${C - 26} ${C - 14} q8 -5 16 0`} />
    <path d={`M${C + 8} ${C + 18} q8 -5 16 0`} />
    <path d={`M${C - 10} ${C + 30} q6 -4 12 0`} />
  </g>
);

const PondWater = ({ id, inner, outer }: { id: string; inner: string; outer: string }) => (
  <>
    <defs>
      <radialGradient id={`water${id}`} cx=".42" cy=".38" r=".72">
        <stop offset="0" stopColor={inner} />
        <stop offset="1" stopColor={outer} />
      </radialGradient>
    </defs>
    <circle cx={C} cy={C} r={POND} fill={`url(#water${id})`} />
  </>
);

/** Forest's pond: deep green water, ripples, four fallen leaves, and reeds with cattails on the rim. */
function LeafyPond({ mode, id }: { mode: Mode; id: string }) {
  const k = FOREST[mode];
  return (
    <g>
      <PondWater id={id} inner={k.inner} outer={k.outer} />
      <Ripples color={k.ripple} opacity={k.rippleOpacity} />
      {LEAVES.map(([x, y, rot, color]) => (
        <g key={rot} transform={`translate(${x} ${y}) rotate(${rot}) scale(1.15)`}>
          <path d="M0 -6 C4.5 -3 4.5 3 0 6 C-4.5 3 -4.5 -3 0 -6 Z" fill={color} opacity={mode === 'dark' ? 0.92 : undefined} />
          <path d="M0 -5 L0 7.5" stroke="#00000033" strokeWidth={0.9} strokeLinecap="round" />
        </g>
      ))}
      <circle cx={C} cy={C} r={POND} fill="none" stroke={k.rim} strokeWidth={2} />
      {REEDS.map((t) => {
        const a = (t * Math.PI) / 180;
        const x = r2(C + Math.cos(a) * (POND - 2));
        const y = r2(C + Math.sin(a) * (POND - 2));
        return (
          <g key={t}>
            <g stroke={k.reed} strokeWidth={1.7} strokeLinecap="round" fill="none">
              <path d={`M${x} ${y} q-2 -6 -5 -10`} />
              <path d={`M${x} ${y} q0 -8 0 -14`} />
              <path d={`M${x} ${y} q2 -5 5 -8`} />
            </g>
            <ellipse cx={x} cy={r2(y - 14)} rx={1.9} ry={3.6} fill={k.cattail} />
          </g>
        );
      })}
    </g>
  );
}

/** Forest at night: three fireflies glowing over the pond. */
const Fireflies = () => (
  <g pointerEvents="none">
    {FIREFLIES.map(([x, y, d]) => (
      <g key={x} className={styles.firefly} style={{ animationDelay: `${d}s` }}>
        <circle cx={x} cy={y} r={5} fill="#FFF4D6" opacity={0.25} />
        <circle cx={x} cy={y} r={1.8} fill="#FFF4D6" />
      </g>
    ))}
  </g>
);

const hexPoints = (x: number, y: number, s: number) =>
  Array.from({ length: 6 }, (_, i) => {
    const a = (60 * i * Math.PI) / 180;
    return `${r2(x + s * Math.cos(a))},${r2(y + s * Math.sin(a))}`;
  }).join(' ');
const BUBBLES: [number, number, number][] = [[C + 22, C + 14, 2.2], [C + 28, C + 20, 1.4], [C - 30, C + 12, 1.8], [C + 6, C - 32, 1.5]];

/** Honeycomb's pond: a pool of honey with a shine and bubbles, set in a ring of sixteen comb cells. */
function HoneyPond({ mode, id }: { mode: Mode; id: string }) {
  const k = HONEY[mode];
  return (
    <g>
      {Array.from({ length: 16 }, (_, i) => {
        const a = ((11.25 + 22.5 * i) * Math.PI) / 180;
        return (
          <polygon key={i} points={hexPoints(C + Math.cos(a) * (POND + 5), C + Math.sin(a) * (POND + 5), 5.6)}
            fill={k.comb} stroke={k.combStroke} strokeWidth={1.1} />
        );
      })}
      <PondWater id={id} inner={k.inner} outer={k.outer} />
      <ellipse cx={C - 14} cy={C - 22} rx={15} ry={5.5} transform={`rotate(-28 ${C - 14} ${C - 22})`} fill={k.shine} opacity={k.shineOpacity} />
      <circle cx={C - 31} cy={C - 8} r={2.2} fill={k.shine} opacity={k.shineOpacity} />
      {BUBBLES.map(([x, y, r]) => <circle key={x} cx={x} cy={y} r={r} fill="none" stroke={k.bubble} strokeWidth={1} />)}
      <circle cx={C} cy={C} r={POND} fill="none" stroke={k.rim} strokeWidth={2} />
    </g>
  );
}

/** Honeycomb's middle: three little comb cells instead of the lily pad. */
function HoneyCells({ mode }: { mode: Mode }) {
  const k = HONEY[mode];
  const s = 5.2;
  const h = (s * Math.sqrt(3)) / 2;
  return (
    <g>
      {[[-s * 0.75, -h / 2], [s * 0.75, -h / 2], [0, h / 2 + 0.4]].map(([dx, dy]) => (
        <polygon key={dx + dy} points={hexPoints(C + dx * 1.15, C + dy * 1.15 + 1, s)} fill={k.cell} stroke={k.cellStroke} strokeWidth={1.2} />
      ))}
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
  marbles, size, targets, label, pond = 'water', mode = 'light', hop,
}: {
  marbles: number[][]; size: number; targets: Target[]; label: string;
  /** The palette's pond: plain water, Winter's ice, Forest's leaves or Honeycomb's honey. */
  pond?: PondKind;
  mode?: Mode;
  /** The last hop, marked on the pond (not on plain water). */
  hop?: HopTrail | null;
}) {
  const id = useId().replace(/:/g, '');
  const ice = pond === 'ice' ? ICE[mode] : null;
  const hopLine = pond === 'ice' ? ICE[mode] : pond === 'leaves' ? FOREST[mode] : pond === 'honey' ? HONEY[mode] : null;
  const seats = marbles.length;
  // Corners nobody sits in are drawn faintly
  const empty: number[] = STARTS.slice(seats);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${BOARD} ${BOARD}`} className={styles.board}>
      <title>{label}</title>
      <rect x={1} y={1} width={BOARD - 2} height={BOARD - 2} rx={36} className={styles.panel} strokeWidth={1.5} />
      {/* the pond */}
      {ice ? <FrozenPond ice={ice} id={id} /> : pond === 'leaves' ? <LeafyPond mode={mode} id={id} /> : pond === 'honey' ? (
        <HoneyPond mode={mode} id={id} />
      ) : (
        <g>
          <circle cx={CENTER} cy={CENTER} r={POND} fill="#B9E1E3" />
          <circle cx={CENTER} cy={CENTER} r={POND} fill="none" stroke="#8CC8CB" strokeWidth={2} />
          <g fill="none" stroke="#FFFFFF" strokeWidth={1.6} strokeLinecap="round" opacity={0.7}>
            <path d={`M${CENTER - 26} ${CENTER - 14} q8 -5 16 0`} />
            <path d={`M${CENTER + 8} ${CENTER + 18} q8 -5 16 0`} />
            <path d={`M${CENTER - 10} ${CENTER + 30} q6 -4 12 0`} />
          </g>
        </g>
      )}
      {/* lily pad hops across the pond */}
      {[[5, 25], [15, 35]].map(([p, q]) => {
        const [x1, y1] = holeAt(p);
        const [x2, y2] = holeAt(q);
        return (
          <path
            key={p}
            d={`M${x1} ${y1} L${x2} ${y2}`}
            stroke={hopLine ? hopLine.hop : '#5E9C6B'}
            strokeWidth={2}
            strokeDasharray="3 6"
            strokeLinecap="round"
            opacity={hopLine ? hopLine.hopOpacity : 0.55}
          />
        );
      })}
      {ice ? (
        // frozen in, with a snow clump where the flower was
        <g transform={`translate(${CENTER} ${CENTER})`}>
          <circle r={11.5} fill="none" stroke={ice.ridge} strokeWidth={1.6} opacity={ice.ridgeOpacity} />
          <circle r={9} fill="#7CC08A" />
          <path d="M0 0 L9 -3 L9 3 Z" fill={ice.inner} />
          <Snow x={-1.5} y={-1.5} parts={[[-2.2, 0.6, 3.4], [2.2, 0.2, 3], [0, -1.8, 3.2]]} fill={ice.snow} shade="#5E9C6B" drop={1.2} />
        </g>
      ) : pond === 'honey' ? (
        <HoneyCells mode={mode} />
      ) : (
        <g transform={`translate(${CENTER} ${CENTER})`}>
          <circle r={9} fill="#7CC08A" />
          <path d="M0 0 L9 -3 L9 3 Z" fill={pond === 'leaves' ? FOREST[mode].inner : '#B9E1E3'} />
          <circle cx={-2} cy={-2} r={3.2} fill="#F4A6BE" />
          <circle cx={-2} cy={-2} r={1.3} fill="#F7C948" />
        </g>
      )}
      {/* track holes, with the lily pads under theirs */}
      {Array.from({ length: TRACK }, (_, i) => {
        const [x, y] = holeAt(i);
        return (
          <g key={i}>
            {(PADS as readonly number[]).includes(i) && (
              <g transform={`translate(${x} ${y}) rotate(${(i * 360) / TRACK})`}>
                <path d="M0 0 m-11 0 a11 11 0 1 0 22 0 a11 11 0 1 0 -22 0 Z M0 0 L-4 -11 L4 -11 Z" fill="#7CC08A" fillRule="evenodd" />
                {ice && (
                  <Snow x={0} y={0} parts={[[-8, 4, 2.6], [-5, 7.6, 2.2], [7.2, 5.4, 2.4]]} fill={ice.snow} shade="#5E9C6B" drop={0.9} />
                )}
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
      {hop && pond !== 'water' && <HopMark key={hop.id} hop={hop} kind={pond} mode={mode} id={id} />}
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
