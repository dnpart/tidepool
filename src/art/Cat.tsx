// The Cats deck: an orange tabby (hearts, fat) and a calico (diamonds) sitting up, a black cat (spades, skinny) and a
// Siamese (clubs) lying as loaves. Every shape, coordinate and color is ported from design/garden-mockup/cats.js (the
// approved master; Garden.test.tsx checks the two match). Drawn through <Garden kind="cat">.
import type { Suit } from '../cards/deck';
import type { Eyes, Hat } from './Creature';
import { Badge, BowTie, Crown, LightHalf, stroke } from './gardenParts';

interface CatColors {
  fur: string;
  light: string;
  dark: string;
  belly: string;
  /** The calico's soft edge, so it shows on white cards. */
  outline?: string;
  /** Eye arcs and plain open eyes. */
  ink: string;
  /** Open eyes get a colored iris and a slit pupil (black cat, Siamese). */
  iris?: string;
  /** Mouth and whiskers. */
  line: string;
  nose: string;
  /** Inner ears and paw pads. */
  inner: string;
  /** The Siamese's dark ears, face, paws and tail. */
  point?: string;
}

const CAT: Record<Suit, CatColors> = {
  hearts: { fur: '#F2A04E', light: '#F7B771', dark: '#D9853A', belly: '#FFF3E2', ink: '#3B3534', line: '#3B3534', nose: '#E9788A', inner: '#F7A8B0' },
  diamonds: {
    fur: '#FFF8F0', light: '#FFFFFF', dark: '#E8DCCD', belly: '#F6E6D6', outline: '#E3CCB3', ink: '#3B3534', line: '#3B3534',
    nose: '#E9788A', inner: '#F7A8B0',
  },
  spades: {
    fur: '#3D3B4A', light: '#4F4D5E', dark: '#2C2A37', belly: '#4F4D5E', ink: '#F3E9D2', iris: '#F6C752', line: '#E6DCEB',
    nose: '#E9788A', inner: '#E58F9E',
  },
  clubs: {
    fur: '#F4E6D2', light: '#FBF2E6', dark: '#E2CFB6', belly: '#FBF2E6', ink: '#3B3534', iris: '#5B8DD6', line: '#F4E6D2',
    nose: '#C9707E', inner: '#B98A86', point: '#6B4E3D',
  },
};

const PATCH_ORANGE = '#F2A35E';
const PATCH_BLACK = '#3B3534';
/** The black cat's Jack wears its bow tie in the spades tint, since the suit color vanishes on black fur. */
const BLACK_CAT_BOWTIE = '#DCDDF0';

/** Cheeks, big eyes (an iris for the black cat and the Siamese), queen lashes, whiskers, nose, and a w mouth or mustache. */
function CatFace({ y, eyes, P, lashes, mustache }: { y: number; eyes: Eyes; P: CatColors; lashes: boolean; mustache: boolean }) {
  const [x, gap] = [32, 7.4];
  return (
    <>
      <ellipse cx={x - 12} cy={y + 4.6} rx={2.8} ry={1.7} fill="#FF8C9E" opacity={0.55} />
      <ellipse cx={x + 12} cy={y + 4.6} rx={2.8} ry={1.7} fill="#FF8C9E" opacity={0.55} />
      {[x - gap, x + gap].map((ex) => (
        <g key={ex}>
          {eyes === 'open' && (P.iris ? (
            <>
              <ellipse cx={ex} cy={y} rx={3.3} ry={3.7} fill={P.iris} />
              <ellipse cx={ex} cy={y + 0.2} rx={1.3} ry={2.9} fill="#1E1B22" />
              <circle cx={ex + 1.1} cy={y - 1.4} r={1.05} fill="#FFF" />
              <circle cx={ex - 1.2} cy={y + 1.5} r={0.5} fill="#FFF" />
            </>
          ) : (
            <>
              <ellipse cx={ex} cy={y} rx={3} ry={3.4} fill={P.ink} />
              <circle cx={ex + 1} cy={y - 1.2} r={1.05} fill="#FFF" />
              <circle cx={ex - 1.1} cy={y + 1.3} r={0.5} fill="#FFF" />
            </>
          ))}
          {eyes === 'happy' && <path {...stroke(P.ink, 1.8)} d={`M${ex - 3.2} ${y + 1.2} Q${ex} ${y - 2.8} ${ex + 3.2} ${y + 1.2}`} />}
          {eyes === 'sleepy' && <path {...stroke(P.ink, 1.8)} d={`M${ex - 3} ${y - 0.4} Q${ex} ${y + 2.8} ${ex + 3} ${y - 0.4}`} />}
        </g>
      ))}
      {lashes && (
        <path
          {...stroke(P.ink)}
          d={`M${x - gap - 2.8} ${y - 1.8} L${x - gap - 4.6} ${y - 2.8} M${x - gap - 1.8} ${y - 2.9} L${x - gap - 3} ${y - 4.5} M${x + gap + 2.8} ${y - 1.8} L${x + gap + 4.6} ${y - 2.8} M${x + gap + 1.8} ${y - 2.9} L${x + gap + 3} ${y - 4.5}`}
        />
      )}
      <path
        {...stroke(P.line, 0.9)}
        opacity={0.55}
        d={`M${x - 9} ${y + 4.2} L${x - 16} ${y + 3.2} M${x - 9} ${y + 5.8} L${x - 16} ${y + 6.6} M${x + 9} ${y + 4.2} L${x + 16} ${y + 3.2} M${x + 9} ${y + 5.8} L${x + 16} ${y + 6.6}`}
      />
      <path fill={P.nose} d={`M${x - 1.6} ${y + 3.2} L${x + 1.6} ${y + 3.2} Q${x + 1.4} ${y + 4.3} ${x} ${y + 5} Q${x - 1.4} ${y + 4.3} ${x - 1.6} ${y + 3.2} Z`} />
      {mustache ? (
        // The Siamese's light mouth line would vanish on its dark mask, so its mustache is dark brown
        <path
          fill={P.point ? '#3B2C24' : P.line}
          transform={`translate(0 ${y + 6.4 - 33.3})`}
          d="M32 33 Q29.5 31 26.5 33.5 Q29 35.2 32 33.6 Q35 35.2 37.5 33.5 Q34.5 31 32 33 Z"
        />
      ) : (
        <path {...stroke(P.line, 1.3)} d={`M${x - 2.6} ${y + 5.6} Q${x - 1.3} ${y + 7.2} ${x} ${y + 5.4} Q${x + 1.3} ${y + 7.2} ${x + 2.6} ${y + 5.6}`} />
      )}
    </>
  );
}

const headPath = (dy: number) =>
  `M32 ${6 + dy} C44 ${6 + dy} 51 ${13 + dy} 51 ${22 + dy} C51 ${31 + dy} 43 ${36 + dy} 32 ${36 + dy} C21 ${36 + dy} 13 ${31 + dy} 13 ${22 + dy} C13 ${13 + dy} 20 ${6 + dy} 32 ${6 + dy} Z`;

/** Ears, head, markings and face, `dy` lower than the sitting cat's. */
function Head({ suit, P, dy, eyes, hat, badge, uid }: { suit: Suit; P: CatColors; dy: number; eyes: Eyes; hat?: Hat; badge: boolean; uid: string }) {
  const left = suit === 'diamonds' ? PATCH_ORANGE : P.point ?? P.fur;
  const right = suit === 'diamonds' ? PATCH_BLACK : P.point ?? P.fur;
  const edge = P.outline ? { stroke: P.outline, strokeWidth: 1.2 } : {};
  return (
    <>
      <path fill={left} stroke={left} strokeWidth={2} strokeLinejoin="round" d={`M15.5 ${15 + dy} L17 ${2.5 + dy} L27 ${8.5 + dy} Z`} />
      <path fill={right} stroke={right} strokeWidth={2} strokeLinejoin="round" d={`M48.5 ${15 + dy} L47 ${2.5 + dy} L37 ${8.5 + dy} Z`} />
      <path fill={P.inner} d={`M18.2 ${12 + dy} L18.9 ${5.6 + dy} L24.4 ${9.1 + dy} Z`} />
      <path fill={P.inner} d={`M45.8 ${12 + dy} L45.1 ${5.6 + dy} L39.6 ${9.1 + dy} Z`} />
      <path fill={P.fur} {...edge} d={headPath(dy)} />
      <LightHalf
        id={`${uid}-head`}
        clip={<path {...edge} d={headPath(dy)} />}
        split={`M37 ${dy} C44 ${10 + dy} 46 ${24 + dy} 41 ${40 + dy} L64 ${40 + dy} L64 ${dy} Z`}
        color={P.light}
      />
      {suit === 'hearts' && !badge && (
        <path
          fill="none" stroke={P.dark} strokeWidth={1.8} strokeLinecap="round"
          d={`M28.5 ${9 + dy} L29.4 ${12.6 + dy} M32 ${8.4 + dy} L32 ${12.6 + dy} M35.5 ${9 + dy} L34.6 ${12.6 + dy}`}
        />
      )}
      {suit === 'diamonds' && (
        <>
          <clipPath id={`${uid}-patches`}><path d={headPath(dy)} /></clipPath>
          <g clipPath={`url(#${uid}-patches)`}>
            <circle cx={17} cy={11 + dy} r={10} fill={PATCH_ORANGE} />
            <circle cx={48} cy={10 + dy} r={8} fill={PATCH_BLACK} />
          </g>
        </>
      )}
      {suit === 'clubs' && (
        <>
          <clipPath id={`${uid}-mask`}><path d={headPath(dy)} /></clipPath>
          <g clipPath={`url(#${uid}-mask)`}>
            <ellipse cx={32} cy={27.5 + dy} rx={9.5} ry={8} fill={P.point} opacity={0.9} />
            <ellipse cx={32} cy={10 + dy} rx={6} ry={4} fill={P.point} opacity={0.25} />
          </g>
        </>
      )}
      <CatFace y={20.5 + dy} eyes={eyes} P={P} lashes={hat === 'queen'} mustache={hat === 'king'} />
    </>
  );
}

/** A raised paw seen from the front: the paw, one bigger pink pad and three little toe beans above it. */
function RaisedPaw({ x, y, r, P, color }: { x: number; y: number; r: number; P: CatColors; color?: string }) {
  return (
    <>
      <circle cx={x} cy={y} r={r} fill={color ?? P.belly} />
      <ellipse cx={x} cy={y + r * 0.3} rx={r * 0.42} ry={r * 0.34} fill={P.inner} />
      <circle cx={x - r * 0.48} cy={y - r * 0.32} r={r * 0.19} fill={P.inner} />
      <circle cx={x} cy={y - r * 0.5} r={r * 0.19} fill={P.inner} />
      <circle cx={x + r * 0.48} cy={y - r * 0.32} r={r * 0.19} fill={P.inner} />
    </>
  );
}

const Paw = ({ x, y, color }: { x: number; y: number; color: string }) => <ellipse cx={x} cy={y} rx={4.2} ry={2.8} fill={color} />;

const SIT_BODY: Partial<Record<Suit, string>> = {
  hearts: 'M32 29 C46 29 52.5 40 52.5 50 C52.5 57 47.5 59.5 40.5 59.5 L23.5 59.5 C16.5 59.5 11.5 57 11.5 50 C11.5 40 18 29 32 29 Z',
  diamonds: 'M32 30 C42 30 47 40 47 50 C47 56 43 59.5 38 59.5 L26 59.5 C21 59.5 17 56 17 50 C17 40 22 30 32 30 Z',
};

export interface CatDrawProps {
  suit: Suit;
  eyes?: Eyes;
  hat?: Hat;
  wave?: boolean;
  badge?: boolean;
  badgeColor?: string;
  bowtie?: string;
  jewel: string;
  uid: string;
}

/** Red team: sitting up with the tail curled around the side; the orange tabby is fat and round. */
function SittingCat({ suit, eyes = 'happy', hat, wave, badge, badgeColor, bowtie, jewel, uid }: CatDrawProps) {
  const P = CAT[suit];
  const fat = suit === 'hearts';
  const body = SIT_BODY[suit] ?? SIT_BODY.diamonds!;
  const edge = P.outline ? { stroke: P.outline, strokeWidth: 1.2 } : {};
  const arm = 'M43 40 Q53 37 54.5 26';
  return (
    <>
      <path
        fill="none" stroke={suit === 'diamonds' ? PATCH_ORANGE : P.dark} strokeWidth={6} strokeLinecap="round"
        d={fat ? 'M45 57.5 Q58.5 58.5 59 47 Q59 40 54 37.5' : 'M40 57.5 Q55 58.5 55.5 47 Q55.5 40 50.5 37.5'}
      />
      <path fill={P.fur} {...edge} d={body} />
      <LightHalf
        id={`${uid}-body`}
        clip={<path {...edge} d={body} />}
        split={fat ? 'M38 27 C44 36 45 48 42 62 L64 62 L64 27 Z' : 'M35 28 C40 36 41 48 38 62 L64 62 L64 28 Z'}
        color={P.light}
      />
      {suit === 'diamonds' && (
        <>
          <clipPath id={`${uid}-spots`}><path d={body} /></clipPath>
          <g clipPath={`url(#${uid}-spots)`}>
            <circle cx={16} cy={44} r={8} fill={PATCH_ORANGE} />
            <circle cx={47} cy={54} r={7} fill={PATCH_BLACK} />
          </g>
        </>
      )}
      {fat && (
        <path fill="none" stroke={P.dark} strokeWidth={1.8} strokeLinecap="round" d="M13.6 44 L18 45 M13.2 49.5 L17.6 50 M50.4 44 L46 45 M50.8 49.5 L46.4 50" />
      )}
      {fat ? <ellipse cx={32} cy={48.5} rx={10} ry={10} fill={P.belly} /> : <ellipse cx={32} cy={48} rx={7} ry={9} fill={P.belly} />}
      <Paw x={fat ? 25.5 : 27} y={58.6} color={P.belly} />
      {!wave && <Paw x={fat ? 38.5 : 37} y={58.6} color={P.belly} />}
      <Head suit={suit} P={P} dy={0} eyes={eyes} hat={hat} badge={!!(badge && badgeColor)} uid={uid} />
      {wave && (
        <>
          {/* The raised paw, clear of the whiskers; the calico's gets the same soft outline as its body */}
          {P.outline && <path fill="none" stroke={P.outline} strokeWidth={7.4} strokeLinecap="round" d={arm} />}
          <path fill="none" stroke={P.fur} strokeWidth={6} strokeLinecap="round" d={arm} />
          <RaisedPaw x={54.7} y={23.8} r={4.2} P={P} />
        </>
      )}
      {badge && <Badge suit={suit} color={badgeColor} x={28.4} y={9.2} scale={0.3} />}
      <BowTie cx={32} cy={37.4} color={bowtie} />
      <Crown hat={hat} dy={-8.5} jewel={jewel} />
    </>
  );
}

const LOAF_BODY = 'M14 60 C8 60 6.5 54 7.5 48.5 C9.5 40.5 18 36.5 30 36.5 L36 36.5 C50 36.5 57.5 42 57.5 50.5 C57.5 57 54.5 60 49.5 60 Z';
const SKINNY_BODY = 'M19 60 C14 60 13 55 13.5 50.5 C14.5 43.5 20.5 40 29.5 40 L35 40 C45 40 50.5 44.5 50.5 51 C50.5 57 48 60 44 60 Z';

/** Black team: a loaf with paws tucked; the black cat is skinny with a long thin tail curling up behind. */
function LoafCat({ suit, eyes = 'open', hat, wave, badge, badgeColor, bowtie, jewel, uid }: CatDrawProps) {
  const P = CAT[suit];
  const dy = 5;
  const skinny = suit === 'spades';
  const body = skinny ? SKINNY_BODY : LOAF_BODY;
  const pawColor = P.point ?? (skinny ? '#4F4D5E' : P.belly);
  return (
    <>
      {skinny && <path fill="none" stroke={P.dark} strokeWidth={3.4} strokeLinecap="round" d="M47 55 Q58 54 58 42 Q58 34 53.5 31.5" />}
      <path fill={P.fur} d={body} />
      <LightHalf
        id={`${uid}-body`}
        clip={<path d={body} />}
        split={skinny ? 'M38 37 C44 42 45 51 43 62 L64 62 L64 37 Z' : 'M40 34 C47 40 49 50 46 62 L64 62 L64 34 Z'}
        color={P.light}
      />
      {P.point && (
        <>
          <clipPath id={`${uid}-haunch`}><path d={body} /></clipPath>
          <g clipPath={`url(#${uid}-haunch)`}><ellipse cx={54} cy={54} rx={9} ry={8} fill={P.point} opacity={0.35} /></g>
        </>
      )}
      {!skinny && <path fill="none" stroke={P.point ?? P.dark} strokeWidth={5} strokeLinecap="round" d="M55 55.5 Q50 60.5 40.5 59.6" />}
      <Paw x={skinny ? 26.5 : 25} y={59} color={pawColor} />
      {!wave && <Paw x={skinny ? 36.5 : 35} y={59} color={pawColor} />}
      <Head suit={suit} P={P} dy={dy} eyes={eyes} hat={hat} badge={!!(badge && badgeColor)} uid={uid} />
      {wave && (
        <>
          <path fill="none" stroke={P.fur} strokeWidth={skinny ? 4.6 : 5.5} strokeLinecap="round" d="M42 51 Q50 47 51.5 37.5" />
          <RaisedPaw x={51.7} y={35.6} r={4} P={P} color={pawColor} />
        </>
      )}
      {badge && <Badge suit={suit} color={badgeColor} x={28.4} y={9.2 + dy} scale={0.3} />}
      <BowTie cx={32} cy={37.4 + dy + 1} color={bowtie && skinny ? BLACK_CAT_BOWTIE : bowtie} />
      <Crown hat={hat} dy={-8.5 + dy} jewel={jewel} />
    </>
  );
}

/** Hearts and diamonds sit up; spades and clubs lie as loaves. */
export function Cat(props: CatDrawProps) {
  return props.suit === 'spades' || props.suit === 'clubs' ? <LoafCat {...props} /> : <SittingCat {...props} />;
}
