import type { Suit as SuitName } from '../cards/deck';

// 24×24 box, from PLAN.md "Card deck"
export const SUIT_PATHS: Record<SuitName, string> = {
  hearts:
    'M12 21 C5 15 2 11.5 2 8 C2 5 4.5 3 7 3 C9 3 11 4.3 12 6 C13 4.3 15 3 17 3 C19.5 3 22 5 22 8 C22 11.5 19 15 12 21 Z',
  diamonds: 'M12 2 L20 12 L12 22 L4 12 Z',
  spades:
    'M12 2 C16 7 21 10 21 14 C21 17 19 18.5 16.8 18.5 C15 18.5 13.6 17.6 13 16.5 C13.3 18.8 14.2 20.5 15.5 22 L8.5 22 C9.8 20.5 10.7 18.8 11 16.5 C10.4 17.6 9 18.5 7.2 18.5 C5 18.5 3 17 3 14 C3 10 8 7 12 2 Z',
  clubs:
    'M7.8 7 a4.2 4.2 0 1 0 8.4 0 a4.2 4.2 0 1 0 -8.4 0 Z M2.8 13.5 a4.2 4.2 0 1 0 8.4 0 a4.2 4.2 0 1 0 -8.4 0 Z M12.8 13.5 a4.2 4.2 0 1 0 8.4 0 a4.2 4.2 0 1 0 -8.4 0 Z M12 10 L9.2 22 L14.8 22 Z M9 12 L12 16.5 L15 12 Z',
};

/** A suit symbol inside an SVG, with its 24×24 box placed at (x, y) and scaled to `size`. */
export function SuitPath({
  suit, x, y, size, color, rotate = false, opacity,
}: {
  suit: SuitName; x: number; y: number; size: number; color: string; rotate?: boolean; opacity?: number;
}) {
  const s = size / 24;
  const turn = rotate ? ` rotate(180 12 12)` : '';
  return (
    <path d={SUIT_PATHS[suit]} fill={color} opacity={opacity} transform={`translate(${x} ${y}) scale(${s})${turn}`} />
  );
}

/** A standalone suit symbol icon. */
export function SuitIcon({ suit, size = 24, color }: { suit: SuitName; size?: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d={SUIT_PATHS[suit]} fill={color} />
    </svg>
  );
}
