// Octopus and manta characters. Shapes and coordinates are copied from PLAN.md "Characters";
// everything shares the viewBox 0 -8 64 68 so hats and faces line up across both species.
import type { Suit } from '../cards/deck';
import { DEFAULT_JEWEL, GOLD, GOLD_STROKE, INK_DARK, SUCTION, shade } from './color';
import { SUIT_PATHS } from './Suit';

export type CreatureKind = 'octopus' | 'manta';
export type Eyes = 'happy' | 'open' | 'sleepy';
export type Hat = 'king' | 'queen';

export interface CreatureProps {
  kind: CreatureKind;
  color: string;
  eyes?: Eyes;
  hat?: Hat;
  /** Octopus only: raise the right tentacle. */
  wave?: boolean;
  /** Suit symbol drawn on the octopus forehead or manta belly. */
  badge?: Suit;
  /** Badge fill color; defaults to the jewel color. */
  badgeColor?: string;
  jewel?: string;
  /** Bow tie color (Jacks wear one in their suit color). */
  bowtie?: string;
}

export const VIEWBOX = '0 -8 64 68';
export const ASPECT = 68 / 64;

const line = {
  fill: 'none',
  stroke: INK_DARK,
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

const tentacle = { fill: 'none', strokeWidth: 8.5, strokeLinecap: 'round' } as const;

function OctopusBody({ body, dark, wave }: { body: string; dark: string; wave: boolean }) {
  return (
    <>
      <g fill={SUCTION}>
        <circle cx="14.1" cy="45.3" r="2.1" /><circle cx="9.1" cy="46" r="2.3" /><circle cx="4.6" cy="45.5" r="2.5" />
        {wave ? (
          <><circle cx="56" cy="30.5" r="2.1" /><circle cx="60.3" cy="22.7" r="2.3" /><circle cx="61.2" cy="18.2" r="2.4" /></>
        ) : (
          <><circle cx="49.9" cy="45.3" r="2.1" /><circle cx="54.9" cy="46" r="2.3" /><circle cx="59.4" cy="45.5" r="2.5" /></>
        )}
        <circle cx="26.5" cy="48.5" r="2.1" /><circle cx="21.7" cy="52.7" r="2.3" /><circle cx="16" cy="55.2" r="2.6" />
        <circle cx="37.5" cy="48.5" r="2.1" /><circle cx="42.3" cy="52.7" r="2.3" /><circle cx="48" cy="55.2" r="2.6" />
      </g>
      <path {...tentacle} stroke={dark} d="M22 37 Q13 44 5 41.5" />
      <path {...tentacle} stroke={dark} d={wave ? 'M44 33 Q55 30 57 18' : 'M42 37 Q51 44 59 41.5'} />
      <path fill={body} d="M32 4 C44 4 52 12 52 24 C52 32 48 38 42 41 L22 41 C16 38 12 32 12 24 C12 12 20 4 32 4 Z" />
      <path fill={dark} d="M24 6 C16 10 12 17 12 24 C12 32 16 38 22 41 L27 41 C21 36 18 29 18 22 C18 15 20 10 24 6 Z" />
      <path {...tentacle} stroke={body} d="M27 39 Q23 49 15 51" />
      <path {...tentacle} stroke={body} d="M37 39 Q41 49 49 51" />
    </>
  );
}

function MantaBody({ body, dark }: { body: string; dark: string }) {
  return (
    <>
      <path stroke={dark} strokeWidth="2.2" strokeLinecap="round" fill="none" d="M32 40 Q36 46 31 50 Q26 54 31 59" />
      <circle cx="26" cy="16" r="3.4" fill={body} />
      <circle cx="38" cy="16" r="3.4" fill={body} />
      <path fill={body} d="M32 14 C36 14 40 16 43 20 C48 16 55 12 61 12 C60 20 55 30 46 36 C42 39 37 41 32 41 C27 41 22 39 18 36 C9 30 4 20 3 12 C9 12 16 16 21 20 C24 16 28 14 32 14 Z" />
      <path fill={dark} d="M43 20 C48 16 55 12 61 12 C60 20 55 30 46 36 C42 39 37 41 32 41 C38 36 42 28 43 20 Z" />
      <path stroke={dark} strokeWidth="1.4" strokeLinecap="round" fill="none" d="M27 32 Q32 34 37 32 M28 35.5 Q32 37.5 36 35.5" />
    </>
  );
}

function Face({ kind, eyes, hat }: { kind: CreatureKind; eyes: Eyes; hat?: Hat }) {
  return (
    <g transform={kind === 'octopus' ? 'translate(0 -5)' : 'translate(0 -12)'}>
      {kind === 'octopus' ? (
        <g fill="#FFF" opacity=".8">
          <ellipse cx="21" cy="33" rx="4.6" ry="3.3" /><ellipse cx="43" cy="33" rx="4.6" ry="3.3" />
        </g>
      ) : (
        <g fill="#FF6F86" opacity=".45">
          <ellipse cx="22.5" cy="33" rx="2.6" ry="1.6" /><ellipse cx="41.5" cy="33" rx="2.6" ry="1.6" />
        </g>
      )}
      {eyes === 'open' && (
        <>
          <circle cx="26" cy="28" r="2.9" fill={INK_DARK} /><circle cx="38" cy="28" r="2.9" fill={INK_DARK} />
          <circle cx="27" cy="27" r="1" fill="#FFF" /><circle cx="39" cy="27" r="1" fill="#FFF" />
        </>
      )}
      {eyes === 'happy' && <path {...line} d="M23 29 Q26 25.5 29 29 M35 29 Q38 25.5 41 29" />}
      {eyes === 'sleepy' && <path {...line} d="M23.5 28 Q26 30.5 28.5 28 M35.5 28 Q38 30.5 40.5 28" />}
      {hat === 'queen' && <path {...line} d="M23.4 25.4 L22 23.8 M40.6 25.4 L42 23.8" />}
      {hat === 'king' ? (
        <path fill={INK_DARK} d="M32 33 Q29.5 31 26.5 33.5 Q29 35.2 32 33.6 Q35 35.2 37.5 33.5 Q34.5 31 32 33 Z" />
      ) : (
        <path {...line} d="M29.5 33 Q32 35.5 34.5 33" />
      )}
    </g>
  );
}

/** A small bow tie under the smile: two rounded wings and a darker knot. */
function BowTie({ kind, color }: { kind: CreatureKind; color: string }) {
  // Under the octopus's head, over its front tentacles; on the manta's chest above the gills
  const [cx, cy] = kind === 'octopus' ? [32, 38.6] : [32, 27.2];
  const wing = { fill: color, stroke: color, strokeWidth: 1.2, strokeLinejoin: 'round' } as const;
  return (
    <g>
      <path {...wing} d={`M${cx - 1.4} ${cy} L${cx - 6} ${cy - 3.2} Q${cx - 6.8} ${cy} ${cx - 6} ${cy + 3.2} Z`} />
      <path {...wing} d={`M${cx + 1.4} ${cy} L${cx + 6} ${cy - 3.2} Q${cx + 6.8} ${cy} ${cx + 6} ${cy + 3.2} Z`} />
      <rect x={cx - 1.8} y={cy - 1.8} width={3.6} height={3.6} rx={1.2} fill={shade(color, 0.75)} />
    </g>
  );
}

function Crown({ kind, hat, jewel }: { kind: CreatureKind; hat: Hat; jewel: string }) {
  return (
    <g transform={kind === 'octopus' ? 'translate(0 -9)' : 'translate(0 -2)'}>
      {hat === 'king' ? (
        <>
          <path fill={GOLD} stroke={GOLD_STROKE} strokeWidth="1" strokeLinejoin="round"
            d="M21 15 L22.5 4 L27.5 10 L32 2 L36.5 10 L41.5 4 L43 15 Z" />
          <circle cx="32" cy="11" r="1.8" fill={jewel} />
        </>
      ) : (
        <>
          <path fill={GOLD} stroke={GOLD_STROKE} strokeWidth="1" strokeLinejoin="round"
            d="M23 14.5 Q23.5 9 27.5 9.5 Q29 5 32 4.5 Q35 5 36.5 9.5 Q40.5 9 41 14.5 Z" />
          <g fill="#FFF">
            <circle cx="27.5" cy="9.5" r="1.7" /><circle cx="32" cy="4.5" r="1.7" /><circle cx="36.5" cy="9.5" r="1.7" />
          </g>
          <circle cx="32" cy="11" r="1.5" fill={jewel} />
        </>
      )}
    </g>
  );
}

/** The creature drawn in viewBox coordinates, for use inside another SVG. */
export function CreatureArt({
  kind, color, eyes, hat, wave = false, badge, badgeColor, jewel = DEFAULT_JEWEL, bowtie,
}: CreatureProps) {
  const dark = shade(color, kind === 'octopus' ? 0.88 : 0.84);
  const badgeTransform = kind === 'octopus' ? 'translate(28.4 8.5) scale(0.3)' : 'translate(29 24.5) scale(0.25)';
  return (
    <g>
      {kind === 'octopus' ? <OctopusBody body={color} dark={dark} wave={wave} /> : <MantaBody body={color} dark={dark} />}
      {badge && <path d={SUIT_PATHS[badge]} fill={badgeColor ?? jewel} transform={badgeTransform} />}
      {bowtie && <BowTie kind={kind} color={bowtie} />}
      <Face kind={kind} eyes={eyes ?? (kind === 'octopus' ? 'happy' : 'open')} hat={hat} />
      {hat && <Crown kind={kind} hat={hat} jewel={jewel} />}
    </g>
  );
}

/** Places a creature inside another SVG with its top-left at (x, y), `size` wide. */
export function CreatureAt({ x, y, size, ...props }: CreatureProps & { x: number; y: number; size: number }) {
  return (
    <svg x={x} y={y} width={size} height={size * ASPECT} viewBox={VIEWBOX} overflow="visible">
      <CreatureArt {...props} />
    </svg>
  );
}

/** A standalone creature, `size` px wide. Decorative unless given a `label`. */
export function Creature({
  size = 64, label, className, style, ...props
}: CreatureProps & { size?: number; label?: string; className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      width={size}
      height={size * ASPECT}
      viewBox={VIEWBOX}
      overflow="visible"
      className={className}
      style={style}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <CreatureArt {...props} />
    </svg>
  );
}
