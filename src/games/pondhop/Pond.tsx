// The pond under the Pond Hop board (design/pond-palettes/koi-ponds.html, chosen by the owner Nov 4): water filling the
// circle, one rock per track hole making its edge (wax comb cells round the honey), a pier out over the water for each
// home lane, the owner's four lily pads floating at the hop spots, and what a hop leaves on the water.
import { useEffect, useRef } from 'react';
import { KoiFish } from '../../art/KoiGarden';
import { ArtPiece } from '../../art/Piece';
import { CENTER as C, cornerOf, holeAt, POND, POND_LOOK, type PondKind, type PondLook } from './board';
import { type Koi, restingKoi, swim } from './koiSwim';
import { PADS, STARTS, TRACK } from './rules';
import styles from './PondHop.module.css';

type Mode = 'light' | 'dark';
const r2 = (n: number) => Math.round(n * 100) / 100;
/** A steady "random" number in 0..1 for hole `i`, so every rock keeps its own shape. */
const wobble = (i: number, k: number) => {
  const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return v - Math.floor(v);
};
const hexPoints = (x: number, y: number, s: number, rot = 0) =>
  Array.from({ length: 6 }, (_, i) => {
    const a = ((60 * i + rot) * Math.PI) / 180;
    return `${r2(x + s * Math.cos(a))},${r2(y + s * Math.sin(a))}`;
  }).join(' ');

const RIPPLES: [number, number, number][] = [[C - 64, C - 34, 16], [C + 40, C - 66, 14], [C + 62, C + 28, 16], [C - 34, C + 64, 14]];
const LEAVES: [number, number, number, string][] = [
  [C - 50, C - 70, 30, '#E39B4B'], [C + 72, C - 44, -60, '#E8C15A'], [C - 74, C + 46, 110, '#C9653D'], [C + 48, C + 74, 200, '#8DB86B'],
];
const CRACKS = [`M${C - 100} ${C - 20} l22 6 l16 -10 l18 5`, `M${C + 44} ${C - 96} l-8 22 l12 15`, `M${C + 28} ${C + 100} l6 -24 l20 -10`, `M${C - 70} ${C + 70} l18 -6 l8 -16`];
const GLINTS: [number, number, number][] = [[C - 58, C + 30, 14], [C - 48, C + 40, 7], [C + 50, C - 20, 12]];
const BUBBLES: [number, number, number][] = [[C + 62, C + 52, 3.2], [C + 72, C + 62, 2], [C - 72, C + 40, 2.6], [C - 30, C + 84, 2.4]];
const FIREFLIES: [number, number, number][] = [[C - 40, C - 52, 0], [C + 56, C - 14, 1.1], [C - 18, C + 44, 2]];

const deg = (r: number) => r2((r * 180) / Math.PI);
const poseOf = (k: Koi) => `translate(${r2(k.x)} ${r2(k.y)}) rotate(${deg(k.a)})`;
/** Frames closer together than this are skipped: koi are slow, and the whole board redraws with them. */
const FRAME_MS = 32;

/**
 * Koi Garden's three koi. Still, they rest where the pond's picture has them; swimming, each wanders the open water
 * (`koiSwim.ts`), passing under the bridges and lily pads, its tail swaying. The frames go straight to the svg, not
 * through React, so a board full of marbles isn't redrawn by React thirty times a second.
 */
function KoiSchool({ swim: swimming }: { swim: boolean }) {
  const koi = useRef<Koi[]>(restingKoi());
  const bodies = useRef<(SVGGElement | null)[]>([]);
  const tails = useRef<(SVGGElement | null)[]>([]);
  useEffect(() => {
    if (!swimming) return;
    let frame = 0, last = 0, t = 0;
    const step = (now: number) => {
      frame = requestAnimationFrame(step);
      if (last && now - last < FRAME_MS) return;
      // After a pause (the app in the background) they carry on from where they were
      const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
      last = now;
      t += dt;
      swim(koi.current, t, dt);
      koi.current.forEach((k, i) => {
        bodies.current[i]?.setAttribute('transform', poseOf(k));
        tails.current[i]?.setAttribute('transform', `rotate(${r2(k.tail)} -15 0)`);
      });
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [swimming]);
  return (
    <g pointerEvents="none">
      {koi.current.map((k, i) => (
        <g key={k.kind} ref={(el) => { bodies.current[i] = el; }} transform={poseOf(k)}>
          <KoiFish kind={k.kind} x={0} y={0} a={0} s={k.s} tailRef={(el) => { tails.current[i] = el; }} />
        </g>
      ))}
    </g>
  );
}

/** The water and what floats or shows in it. */
function Water({ kind, mode, id, look, swim }: { kind: PondKind; mode: Mode; id: string; look: PondLook; swim: boolean }) {
  return (
    <g>
      <defs>
        <radialGradient id={`water${id}`} cx={C} cy={C} r={POND + 14} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={look.inner} />
          <stop offset="1" stopColor={look.outer} />
        </radialGradient>
      </defs>
      <circle cx={C} cy={C} r={POND} fill={`url(#water${id})`} />
      {(kind === 'water' || kind === 'leaves' || kind === 'koi') && (
        <g fill="none" stroke={look.mark} strokeWidth={1.6} strokeLinecap="round" opacity={mode === 'dark' ? 0.35 : 0.55}>
          {RIPPLES.map(([x, y, w]) => <path key={x} d={`M${x} ${y} q${w / 2} -${r2(w / 3)} ${w} 0`} />)}
        </g>
      )}
      {kind === 'leaves' && LEAVES.map(([x, y, rot, color]) => (
        <g key={rot} transform={`translate(${x} ${y}) rotate(${rot}) scale(1.2)`}>
          <path d="M0 -6 C4.5 -3 4.5 3 0 6 C-4.5 3 -4.5 -3 0 -6 Z" fill={color} />
          <path d="M0 -5 L0 7.5" stroke="#00000033" strokeWidth={0.9} strokeLinecap="round" />
        </g>
      ))}
      {kind === 'koi' && <KoiSchool swim={swim} />}
      {kind === 'ice' && (
        <>
          <g fill="none" strokeLinecap="round" strokeLinejoin="round">
            {CRACKS.map((d) => (
              <g key={d}>
                <path d={d} transform="translate(.9 .9)" stroke={mode === 'dark' ? '#16293C' : '#FFFFFF'} strokeWidth={2} />
                <path d={d} stroke={look.mark} strokeWidth={1.4} />
              </g>
            ))}
          </g>
          <g stroke="#FFFFFF" strokeWidth={2.2} strokeLinecap="round" opacity={mode === 'dark' ? 0.5 : 0.95}>
            {GLINTS.map(([x, y, l]) => <path key={x} d={`M${x} ${y} l${r2(l * 0.75)} ${r2(-l * 0.66)}`} />)}
          </g>
        </>
      )}
      {kind === 'honey' && (
        <>
          <ellipse cx={C - 46} cy={C - 62} rx={26} ry={8} transform={`rotate(-28 ${C - 46} ${C - 62})`} fill="#FFFFFF" opacity={mode === 'dark' ? 0.3 : 0.55} />
          {BUBBLES.map(([x, y, r]) => <circle key={x} cx={x} cy={y} r={r} fill="none" stroke={mode === 'dark' ? '#F6C35A' : '#FFE9A8'} strokeWidth={1.2} />)}
        </>
      )}
    </g>
  );
}

/** A pier from the edge out over the water, carrying one home lane: boards, a snowy boardwalk, a log, comb, or a bridge. */
function Pier({ kind, mode, look, start }: { kind: PondKind; mode: Mode; look: PondLook; start: number }) {
  const [ax, ay] = cornerOf(start).axis;
  const angle = (Math.atan2(ay, ax) * 180) / Math.PI;
  const from = 50, to = 118, w = 19;
  let body;
  if (kind === 'leaves') {
    body = (
      <>
        <rect x={from} y={-w / 2} width={to - from} height={w} rx={w / 2} fill={look.plank} />
        <rect x={from} y={-w / 2 + 1} width={to - from} height={w - 4} rx={(w - 4) / 2} fill={look.pier} />
        {[64, 80, 96].map((x) => <path key={x} d={`M${x} -5 l7 0 M${x + 5} 3 l6 0`} stroke={look.plank} strokeWidth={1.4} strokeLinecap="round" />)}
        <ellipse cx={from + 3} cy={0} rx={4} ry={w / 2 - 0.5} fill={mode === 'dark' ? '#A88A62' : '#D9B98A'} />
        <ellipse cx={from + 3} cy={0} rx={2} ry={w / 4} fill="none" stroke={look.plank} strokeWidth={1} />
      </>
    );
  } else if (kind === 'honey') {
    body = (
      <>
        <rect x={from - 2} y={-w / 2 + 1} width={to - from + 4} height={w - 2} rx={5} fill={look.plank} opacity={0.55} />
        {[60, 76, 92, 108].map((r) => <polygon key={r} points={hexPoints(r, 0, 9.6, 30)} fill={look.pier} stroke={look.plank} strokeWidth={1.4} />)}
      </>
    );
  } else if (kind === 'koi') {
    // a garden bridge: pale boards between red rails, so the home spots stay easy to see
    body = (
      <>
        <rect x={from} y={-w / 2 - 1.5} width={to - from} height={w + 3} rx={3} fill={look.rail} />
        <rect x={from} y={-w / 2 + 2} width={to - from} height={w - 4} fill={look.pier} />
        {Array.from({ length: 11 }, (_, i) => from + 6 + i * 6).map((x) => <path key={x} d={`M${x} ${-w / 2 + 2} L${x} ${w / 2 - 2}`} stroke={look.plank} strokeWidth={0.9} />)}
        <rect x={from - 1} y={-w / 2 - 3} width={4} height={w + 6} rx={1.5} fill={look.rail} />
      </>
    );
  } else {
    body = (
      <>
        <rect x={from} y={-w / 2 + 1.5} width={to - from} height={w} rx={2.5} fill={look.plank} />
        <rect x={from} y={-w / 2} width={to - from} height={w} rx={2.5} fill={look.pier} />
        {Array.from({ length: 11 }, (_, i) => from + 6 + i * 6).map((x) => <path key={x} d={`M${x} ${-w / 2} L${x} ${w / 2}`} stroke={look.plank} strokeWidth={0.9} opacity={0.7} />)}
        <circle cx={from + 2.5} cy={-w / 2 - 1} r={2.6} fill={look.plank} />
        <circle cx={from + 2.5} cy={w / 2 + 1} r={2.6} fill={look.plank} />
        {kind === 'ice' && <path d={`M${from + 1} ${-w / 2 + 1} L${to} ${-w / 2 + 1}`} stroke={mode === 'dark' ? '#DCEBFA' : '#FFFFFF'} strokeWidth={3.2} strokeLinecap="round" />}
      </>
    );
  }
  return <g transform={`translate(${C} ${C}) rotate(${r2(angle)})`}>{body}</g>;
}

/** One rock of the pond's edge under track hole `i` (a wax cell in honey). */
function Stone({ kind, look, i }: { kind: PondKind; look: PondLook; i: number }) {
  const [x, y] = holeAt(i);
  const r = 10.6 + wobble(i, 1) * 1.6;
  const rot = r2(wobble(i, 2) * 180);
  if (kind === 'honey') return <polygon points={hexPoints(x, y, 11.8, rot)} fill={look.stone[0]} stroke={look.stone[1]} strokeWidth={1.6} />;
  const sx = r2(1 + (wobble(i, 3) - 0.5) * 0.18);
  const top = look.stone[2];
  return (
    <g transform={`translate(${r2(x)} ${r2(y)})`}>
      <g transform={`rotate(${rot}) scale(${sx} 1)`}>
        <ellipse cy={1.4} rx={r2(r + 0.3)} ry={r2(r * 0.9)} fill={look.stone[1]} />
        <ellipse rx={r2(r)} ry={r2(r * 0.86)} fill={look.stone[0]} />
      </g>
      {kind === 'ice' ? <path d="M-9 -2 Q-8 -9.5 0 -10 Q8 -9.5 9 -2 Q5 -4.8 0 -4.2 Q-5 -4.8 -9 -2Z" fill={top} />
        : kind === 'leaves' ? <ellipse cx={-3} cy={-5.6} rx={5.5} ry={2.8} fill={top} opacity={0.9} />
          : <ellipse cx={-3.5} cy={-4.5} rx={4.5} ry={2.2} fill={top} opacity={0.75} />}
    </g>
  );
}

/** Forest at night: three fireflies glowing over the pond. */
export const Fireflies = () => (
  <g pointerEvents="none">
    {FIREFLIES.map(([x, y, d]) => (
      <g key={x} className={styles.firefly} style={{ animationDelay: `${d}s` }}>
        <circle cx={x} cy={y} r={5} fill="#FFF4D6" opacity={0.25} />
        <circle cx={x} cy={y} r={1.8} fill="#FFF4D6" />
      </g>
    ))}
  </g>
);

/** Everything under the holes and marbles: water, hop lines, piers, the rocky edge and the lily pads. */
export function PondScene({ kind, mode, id, swim = false, children }: {
  kind: PondKind; mode: Mode; id: string;
  /** Let the koi swim (off with Reduce motion: they rest where the picture has them). */
  swim?: boolean;
  children?: React.ReactNode;
}) {
  const look = POND_LOOK[kind][mode];
  return (
    <g>
      <Water kind={kind} mode={mode} id={id} look={look} swim={swim} />
      {[[5, 25], [15, 35]].map(([p, q]) => {
        const [x1, y1] = holeAt(p);
        const [x2, y2] = holeAt(q);
        return <path key={p} d={`M${r2(x1)} ${r2(y1)} L${r2(x2)} ${r2(y2)}`} stroke={look.hop} strokeWidth={2} strokeDasharray="3 6" strokeLinecap="round" opacity={0.6} />;
      })}
      {/* the hop's mark, on the water and under the piers */}
      {children}
      {STARTS.map((start) => <Pier key={start} kind={kind} mode={mode} look={look} start={start} />)}
      {Array.from({ length: TRACK }, (_, i) => i).filter((i) => !(PADS as readonly number[]).includes(i))
        .map((i) => <Stone key={i} kind={kind} look={look} i={i} />)}
      <ArtPiece id="lilyPads" recolor={mode === 'dark' ? { '#7cc08a': '#6FB07C' } : undefined} />
    </g>
  );
}
