// Pieces shared by the Bee + Sloth, Mushroom + Moth and Cats characters: crowns, bow ties, suit badges and the art's
// soft light side. Shapes and colors come from design/garden-mockup/art.js.
import type { Hat } from './Creature';
import type { Suit } from '../cards/deck';
import { GOLD, GOLD_STROKE, shade } from './color';
import { SUIT_PATHS } from './Suit';

export const stroke = (color: string, width = 1.6) => ({
  fill: 'none', stroke: color, strokeWidth: width, strokeLinecap: 'round', strokeLinejoin: 'round',
} as const);

export function Crown({ hat, dy, jewel }: { hat?: Hat; dy: number; jewel: string }) {
  if (!hat) return null;
  const gold = { fill: GOLD, stroke: GOLD_STROKE, strokeWidth: 1, strokeLinejoin: 'round' } as const;
  return (
    <g transform={`translate(0 ${dy})`}>
      {hat === 'king' ? (
        <>
          <path {...gold} d="M21 15 L22.5 4 L27.5 10 L32 2 L36.5 10 L41.5 4 L43 15 Z" />
          <circle cx={32} cy={11} r={1.8} fill={jewel} />
        </>
      ) : (
        <>
          <path {...gold} d="M23 14.5 Q23.5 9 27.5 9.5 Q29 5 32 4.5 Q35 5 36.5 9.5 Q40.5 9 41 14.5 Z" />
          <circle cx={27.5} cy={9.5} r={1.7} fill="#FFF" />
          <circle cx={32} cy={4.5} r={1.7} fill="#FFF" />
          <circle cx={36.5} cy={9.5} r={1.7} fill="#FFF" />
          <circle cx={32} cy={11} r={1.5} fill={jewel} />
        </>
      )}
    </g>
  );
}

export function BowTie({ cx, cy, color }: { cx: number; cy: number; color?: string }) {
  if (!color) return null;
  const wing = { fill: color, stroke: color, strokeWidth: 1.2, strokeLinejoin: 'round' } as const;
  return (
    <>
      <path {...wing} d={`M${cx - 1.4} ${cy} L${cx - 6} ${cy - 3.2} Q${cx - 6.8} ${cy} ${cx - 6} ${cy + 3.2} Z`} />
      <path {...wing} d={`M${cx + 1.4} ${cy} L${cx + 6} ${cy - 3.2} Q${cx + 6.8} ${cy} ${cx + 6} ${cy + 3.2} Z`} />
      <rect x={cx - 1.7} y={cy - 1.9} width={3.4} height={3.8} rx={1} fill={shade(color, 0.75)} />
    </>
  );
}

export function Badge({ suit, color, x, y, scale }: { suit: Suit; color?: string; x: number; y: number; scale: number }) {
  if (!color) return null;
  return <path transform={`translate(${x} ${y}) scale(${scale})`} d={SUIT_PATHS[suit]} fill={color} />;
}

/** The lighter right side of a shape (the art's soft vertical split): `split` painted inside the clip shape. */
export function LightHalf({ id, clip, split, color }: { id: string; clip: React.ReactNode; split: string; color: string }) {
  return (
    <>
      <clipPath id={id}>{clip}</clipPath>
      <path clipPath={`url(#${id})`} fill={color} d={split} />
    </>
  );
}
