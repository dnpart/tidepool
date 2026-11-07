// What lives under Lagoon's and Coral Reef's water in Pond Hop (Nov 7, the owner's choice): in Lagoon a manta glides
// under the surface now and then, the owner's own manta drawing turned to a soft shadow; in Coral Reef a tentacle
// curls up out of open water, sways, and sinks back (a stand-in drawing until the owner's comes back, art/WaterLife).
// Both rest with Reduce motion (nothing shows), and are clipped to the pond, so they come and go under the rocky edge.
import { useEffect, useRef, useState } from 'react';
import { CreatureArt } from '../../art/Creature';
import { Tentacle } from '../../art/WaterLife';
import { CENTER as C, POND } from './board';
import styles from './PondHop.module.css';

type Mode = 'light' | 'dark';
export type WaterLifeKind = 'mantas' | 'tentacles';
const r2 = (n: number) => Math.round(n * 100) / 100;

/** Which palettes have life under the water. */
export const waterLifeFor = (palette: string): WaterLifeKind | null =>
  palette === 'lagoon' ? 'mantas' : palette === 'coral' ? 'tentacles' : null;

/** A glide across the pond: from just outside the edge, curving gently through open water, out the far side. */
export interface Glide {
  from: [number, number];
  via: [number, number];
  to: [number, number];
  /** Seconds it takes. */
  seconds: number;
}

/** A glide in from angle `a` (radians), bending by `bend` (-1..1); `random` picks the rest. */
export function makeGlide(random: () => number): Glide {
  const a = random() * Math.PI * 2;
  const out = a + Math.PI + (random() - 0.5) * 1.2;
  const far = POND + 40;
  const bend = (random() - 0.5) * 60;
  const mid = a + Math.PI / 2;
  return {
    from: [C + Math.cos(a) * far, C + Math.sin(a) * far],
    via: [C + Math.cos(mid) * bend, C + Math.sin(mid) * bend],
    to: [C + Math.cos(out) * far, C + Math.sin(out) * far],
    seconds: 10 + random() * 4,
  };
}

/** Where the glide is at `t` (0..1), and which way it's heading (radians). */
export function glideAt(g: Glide, t: number): { x: number; y: number; heading: number } {
  const u = 1 - t;
  const x = u * u * g.from[0] + 2 * u * t * g.via[0] + t * t * g.to[0];
  const y = u * u * g.from[1] + 2 * u * t * g.via[1] + t * t * g.to[1];
  const dx = 2 * u * (g.via[0] - g.from[0]) + 2 * t * (g.to[0] - g.via[0]);
  const dy = 2 * u * (g.via[1] - g.from[1]) + 2 * t * (g.to[1] - g.via[1]);
  return { x, y, heading: Math.atan2(dy, dx) };
}

/** The manta drawing's middle, in its own viewBox (0 -8 64 68). */
const MANTA_MID: [number, number] = [32, 26];
const MANTA_SCALE = 0.95;
/** Seconds between glides. */
const REST = [5, 11] as const;
const FRAME_MS = 32;

function MantaShadow({ id, mode }: { id: string; mode: Mode }) {
  const g = useRef<SVGGElement | null>(null);
  const wings = useRef<SVGGElement | null>(null);
  useEffect(() => {
    let frame = 0, last = 0;
    let glide = makeGlide(Math.random);
    // The first one comes along soon after the board opens
    let wait = 2 + Math.random() * 2, t = 0;
    const hide = () => g.current?.setAttribute('opacity', '0');
    hide();
    const step = (now: number) => {
      frame = requestAnimationFrame(step);
      if (last && now - last < FRAME_MS) return;
      const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
      last = now;
      if (wait > 0) {
        wait -= dt;
        return;
      }
      t += dt / glide.seconds;
      if (t >= 1) {
        hide();
        glide = makeGlide(Math.random);
        t = 0;
        wait = REST[0] + Math.random() * (REST[1] - REST[0]);
        return;
      }
      const p = glideAt(glide, t);
      // The drawing faces up; turn it to face the way it glides, wings slowly beating
      const turn = r2((p.heading * 180) / Math.PI + 90);
      g.current?.setAttribute('opacity', '1');
      g.current?.setAttribute('transform', `translate(${r2(p.x)} ${r2(p.y)}) rotate(${turn}) scale(${MANTA_SCALE})`);
      const beat = 1 - 0.1 * (0.5 + 0.5 * Math.sin(t * glide.seconds * Math.PI * 0.8));
      wings.current?.setAttribute('transform', `scale(${r2(beat)} 1)`);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, []);
  const shade = mode === 'dark' ? '#04181D' : '#1F5F6A';
  return (
    <g ref={g} opacity={0} pointerEvents="none">
      <defs>
        <filter id={`shadow${id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feFlood floodColor={shade} />
          <feComposite in2="SourceAlpha" operator="in" />
          <feGaussianBlur stdDeviation={1.4} />
        </filter>
      </defs>
      <g ref={wings}>
        <g filter={`url(#shadow${id})`} opacity={mode === 'dark' ? 0.5 : 0.26}
          transform={`translate(${-MANTA_MID[0]} ${-MANTA_MID[1]})`}>
          <CreatureArt kind="manta" color="#5E8FB5" />
        </g>
      </g>
    </g>
  );
}

/**
 * Open-water spots for a tentacle: between the piers (straight up, down, left and right) and the hop lines (the
 * diagonals), far enough in that it stays clear of the rocks.
 */
export const TENTACLE_SPOTS: [number, number][] = [-67.5, -22.5, 22.5, 67.5, 112.5, 157.5, 202.5, 247.5].flatMap((deg) => {
  const a = (deg * Math.PI) / 180;
  return [52, 68].map((r) => [r2(C + Math.cos(a) * r), r2(C + Math.sin(a) * r)] as [number, number]);
});
/** How long a tentacle is up, in ms (the CSS animation is as long). */
export const TENTACLE_MS = 3400;
const TENTACLE_REST = [4000, 9000] as const;

function Tentacles() {
  const [pop, setPop] = useState<{ key: number; x: number; y: number; flip: boolean; s: number } | null>(null);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let key = 0;
    const next = (delay: number) => {
      timer = setTimeout(() => {
        const [x, y] = TENTACLE_SPOTS[Math.floor(Math.random() * TENTACLE_SPOTS.length)];
        setPop({ key: ++key, x, y, flip: Math.random() < 0.5, s: 0.62 + Math.random() * 0.12 });
        timer = setTimeout(() => {
          setPop(null);
          next(TENTACLE_REST[0] + Math.random() * (TENTACLE_REST[1] - TENTACLE_REST[0]));
        }, TENTACLE_MS);
      }, delay);
    };
    next(1500 + Math.random() * 1500);
    return () => clearTimeout(timer);
  }, []);
  if (!pop) return null;
  return (
    <g key={pop.key} transform={`translate(${pop.x} ${pop.y})`} pointerEvents="none">
      {/* rings at the waterline as it comes up and goes back down */}
      <ellipse cx={0} cy={0} rx={12} ry={4} className={styles.tentacleRing} fill="none" stroke="#FFFFFF" strokeWidth={1.4} />
      <ellipse cx={0} cy={0} rx={12} ry={4} className={`${styles.tentacleRing} ${styles.tentacleRingOut}`} fill="none"
        stroke="#FFFFFF" strokeWidth={1.4} />
      <g transform={`scale(${pop.flip ? -pop.s : pop.s} ${pop.s})`}>
        <g className={styles.tentacle}>
          <g transform="translate(-20 -80)"><Tentacle /></g>
        </g>
      </g>
    </g>
  );
}

/** Lagoon's manta or Coral Reef's tentacles, under the piers and lily pads and clipped to the water. */
export function WaterLife({ kind, mode, id }: { kind: WaterLifeKind; mode: Mode; id: string }) {
  return (
    <g clipPath={`url(#life${id})`}>
      <clipPath id={`life${id}`}>
        <circle cx={C} cy={C} r={POND} />
      </clipPath>
      {kind === 'mantas' ? <MantaShadow id={id} mode={mode} /> : <Tentacles />}
    </g>
  );
}
