// Koi Garden's own drawings (Nov 4), shared by the palette's sky, its card backs and its Pond Hop pond: three koi, a
// cherry petal and a paper lantern. The koi's shape is the owner's (Nov 22); the rest is in
// design/art-export/10-koi-garden.svg for the owner to redraw.
import type { Ref } from 'react';
import { KOI_SHAPES, type KoiShape } from './koiArt';
export { KOI_TAIL_ROOT } from './koiArt';

/**
 * The three koi: white with red patches, plain orange, and the owner's gray-white with black patches (Nov 22, the
 * shiro). All three take the owner's koi shape (`koiArt.ts`, from file 09). One eye sits on the head's patch: light on
 * the shiro's black patch, as drawn, and dark (`patchEye`) on the others.
 */
export const KOI_COLORS = {
  kohaku: { body: '#FFF6EE', patch: '#E0552F', fin: '#F2C6B4', patchEye: '#2C2C2C' },
  orange: { body: '#F08A3A', patch: undefined, fin: '#F6B887', patchEye: '#2C2C2C' },
  shiro: { body: '#D8D8D8', patch: '#2C2C2C', fin: '#BBAB99', patchEye: '#D8D8D8' },
} as const;
export type KoiKind = keyof typeof KOI_COLORS;
const KOI_EYE = '#2C2C2C';

function KoiShapeAt({ shape, fill }: { shape: KoiShape; fill: string }) {
  const transform = `matrix(${shape.m.join(' ')})`;
  if (shape.ellipse) {
    const [cx, cy, rx, ry] = shape.ellipse;
    return <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={fill} transform={transform} />;
  }
  if (shape.role === 'whisker') {
    return <path d={shape.d} fill="none" stroke={fill} strokeWidth={shape.strokeWidth} strokeLinecap="round" transform={transform} />;
  }
  return <path d={shape.d} fill={fill} transform={transform} />;
}

/**
 * A koi centered on (x, y), swimming toward angle `a` (degrees), `s` long (s 30: the nose at 14, the tail's tip at -21).
 * With `tailRef` the tail sits in its own group, so a swimming koi can sway it about `KOI_TAIL_ROOT`.
 */
export function KoiFish({ kind, x, y, a, s, tailRef }: {
  kind: KoiKind; x: number; y: number; a: number; s: number; tailRef?: Ref<SVGGElement>;
}) {
  const { body, patch, fin, patchEye } = KOI_COLORS[kind];
  const color = { body, fin, tail: fin, whisker: fin, patch, eye: KOI_EYE, patchEye };
  return (
    <g transform={`translate(${x} ${y}) rotate(${a}) scale(${s / 30})`}>
      {KOI_SHAPES.map((shape, i) => {
        const fill = color[shape.role];
        if (!fill) return null;
        const drawn = <KoiShapeAt key={i} shape={shape} fill={fill} />;
        return shape.role === 'tail' && tailRef ? <g key={i} ref={tailRef}>{drawn}</g> : drawn;
      })}
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
