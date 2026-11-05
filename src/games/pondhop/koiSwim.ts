// How Koi Garden's three koi wander the Pond Hop pond (Nov 5, the owner asked for them to swim). Each koi has its own
// slow, wavering turn and speed, steers back before it reaches the rocks, and edges away from a koi swimming close by.
// Pure numbers, so the screen can step it each frame and a test can check the koi never leave the water.
import { CENTER as C } from './board';
import type { KoiKind } from '../../art/KoiGarden';

export interface Koi {
  kind: KoiKind;
  /** Length in board units. */
  s: number;
  x: number;
  y: number;
  /** Heading in radians (0 points right, y grows downward). */
  a: number;
  /** Tail sway angle in degrees. */
  tail: number;
  /** Phase of the tail's beat. */
  beat: number;
  /** This koi's own wobble: its usual speed (units a second) and the phases of its turns and kicks. */
  base: number;
  p: [number, number, number];
}

/** Where a koi's middle may go: well clear of the rocks (their inner edge is about 115 from the middle). */
export const SWIM_MAX = 98;
/** Past this distance from the middle a koi starts turning back. */
const TURN_FROM = 72;
/** The quickest a koi turns, in radians a second. */
const MAX_TURN = 1.3;

const rad = (deg: number) => (deg * Math.PI) / 180;

/** The three koi where they rest when nothing moves (the pond's still picture). */
export function restingKoi(): Koi[] {
  return [
    { kind: 'kohaku', s: 30, x: C - 58, y: C - 70, a: rad(24), tail: 0, beat: 0, base: 11, p: [0, 1.7, 0.4] },
    { kind: 'orange', s: 28, x: C + 66, y: C + 58, a: rad(205), tail: 0, beat: 2, base: 13, p: [2.2, 0.3, 2.9] },
    { kind: 'shiro', s: 24, x: C - 70, y: C + 62, a: rad(140), tail: 0, beat: 4, base: 9.5, p: [4.1, 3.3, 1.2] },
  ];
}

/** Turn `from` toward `to` (radians) by the shortest way: the signed difference. */
const angleTo = (from: number, to: number) => Math.atan2(Math.sin(to - from), Math.cos(to - from));

/** Moves every koi on by `dt` seconds at time `t` (seconds since they set off). */
export function swim(koi: Koi[], t: number, dt: number): void {
  for (const k of koi) {
    const [p1, p2, p3] = k.p;
    // A slow meander of its own: two sways of different lengths, so the path never quite repeats
    let turn = 0.4 * Math.sin(0.13 * t + p1) + 0.28 * Math.sin(0.41 * t + p2);
    const dx = k.x - C, dy = k.y - C;
    const r = Math.hypot(dx, dy);
    if (r > TURN_FROM) {
      // Steer back toward the open middle, harder the nearer the rocks
      const home = Math.atan2(-dy, -dx);
      const push = Math.min(1, (r - TURN_FROM) / (SWIM_MAX - TURN_FROM));
      turn += angleTo(k.a, home) * 2.4 * push;
    }
    for (const o of koi) {
      if (o === k) continue;
      const ox = o.x - k.x, oy = o.y - k.y;
      const d = Math.hypot(ox, oy);
      if (d < 34 && d > 0) {
        // Edge away from a koi ahead: turn to whichever side it isn't on
        const side = Math.cos(k.a) * oy - Math.sin(k.a) * ox;
        turn += (side > 0 ? -1 : 1) * 0.6 * (1 - d / 34);
      }
    }
    // A koi never turns faster than about a fifth of a circle a second
    turn = Math.max(-MAX_TURN, Math.min(MAX_TURN, turn));
    k.a += turn * dt;
    // Glide and kick: the speed rises and falls slowly
    const speed = k.base * (1 + 0.35 * Math.sin(0.37 * t + p3));
    k.x += Math.cos(k.a) * speed * dt;
    k.y += Math.sin(k.a) * speed * dt;
    const nr = Math.hypot(k.x - C, k.y - C);
    if (nr > SWIM_MAX) {
      k.x = C + ((k.x - C) * SWIM_MAX) / nr;
      k.y = C + ((k.y - C) * SWIM_MAX) / nr;
    }
    // The tail beats quicker when it swims faster, and swings wider into a turn
    k.beat += dt * (2.2 + speed * 0.22);
    k.tail = Math.max(-22, Math.min(22, 13 * Math.sin(k.beat) * (0.6 + (0.4 * speed) / k.base) - turn * 10));
  }
}
