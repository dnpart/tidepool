// Koi Garden's own drawings (Nov 4), shared by the palette's sky, its card backs and its Pond Hop pond: three koi, a
// cherry petal and a paper lantern. New art, in design/art-export/10-koi-garden.svg for the owner to redraw.
import type { Ref } from 'react';

/** The three koi: white with red patches, plain orange, and white with black patches. */
export const KOI_COLORS = {
  kohaku: { body: '#FFF6EE', patch: '#E0552F', fin: '#F2C6B4' },
  orange: { body: '#F08A3A', patch: undefined, fin: '#F6B887' },
  shiro: { body: '#F4F1EA', patch: '#2C2C2C', fin: '#D9D4C9' },
} as const;
export type KoiKind = keyof typeof KOI_COLORS;

/**
 * A koi centered on (x, y), swimming toward angle `a` (degrees), `s` long. With `tailRef` the tail sits in its own group,
 * so a swimming koi can sway it about its root at (-15, 0).
 */
export function KoiFish({ kind, x, y, a, s, tailRef }: {
  kind: KoiKind; x: number; y: number; a: number; s: number; tailRef?: Ref<SVGGElement>;
}) {
  const { body, patch, fin } = KOI_COLORS[kind];
  const tail = <path d="M-15 0 L-21 -5 Q-19 0 -21 5 Z" fill={fin} opacity={0.9} />;
  return (
    <g transform={`translate(${x} ${y}) rotate(${a}) scale(${s / 30})`}>
      {tailRef ? <g ref={tailRef}>{tail}</g> : tail}
      <path d="M-2 -4 L-6 -9 L0 -5Z M-2 4 L-6 9 L0 5Z" fill={fin} opacity={0.85} />
      <path d="M14 0 C14 -4.5 6 -6 -2 -5 C-9 -4 -15 -1.5 -16 0 C-15 1.5 -9 4 -2 5 C6 6 14 4.5 14 0Z" fill={body} />
      {patch && (
        <>
          <path d="M9 -3 C5 -5 1 -3 2 0 C3 3 7 3.5 10 2Z" fill={patch} />
          <ellipse cx={-6} cy={-1.5} rx={3.5} ry={2} fill={patch} />
        </>
      )}
      <circle cx={10.5} cy={-2.2} r={0.9} fill="#1E2A2A" />
    </g>
  );
}

/** A cherry petal about 10 units long, centered on (0, 0). */
export function Petal({ color = 'var(--petal)', opacity }: { color?: string; opacity?: number }) {
  return <path d="M0 -5 C4 -4 4 3 0 5 C-1 3 -1.5 1 0 0 C-1.5 -1 -1 -3 0 -5Z" fill={color} opacity={opacity} />;
}

/** A glowing paper lantern in the viewBox -12 -14 24 28, its body 14 wide and 18 tall. */
export function Lantern({ color = 'var(--lantern)' }: { color?: string }) {
  return (
    <g>
      <circle r={12} fill="#F7B27A" opacity={0.22} />
      <rect x={-1.5} y={-12} width={3} height={3} rx={1} fill="#7A2A1C" />
      <rect x={-7} y={-9} width={14} height={18} rx={6} fill={color} />
      <rect x={-7} y={-1} width={14} height={2.2} fill="#7A2A1C" opacity={0.35} />
      <rect x={-4} y={9} width={8} height={2.5} rx={1} fill="#7A2A1C" />
    </g>
  );
}
