/** Multiplies each RGB channel of a #RRGGBB color, e.g. shade('#EE8C9E', 0.88) === '#D17B8B'. */
export function shade(hex: string, factor: number): string {
  const n = parseInt(hex.slice(1), 16);
  const channels = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => Math.round(c * factor));
  return `#${channels.map((c) => c.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}

export const INK_DARK = '#1B2533';
export const SUCTION = '#F2D27A';
export const GOLD = '#F6C752';
export const GOLD_STROKE = '#D49A22';
export const DEFAULT_JEWEL = '#D23F5B';
