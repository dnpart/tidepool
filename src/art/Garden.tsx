// Bee, sloth, toadstool and luna moth characters for the Bee + Sloth and Mushroom + Moth decks, and the Cats deck's cats
// (drawn in Cat.tsx). Every shape,
// coordinate and color is ported from design/garden-mockup/art.js (the approved master; Garden.test.ts checks the two
// match). Same viewBox as the octopus and manta, so card layouts and sizes don't change.
import { useId } from 'react';
import type { Suit } from '../cards/deck';
import type { Eyes, Hat } from './Creature';
import { ASPECT, VIEWBOX } from './Creature';
import { mix } from './color';
import { Badge, BowTie, Crown, LightHalf, stroke } from './gardenParts';
import { Cat, isLoafCat } from './Cat';

export type GardenKind = 'sloth' | 'bee' | 'mushroom' | 'moth' | 'cat';

export interface GardenProps {
  kind: GardenKind;
  /** Sloths and toadstools are hearts or diamonds; bees and moths are spades or clubs; cats are any suit. */
  suit: Suit;
  /** Default: happy for sloths, toadstools and sitting cats; open for bees, moths and loaf cats. */
  eyes?: Eyes;
  hat?: Hat;
  wave?: boolean;
  /** Suit symbol on the forehead (sloth, bee), stem (toadstool) or belly (moth), for suit buddies and Aces. */
  badge?: boolean;
  badgeColor?: string;
  /** Bow tie color (Jacks wear one in their suit symbol color). */
  bowtie?: string;
  jewel?: string;
  /** Toadstools stand in two tufts of grass, except on card backs. */
  grass?: boolean;
}

export const GARDEN_JEWEL = '#E0607E';

const SLOTH: Partial<Record<Suit, { fur: string; dark: string; toe: string }>> = {
  hearts: { fur: '#DFA28E', dark: '#C9826D', toe: '#FFF1DA' },
  diamonds: { fur: '#E6A774', dark: '#CC8752', toe: '#FFF1DA' },
};
const BEE: Partial<Record<Suit, { stripe: string; wing: string }>> = {
  spades: { stripe: '#34425E', wing: '#DCE6F6' },
  clubs: { stripe: '#2E4B41', wing: '#DDF1E6' },
};
const SHROOM: Partial<Record<Suit, { cap: string; light: string; gill: string }>> = {
  hearts: { cap: '#D9505E', light: '#E8737F', gill: '#F7B3A6' },
  diamonds: { cap: '#DE8650', light: '#E9A06F', gill: '#FFB862' },
};
const MOTH: Partial<Record<Suit, { wing: string; dark: string; edge: string }>> = {
  clubs: { wing: '#BFE7B0', dark: '#9CCF8C', edge: '#7DB46E' },
  spades: { wing: '#CDD7F6', dark: '#A9B7E6', edge: '#8796D2' },
};

interface FaceProps {
  y: number;
  gap: number;
  eyes: Eyes;
  ink: string;
  cheekGap?: number;
  cheekY?: number;
  cheek?: string;
  cheekOpacity?: number;
  lashes: boolean;
  mustache: boolean;
  mustacheY?: number;
  mouth?: boolean;
}

/** Cheeks, eyes, queen lashes, and a smile or the king's mustache, centered on x 32. */
function Face({
  y, gap, eyes, ink, cheekGap = gap + 4.6, cheekY = y + 4, cheek = '#FF8C9E', cheekOpacity = 0.55, lashes, mustache,
  mustacheY = y + 5, mouth = true,
}: FaceProps) {
  const x = 32;
  const line = stroke(ink);
  return (
    <>
      <ellipse cx={x - cheekGap} cy={cheekY} rx={2.7} ry={1.7} fill={cheek} opacity={cheekOpacity} />
      <ellipse cx={x + cheekGap} cy={cheekY} rx={2.7} ry={1.7} fill={cheek} opacity={cheekOpacity} />
      {[x - gap, x + gap].map((ex) => (
        <g key={ex}>
          {eyes === 'open' && (
            <>
              <ellipse cx={ex} cy={y} rx={2.1} ry={2.4} fill={ink} />
              <circle cx={ex + 0.7} cy={y - 0.8} r={0.75} fill="#FFF" />
            </>
          )}
          {eyes === 'happy' && <path {...line} d={`M${ex - 2.6} ${y + 1} Q${ex} ${y - 2.2} ${ex + 2.6} ${y + 1}`} />}
          {eyes === 'sleepy' && <path {...line} d={`M${ex - 2.4} ${y - 0.4} Q${ex} ${y + 2.2} ${ex + 2.4} ${y - 0.4}`} />}
        </g>
      ))}
      {lashes && (
        <path
          {...line}
          d={`M${x - gap - 1.9} ${y - 1.3} L${x - gap - 3.7} ${y - 2.1} M${x - gap - 1.2} ${y - 2.1} L${x - gap - 2.4} ${y - 3.6} M${x + gap + 1.9} ${y - 1.3} L${x + gap + 3.7} ${y - 2.1} M${x + gap + 1.2} ${y - 2.1} L${x + gap + 2.4} ${y - 3.6}`}
        />
      )}
      {mustache ? (
        <path
          fill={ink}
          transform={`translate(${x - 32} ${mustacheY - 33.3})`}
          d="M32 33 Q29.5 31 26.5 33.5 Q29 35.2 32 33.6 Q35 35.2 37.5 33.5 Q34.5 31 32 33 Z"
        />
      ) : mouth && <path {...line} d={`M${x - 2.2} ${y + 3.8} Q${x} ${y + 5.9} ${x + 2.2} ${y + 3.8}`} />}
    </>
  );
}

type Drawn = Required<Pick<GardenProps, 'suit' | 'eyes' | 'jewel' | 'grass'>> & Omit<GardenProps, 'kind'> & { uid: string };

const SLOTH_HEAD = 'M32 4.5 C42.5 4.5 50.5 12.5 50.5 23 C50.5 33.5 42.5 41 32 41 C21.5 41 13.5 33.5 13.5 23 C13.5 12.5 21.5 4.5 32 4.5 Z';
const SLOTH_MASK = 'M32 13.5 C40.5 13.5 46 19 46 25.5 C46 32.5 39.8 37 32 37 C24.2 37 18 32.5 18 25.5 C18 19 23.5 13.5 32 13.5 Z';

function Sloth({ suit, eyes, hat, wave, badge, badgeColor, bowtie, jewel, uid }: Drawn) {
  const P = SLOTH[suit] ?? SLOTH.hearts!;
  const furLight = mix(P.fur, '#FFFFFF', 0.16);
  const arm = { fill: 'none', stroke: P.dark, strokeWidth: 7, strokeLinecap: 'round' } as const;
  const toes = { fill: 'none', stroke: P.toe, strokeWidth: 1.2, strokeLinecap: 'round' } as const;
  const claws = (x: number, y: number, dir: number) => (
    <path {...toes} d={`M${x + dir * 1.6} ${y - 2.4} l${dir * 2.2} -0.8 M${x + dir * 2} ${y} l${dir * 2.4} 0 M${x + dir * 1.6} ${y + 2.4} l${dir * 2.2} 0.8`} />
  );
  return (
    <>
      <ellipse cx={24} cy={57} rx={5.6} ry={3.2} fill={P.dark} />
      <ellipse cx={40} cy={57} rx={5.6} ry={3.2} fill={P.dark} />
      <ellipse cx={32} cy={45} rx={17} ry={14} fill={P.fur} />
      <LightHalf id={`${uid}-body`} clip={<ellipse cx={32} cy={45} rx={17} ry={14} />} split="M34 28 C40 36 41 50 36 62 L64 62 L64 28 Z" color={furLight} />
      <path fill={P.fur} d="M24.5 8 Q26.5 2.6 29.5 6 Q32 1.4 34.6 6 Q37.6 2.6 39.6 8 Z" />
      <path fill={P.fur} d={SLOTH_HEAD} />
      <LightHalf id={`${uid}-head`} clip={<path d={SLOTH_HEAD} />} split="M36 0 C44 10 46 26 40 44 L64 44 L64 0 Z" color={furLight} />
      <path fill="#F8DC9F" d={SLOTH_MASK} />
      <LightHalf id={`${uid}-mask`} clip={<path d={SLOTH_MASK} />} split="M34.5 10 C29.5 18 29 29 33.5 40 L64 40 L64 10 Z" color="#FFEFD0" />
      <ellipse cx={24.6} cy={24.4} rx={5.4} ry={3.9} transform="rotate(-18 24.6 24.4)" fill="#7F8DA3" />
      <ellipse cx={39.4} cy={24.4} rx={5.4} ry={3.9} transform="rotate(18 39.4 24.4)" fill="#8C99AD" />
      <Face
        y={24.2} gap={7.4} eyes={eyes} ink="#2C3443" cheekGap={12.6} cheekY={30.2} mustacheY={34}
        lashes={hat === 'queen'} mustache={hat === 'king'} mouth={false}
      />
      <path fill="#5F6A80" d="M29.3 28.7 Q32 27.6 34.7 28.7 Q34.2 31.4 32 32 Q29.8 31.4 29.3 28.7 Z" />
      {hat !== 'king' && <path fill="none" stroke="#2C3443" strokeWidth={1.4} strokeLinecap="round" d="M29.8 33.9 Q32 35.5 34.2 33.9" />}
      <path {...arm} d="M18.5 37 Q18 47.5 27.5 48.5" />
      {claws(27.5, 48.5, 1)}
      {wave ? (
        <>
          <path {...arm} d="M45.5 37 Q53.5 33 55 21" />
          <path {...toes} d="M52.4 17.6 l-0.6 -2.4 M55 17 l0 -2.6 M57.6 17.6 l0.6 -2.4" />
        </>
      ) : (
        <>
          <path {...arm} d="M45.5 37 Q46 47.5 36.5 48.5" />
          {claws(36.5, 48.5, -1)}
        </>
      )}
      {badge && <Badge suit={suit} color={badgeColor} x={28.4} y={7.2} scale={0.3} />}
      <BowTie cx={32} cy={40.4} color={bowtie} />
      <Crown hat={hat} dy={-8.5} jewel={jewel} />
    </>
  );
}

function Bee({ suit, eyes, hat, wave, badge, badgeColor, bowtie, jewel, uid }: Drawn) {
  const P = BEE[suit] ?? BEE.spades!;
  const [Y, YD, YL] = ['#FFCD2E', '#F5A623', '#FFDB5C'];
  const ax = hat ? 3 : 0;
  return (
    <>
      <ellipse cx={17} cy={15} rx={8.5} ry={11} transform="rotate(-32 17 15)" fill={P.wing} />
      <ellipse cx={47} cy={15} rx={8.5} ry={11} transform="rotate(32 47 15)" fill={P.wing} />
      <path fill="none" stroke="#FFFFFF" strokeWidth={1.6} strokeLinecap="round" opacity={0.9} d="M14.5 21 Q13 13 17 8 M49.5 21 Q51 13 47 8" />
      <path
        fill="none" stroke={P.stripe} strokeWidth={1.8} strokeLinecap="round"
        d={`M27.5 14 Q25 6 ${20 - ax} ${2.5 + ax / 2} M36.5 14 Q39 6 ${44 + ax} ${2.5 + ax / 2}`}
      />
      <circle cx={20 - ax} cy={2.5 + ax / 2} r={2.5} fill="#F7A21B" />
      <circle cx={44 + ax} cy={2.5 + ax / 2} r={2.5} fill="#F7A21B" />
      <path fill={P.stripe} d="M29.4 52 L32 59 L34.6 52 Z" />
      <circle cx={32} cy={33} r={21} fill={Y} />
      <clipPath id={`${uid}-body`}><circle cx={32} cy={33} r={21} /></clipPath>
      <g clipPath={`url(#${uid}-body)`}>
        <path fill={YL} d="M38 8 C46 16 48 30 44 56 L60 56 L60 8 Z" opacity={0.7} />
        <ellipse cx={32} cy={58} rx={26} ry={9} fill={YD} />
        <path fill={P.stripe} d="M8 38 Q32 44.5 56 38 L56 44.6 Q32 51 8 44.6 Z M8 48.4 Q32 54.8 56 48.4 L56 56 L8 56 Z" />
      </g>
      {wave ? (
        <path fill="none" stroke={YD} strokeWidth={5} strokeLinecap="round" d="M50 31 Q56 27 57 19" />
      ) : (
        <path fill="none" stroke={YD} strokeWidth={4.4} strokeLinecap="round" d="M12.6 36 Q10.4 39 11.6 42 M51.4 36 Q53.6 39 52.4 42" />
      )}
      <Face
        y={27} gap={6.6} eyes={eyes} ink="#26303D" cheekY={31.4} cheek="#FF7E8A" cheekOpacity={0.6}
        lashes={hat === 'queen'} mustache={hat === 'king'}
      />
      {badge && <Badge suit={suit} color={badgeColor} x={28.4} y={15} scale={0.3} />}
      <BowTie cx={32} cy={36.6} color={bowtie} />
      <Crown hat={hat} dy={-1.5} jewel={jewel} />
    </>
  );
}

const SHROOM_STEM = 'M20.5 27 C18.5 37 16.5 49 16.5 60 L47.5 60 C47.5 49 45.5 37 43.5 27 Z';
const SHROOM_CAP = 'M6 26.5 C6 12 17.5 3 32 3 C46.5 3 58 12 58 26.5 C58 29.4 55.4 30 52.6 28.6 C45 25.4 19 25.4 11.4 28.6 C8.6 30 6 29.4 6 26.5 Z';

function Mushroom({ suit, eyes, hat, wave, badge, badgeColor, bowtie, jewel, grass, uid }: Drawn) {
  const P = SHROOM[suit] ?? SHROOM.hearts!;
  return (
    <>
      {grass && (
        <>
          <path fill="#94CF78" d="M5 60 Q3.5 47 9.5 40 Q14 49 17 60 Z" />
          <path fill="#ABDD8F" d="M59 60 Q60.5 47 54.5 40 Q50 49 47 60 Z" />
        </>
      )}
      <path fill="#F9D59F" d={SHROOM_STEM} />
      <LightHalf id={`${uid}-stem`} clip={<path d={SHROOM_STEM} />} split="M33.5 26 C29.5 36 29.5 49 33.5 61 L64 61 L64 26 Z" color="#FFE8BF" />
      {grass && (
        <>
          <path fill="#ABDD8F" d="M11 60 Q12 52 17.5 48.5 Q18.5 55 18 60 Z" />
          <path fill="#94CF78" d="M53 60 Q52 52 46.5 48.5 Q45.5 55 46 60 Z" />
        </>
      )}
      <ellipse cx={32} cy={27.6} rx={22.5} ry={4.8} fill={P.gill} />
      <path fill={P.cap} d={SHROOM_CAP} />
      <LightHalf id={`${uid}-cap`} clip={<path d={SHROOM_CAP} />} split="M39 0 C46 9 50 19 50.5 32 L64 32 L64 0 Z" color={P.light} />
      <g fill="#FFF6E3">
        <circle cx={15.5} cy={17.5} r={3.1} />
        <circle cx={25} cy={9.6} r={2.5} />
        <circle cx={33.5} cy={17} r={4.4} />
        <circle cx={45.5} cy={10.5} r={3.3} />
        <circle cx={51} cy={19.5} r={2.3} />
      </g>
      {wave && <path fill="none" stroke="#F6CF95" strokeWidth={5} strokeLinecap="round" d="M44.5 46 Q51.5 43 53 35.5" />}
      <Face
        y={41.5} gap={6.4} eyes={eyes} ink="#4A3C3C" cheekY={45.6} cheekOpacity={0.6}
        lashes={hat === 'queen'} mustache={hat === 'king'}
      />
      {badge && <Badge suit={suit} color={badgeColor} x={28.4} y={30.6} scale={0.3} />}
      <BowTie cx={32} cy={52} color={bowtie} />
      <Crown hat={hat} dy={-10} jewel={jewel} />
    </>
  );
}

/** One feathery antenna: a slim frond from the head (dir -1 left, 1 right), with little ticks along it. */
function Antenna({ dir, ax }: { dir: -1 | 1; ax: number }) {
  const [tx, ty, bx, by] = [32 + dir * (17 + ax), 1 - ax / 2, 32 + dir * 3, 13.4];
  let ticks = '';
  for (let t = 0.25; t < 0.95; t += 0.14) {
    const px = bx + (tx - bx) * t;
    const py = by + (ty - by) * t - 1.6 * Math.sin(Math.PI * t);
    ticks += `M${(px - dir * 1.5).toFixed(2)} ${(py - 1.5).toFixed(2)} L${px.toFixed(2)} ${py.toFixed(2)} L${(px + dir * 0.4).toFixed(2)} ${(py + 2).toFixed(2)} `;
  }
  return (
    <>
      <path fill="#D8B47A" d={`M${bx} ${by} Q${32 + dir * 12} ${8 - ax / 2} ${tx} ${ty} Q${32 + dir * 6} ${4 - ax / 2} ${bx - dir * 0.6} ${by - 0.6} Z`} />
      <path {...stroke('#B88E52', 0.8)} d={ticks} />
    </>
  );
}

function Moth({ suit, eyes, hat, wave, badge, badgeColor, bowtie, jewel }: Drawn) {
  const P = MOTH[suit] ?? MOTH.clubs!;
  const ax = hat ? 2.5 : 0;
  return (
    <>
      <Antenna dir={-1} ax={ax} />
      <Antenna dir={1} ax={ax} />
      <path fill={P.dark} d="M29 33 C21 34.5 15.5 40 15 46 C14.6 51 16 55 11.5 59.5 C18 59 22.5 54.5 24.5 50 C27 45 29 40 30 35 Z" />
      <path fill={P.dark} d="M35 33 C43 34.5 48.5 40 49 46 C49.4 51 48 55 52.5 59.5 C46 59 41.5 54.5 39.5 50 C37 45 35 40 34 35 Z" />
      <circle cx={21} cy={44.5} r={2.4} fill="#F5E3A2" />
      <circle cx={43} cy={44.5} r={2.4} fill="#F5E3A2" />
      <path fill={P.wing} d="M29.5 21 C22.5 13 11.5 9.5 5.5 12.5 C1.8 15 3 25 9 30.5 C15 35.5 24.5 36 30.5 32 Z" />
      <path fill={P.wing} d="M34.5 21 C41.5 13 52.5 9.5 58.5 12.5 C62.2 15 61 25 55 30.5 C49 35.5 39.5 36 33.5 32 Z" />
      <path fill="none" stroke={P.edge} strokeWidth={1.7} strokeLinecap="round" d="M28.5 20 C22 13.4 12 10.6 6.4 13 M35.5 20 C42 13.4 52 10.6 57.6 13" />
      <path fill={P.dark} d="M30.5 32 C24.5 36 15 35.5 9 30.5 C15 32.5 22 32.4 29.5 28 Z" opacity={0.55} />
      <path fill={P.dark} d="M33.5 32 C39.5 36 49 35.5 55 30.5 C49 32.5 42 32.4 34.5 28 Z" opacity={0.55} />
      {[14.5, 49.5].map((ex) => (
        <g key={ex}>
          <circle cx={ex} cy={21.5} r={3.3} fill="#F5E3A2" stroke="#C78B74" strokeWidth={1.1} />
          <circle cx={ex} cy={21.5} r={1.1} fill="#8E5A4C" />
        </g>
      ))}
      <ellipse cx={32} cy={38} rx={6} ry={12} fill="#F7F3E6" />
      <path fill="none" stroke="#E2DCC8" strokeWidth={1.1} strokeLinecap="round" d="M28 36 Q32 38 36 36 M28.4 41 Q32 43 35.6 41 M29.4 46 Q32 47.6 34.6 46" />
      {wave && <path fill="none" stroke="#EFE9D6" strokeWidth={3} strokeLinecap="round" d="M36.5 34 Q44 31 46 24" />}
      <circle cx={32} cy={22} r={10.8} fill="#F2EDDC" />
      <circle cx={32} cy={22} r={10} fill="#FFFDF5" />
      <Face
        y={22.2} gap={4.8} eyes={eyes} ink="#2F3A46" cheekGap={7.6} cheekY={25.8}
        lashes={hat === 'queen'} mustache={hat === 'king'}
      />
      {badge && <Badge suit={suit} color={badgeColor} x={29} y={36.5} scale={0.25} />}
      <BowTie cx={32} cy={33.4} color={bowtie} />
      <Crown hat={hat} dy={-4.8} jewel={jewel} />
    </>
  );
}

const DRAW: Record<GardenKind, (p: Drawn) => React.ReactElement> = { sloth: Sloth, bee: Bee, mushroom: Mushroom, moth: Moth, cat: Cat };
const DEFAULT_EYES: Record<GardenKind, (suit: Suit) => Eyes> = {
  sloth: () => 'happy', bee: () => 'open', mushroom: () => 'happy', moth: () => 'open',
  cat: (suit) => (isLoafCat(suit) ? 'open' : 'happy'),
};

/** The character drawn in viewBox coordinates, for use inside another SVG. */
export function GardenArt({ kind, eyes, jewel = GARDEN_JEWEL, grass = true, ...rest }: GardenProps) {
  // Clip ids must be unique per drawing, and useId's colons are fine inside url(#...)
  const uid = useId();
  const Draw = DRAW[kind];
  return <g><Draw {...rest} eyes={eyes ?? DEFAULT_EYES[kind](rest.suit)} jewel={jewel} grass={grass} uid={uid} /></g>;
}

/** Places a character inside another SVG with its top-left at (x, y), `size` wide. */
export function GardenAt({ x, y, size, ...props }: GardenProps & { x: number; y: number; size: number }) {
  return (
    <svg x={x} y={y} width={size} height={size * ASPECT} viewBox={VIEWBOX} overflow="visible">
      <GardenArt {...props} />
    </svg>
  );
}

// Head crops for small icons: the sloth's head, or the toadstool's cap and face (viewBox units)
const HEAD_BOX: Partial<Record<GardenKind, { left: number; top: number; w: number; h: number }>> = {
  sloth: { left: 12.5, top: 1, w: 39, h: 41 },
  mushroom: { left: 5, top: 2, w: 54, h: 48 },
  cat: { left: 12, top: 6, w: 40, h: 36 },
};

/** A happy Hearts sloth's head, toadstool or orange cat's head, `width` wide and centered on (cx, cy), for small icons. */
export function GardenHeadAt({ kind, cx, cy, width }: { kind: 'sloth' | 'mushroom' | 'cat'; cx: number; cy: number; width: number }) {
  const box = HEAD_BOX[kind]!;
  const height = (width * box.h) / box.w;
  return (
    <svg x={cx - width / 2} y={cy - height / 2} width={width} height={height} viewBox={`${box.left} ${box.top} ${box.w} ${box.h}`}>
      <GardenArt kind={kind} suit="hearts" eyes="happy" grass={false} />
    </svg>
  );
}

/** A standalone character, `size` px wide. Decorative unless given a `label`. */
export function Garden({
  size = 64, label, className, style, ...props
}: GardenProps & { size?: number; label?: string; className?: string; style?: React.CSSProperties }) {
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
      <GardenArt {...props} />
    </svg>
  );
}
