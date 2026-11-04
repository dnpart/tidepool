// Where everything sits on the 360 × 360 Pond Hop board, with the numbers from design/garden-mockup/pond-hop.html.
// The mockup put blue at the top left; the plan seats the first opponent across from you, so corners follow the start.
import { CORNER, holeOf, LANE_FIRST, STARTS, TRACK } from './rules';

export const BOARD = 360;
export const CENTER = 180;
export const RADIUS = 128;
/** The pond's water reaches the inside of the stones the track runs on. */
export const POND = 126;

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

/** Which pond a palette has: Lagoon and Coral Reef water, Winter's ice, Forest's leaves, Honeycomb's honey, Koi Garden's koi. */
export type PondKind = 'water' | 'ice' | 'leaves' | 'honey' | 'koi';
export const pondFor = (palette: string): PondKind =>
  palette === 'winter' ? 'ice' : palette === 'forest' ? 'leaves' : palette === 'honeycomb' ? 'honey' : palette === 'koi' ? 'koi' : 'water';

/**
 * Each pond's colors by mode (design/pond-palettes/koi-ponds.html, chosen by the owner Nov 4): the water's gradient, its
 * marks (ripples, cracks), the hop lines, the edge stones [face, shade, top: snow, moss or a highlight] (comb cells in
 * honey: [wax, outline]), and the piers [deck, boards]. The koi piers also have red rails.
 */
export interface PondLook {
  inner: string; outer: string; mark: string; hop: string;
  stone: [string, string, string?];
  pier: string; plank: string;
  rail?: string;
}
export const POND_LOOK: Record<PondKind, Record<'light' | 'dark', PondLook>> = {
  water: {
    light: { inner: '#CDEEEE', outer: '#9FD3D6', mark: '#FFFFFF', hop: '#5E9C6B', stone: ['#DCD3C1', '#BDB29D', '#EEE8DB'], pier: '#C69C6D', plank: '#A57E52' },
    dark: { inner: '#2B5C66', outer: '#173A44', mark: '#CFEAEA', hop: '#8FCBB8', stone: ['#8F887A', '#6E685C', '#B3AC9E'], pier: '#8E7050', plank: '#6B5238' },
  },
  ice: {
    light: { inner: '#F2F9FE', outer: '#CFE5F4', mark: '#86AED0', hop: '#6F9EC4', stone: ['#B4BEC8', '#94A0AC', '#FFFFFF'], pier: '#9C8571', plank: '#7E6A57' },
    dark: { inner: '#35597B', outer: '#22405D', mark: '#A4C8E6', hop: '#8CC3EC', stone: ['#7D8C9A', '#5E6B78', '#DCEBFA'], pier: '#7C6A5A', plank: '#5E4F42' },
  },
  leaves: {
    light: { inner: '#8FC6AE', outer: '#5E9F88', mark: '#FFFFFF', hop: '#E9F5EE', stone: ['#B3AE9F', '#938D7E', '#8DB86B'], pier: '#8A6A4A', plank: '#6E5238' },
    dark: { inner: '#2F5C4B', outer: '#1C3D31', mark: '#CFE8DA', hop: '#8FCB9B', stone: ['#7C786C', '#5E5A50', '#5E9B67'], pier: '#6E5238', plank: '#523C28' },
  },
  honey: {
    light: { inner: '#F8CB55', outer: '#DC931F', mark: '#FFFFFF', hop: '#FFF4D6', stone: ['#FFF0C2', '#D9A94A'], pier: '#FFF0C2', plank: '#D9A94A' },
    dark: { inner: '#E2A633', outer: '#A8661A', mark: '#FFF3D6', hop: '#FFF4D6', stone: ['#5A4630', '#9C7A44'], pier: '#5A4630', plank: '#9C7A44' },
  },
  koi: {
    light: { inner: '#7FC3B5', outer: '#3E8579', mark: '#FFFFFF', hop: '#E6F4EF', stone: ['#C3C6C0', '#9EA39C', '#E2E4DF'], pier: '#EAD7B8', plank: '#C9AE88', rail: '#B8432C' },
    dark: { inner: '#2A5E57', outer: '#163A35', mark: '#CFE8E1', hop: '#9FD3C6', stone: ['#7F837D', '#5E625C', '#A9ADA6'], pier: '#B59A7A', plank: '#8C7558', rail: '#A13C28' },
  },
};
