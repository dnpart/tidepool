// Where everything sits on the 360 × 360 Pond Hop board, with the numbers from design/garden-mockup/pond-hop.html.
// The mockup put blue at the top left; the plan seats the first opponent across from you, so corners follow the start.
import { CORNER, holeOf, LANE_FIRST, STARTS, TRACK } from './rules';

export const BOARD = 360;
export const CENTER = 180;
export const RADIUS = 128;
export const POND = 46;

/**
 * Marble colors by seat: you coral, the first opponent blue, the second gold, the third purple (not green, which would
 * melt into the lily pads). Each is [color, highlight].
 */
export const MARBLE_COLORS = [
  ['#E0607E', '#F7A1B4'],
  ['#3B78C4', '#8DB7EA'],
  ['#E8A317', '#F8D47A'],
  ['#7A5BC4', '#B9A6EA'],
] as const;
export const MARBLE_NAMES = ['coral', 'blue', 'gold', 'purple'] as const;

/** Each start's corner (fed into the start just clockwise of it) and the direction from the pond out to its lane. */
const CORNERS: Record<number, { base: [number, number]; axis: [number, number] }> = {
  30: { base: [42, 318], axis: [-1, 0] },
  0: { base: [42, 42], axis: [0, -1] },
  10: { base: [318, 42], axis: [1, 0] },
  20: { base: [318, 318], axis: [0, 1] },
};
/** The four spots in a corner, one per marble. */
export const CORNER_SPOTS: [number, number][] = [[-12, -12], [12, -12], [-12, 12], [12, 12]];

/** A track hole's center: hole 0 at the top, going clockwise. */
export function holeAt(hole: number, radius = RADIUS): [number, number] {
  const a = ((hole * 360) / TRACK - 90) * (Math.PI / 180);
  return [CENTER + Math.cos(a) * radius, CENTER + Math.sin(a) * radius];
}

export const cornerOf = (start: number) => CORNERS[start];

/** Lane hole k (0 by the track, 3 by the pond) for the player starting at `start`. */
export function laneAt(start: number, k: number): [number, number] {
  const { axis } = CORNERS[start];
  const r = 108 - k * 16;
  return [CENTER + axis[0] * r, CENTER + axis[1] * r];
}

/** Where a seat's marble is drawn for a given progress. */
export function marbleAt(seat: number, marble: number, progress: number): [number, number] {
  const start = STARTS[seat];
  if (progress === CORNER) {
    const [bx, by] = CORNERS[start].base;
    const [dx, dy] = CORNER_SPOTS[marble];
    return [bx + dx, by + dy];
  }
  const hole = holeOf(seat, progress);
  return hole === null ? laneAt(start, progress - LANE_FIRST) : holeAt(hole);
}
