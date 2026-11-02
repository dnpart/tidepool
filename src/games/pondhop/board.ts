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
/**
 * The die takes the color of whoever's turn it is, with white pips: [face, edge] by seat. Gold is darker than the gold
 * marble so the white pips stand out (3.6:1).
 */
export const DIE_COLORS = [
  ['#E0607E', '#B8405E'],
  ['#3B78C4', '#2A5C9C'],
  ['#B97A00', '#8F5E00'],
  ['#7A5BC4', '#5C3FA3'],
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

/** Winter's frozen pond, by light or dark mode (design/winter-pond/frozen-pond.html, look A, chosen by the owner). */
export const ICE = {
  light: {
    inner: '#F2F9FE', outer: '#CFE5F4', rim: '#9FC3DE', frost: '#FFFFFF', frostOpacity: 0.85,
    crack: '#86AED0', groove: '#FFFFFF', glint: '#FFFFFF', glintOpacity: 0.95,
    snow: '#FFFFFF', shade: '#A3C1DA', hop: '#6F9EC4', hopOpacity: 0.6, ridge: '#FFFFFF', ridgeOpacity: 0.75,
  },
  dark: {
    inner: '#35597B', outer: '#22405D', rim: '#5B86AC', frost: '#DCEBFA', frostOpacity: 0.28,
    crack: '#A4C8E6', groove: '#16293C', glint: '#DCEBFA', glintOpacity: 0.6,
    snow: '#E9F1FA', shade: '#08111B', hop: '#8CC3EC', hopOpacity: 0.45, ridge: '#DCEBFA', ridgeOpacity: 0.35,
  },
} as const;
export type Ice = (typeof ICE)[keyof typeof ICE];

/** Forest's pond, look A (design/pond-palettes/ponds.html): deep green water, fallen leaves, reeds. */
export const FOREST = {
  light: {
    inner: '#8FC6AE', outer: '#5E9F88', rim: '#4F8C76', ripple: '#FFFFFF', rippleOpacity: 0.55, reed: '#3E7A47',
    cattail: '#7A5235', hop: '#3E7A5A', hopOpacity: 0.5, ring: '#FFFFFF',
  },
  dark: {
    inner: '#2F5C4B', outer: '#1C3D31', rim: '#46775F', ripple: '#CFE8DA', rippleOpacity: 0.35, reed: '#5E9B67',
    cattail: '#9A6C48', hop: '#8FCB9B', hopOpacity: 0.4, ring: '#CFE8DA',
  },
} as const;

/** Honeycomb's pond, look A: a pool of honey in a ring of comb cells. */
export const HONEY = {
  light: {
    inner: '#F8CB55', outer: '#DC931F', rim: '#B9761A', shine: '#FFFFFF', shineOpacity: 0.6, bubble: '#FFE9A8',
    comb: '#F6DFA6', combStroke: '#D9A94A', cell: '#FFE7A3', cellStroke: '#C9892A', trail: '#A9620F', hop: '#B9761A',
    hopOpacity: 0.5,
  },
  dark: {
    inner: '#E2A633', outer: '#A8661A', rim: '#C98A2C', shine: '#FFF3D6', shineOpacity: 0.35, bubble: '#F6C35A',
    comb: '#4A3A28', combStroke: '#7A5C34', cell: '#F2C35A', cellStroke: '#8A5A20', trail: '#6E3D08', hop: '#E2B271',
    hopOpacity: 0.4,
  },
} as const;

/** Which pond a palette has: Winter's ice, Forest's leaves, Honeycomb's honey, or plain water (Lagoon, Coral Reef). */
export type PondKind = 'water' | 'ice' | 'leaves' | 'honey';
export const pondFor = (palette: string): PondKind =>
  palette === 'winter' ? 'ice' : palette === 'forest' ? 'leaves' : palette === 'honeycomb' ? 'honey' : 'water';
