// The Cats deck: two skinny cats sitting up, a calico (diamonds) and a black cat (spades), and two fat cats lying as
// loaves, an orange tabby (hearts) and a Siamese (clubs). Bodies, heads and markings are ported from
// design/garden-mockup/cats.js, flat now (no light side, Nov 27); the eyes, blush and raised paw are the owner's fox's
// (file 02, foxOwlArt.ts) and the crowns, bow ties and mustache the owner's too (gardenParts.tsx). Drawn through
// <Garden kind="cat">.
import type { Suit } from '../cards/deck';
import type { Eyes, Hat } from './Creature';
import { FOX_OWL_CELLS, type FoxOwlCellId, type FoxOwlNode } from './foxOwlArt';
import { Badge, BowTie, Crown, Mustache, stroke } from './gardenParts';

interface CatColors {
  fur: string;
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
  hearts: { fur: '#F2A04E', dark: '#D9853A', belly: '#FFF3E2', ink: '#3B3534', line: '#3B3534', nose: '#E9788A', inner: '#F7A8B0' },
  diamonds: {
    fur: '#FFF8F0', dark: '#E8DCCD', belly: '#F6E6D6', outline: '#E3CCB3', ink: '#3B3534', line: '#3B3534',
    nose: '#E9788A', inner: '#F7A8B0',
  },
  spades: {
    fur: '#3D3B4A', dark: '#2C2A37', belly: '#4F4D5E', ink: '#F3E9D2', iris: '#F6C752', line: '#E6DCEB',
    nose: '#E9788A', inner: '#E58F9E',
  },
  clubs: {
    fur: '#F4E6D2', dark: '#E2CFB6', belly: '#FBF2E6', ink: '#3B3534', iris: '#5B8DD6', line: '#F4E6D2',
    nose: '#C9707E', inner: '#B98A86', point: '#6B4E3D',
  },
};

const PATCH_ORANGE = '#F2A35E';
const PATCH_BLACK = '#3B3534';
/** The black cat's Jack wears its bow tie in the spades tint, since the suit color vanishes on black fur. */
const BLACK_CAT_BOWTIE = '#DCDDF0';

/** Where a borrowed drawing comes from: a cell of the fox and owl sheet and the shapes wanted from it. */
type Borrow = { cell: FoxOwlCellId; nodes: FoxOwlNode[] };

const FOX_INK = '#3e4a5a';
const cellOf = (cell: FoxOwlCellId) => FOX_OWL_CELLS[cell];
const eyesIn = (cell: FoxOwlCellId): Borrow => ({ cell, nodes: cellOf(cell).nodes.filter((n) => n.part === 'eyes') });
const BLUSH_FILL = '#e85477';
/** The white shines in the fox's open eyes. */
const isHighlight = (n: FoxOwlNode) => n.attrs.fill === '#f5f8fc';
/** The two open-eye shapes (not the Queen's lashes). */
const almondsOf = (b: Borrow) => b.nodes.filter((n) => n.attrs.fill === FOX_INK && n.box[2] > 5);

/** The fox's eyes (from the owner's file 02): open, happy and sleepy, and the Queen's with her lashes. */
const FOX_EYES: Record<Eyes, { plain: Borrow; queen: Borrow }> = {
  open: { plain: eyesIn('Hearts_number_cards'), queen: eyesIn('Hearts_Queen') },
  happy: { plain: eyesIn('Hearts_Ace'), queen: eyesIn('Cheering_Queen_fox') },
  sleepy: { plain: eyesIn('Sleepy_fox'), queen: eyesIn('Sleepy_fox') },
};

/** Each suit's blush from the same sheet: the foxes' hearts and diamonds, the owls' spades and clubs. */
const BLUSH_CELL: Record<Suit, FoxOwlCellId> = {
  hearts: 'Hearts_number_cards', diamonds: 'Diamonds_number_cards', spades: 'Spades_number_cards', clubs: 'Clubs_number_cards',
};
/** The two blush shapes, left first. */
const blushOf = (suit: Suit): FoxOwlNode[] =>
  cellOf(BLUSH_CELL[suit]).nodes.filter((n) => n.attrs.fill === BLUSH_FILL).sort((a, b) => a.box[0] - b.box[0]);

const boundsOf = (nodes: FoxOwlNode[]) => {
  const left = Math.min(...nodes.map((n) => n.box[0]));
  const top = Math.min(...nodes.map((n) => n.box[1]));
  return {
    cx: (left + Math.max(...nodes.map((n) => n.box[0] + n.box[2]))) / 2,
    cy: (top + Math.max(...nodes.map((n) => n.box[1] + n.box[3]))) / 2,
  };
};

/** The fox's nose, which the eyes are placed by (its middle, in viewBox units). */
function noseOf(cell: FoxOwlCellId): { cx: number; cy: number } {
  const nose = cellOf(cell).nodes.find((n) => n.attrs.fill === FOX_INK && n.box[2] > 2 && n.box[2] < 3 && n.box[3] > 1.7 && n.box[3] < 2.3);
  if (!nose) throw new Error(`No nose in ${cell}`);
  return { cx: nose.box[0] + nose.box[2] / 2, cy: nose.box[1] + nose.box[3] / 2 };
}

/** Draws sheet shapes moved so (fromX, fromY) lands on (toX, toY), scaled by `s`, with colors swapped by `paint`. */
function Borrowed({ cell, nodes, from, to, s = 1, paint }: Borrow & {
  from: { cx: number; cy: number }; to: { cx: number; cy: number }; s?: number; paint?: (color: string, node: FoxOwlNode) => string;
}) {
  const swap = (v: string | undefined, n: FoxOwlNode) => (v && paint && v !== 'none' ? paint(v, n) : v);
  return (
    <g transform={`translate(${to.cx} ${to.cy}) scale(${s}) translate(${-from.cx} ${-from.cy}) ${cellOf(cell).transform}`}>
      {nodes.map((n, i) => {
        const Tag = n.tag;
        return <Tag key={i} {...n.attrs} fill={swap(n.attrs.fill, n)} stroke={swap(n.attrs.stroke, n)} />;
      })}
    </g>
  );
}

/** The fox's eyes, blush (in the suit's shape) and Queen lashes, then whiskers, nose, and a w mouth or mustache. */
function CatFace({ y, eyes, P, suit, queen, mustache }: { y: number; eyes: Eyes; P: CatColors; suit: Suit; queen: boolean; mustache: boolean }) {
  const x = 32;
  const eyeSet = FOX_EYES[eyes][queen ? 'queen' : 'plain'];
  // Across, the middle of the pair of eyes; down, as far above the nose as on the fox
  const fromEyes = { cx: boundsOf(eyeSet.nodes.filter((n) => !isHighlight(n))).cx, cy: noseOf(eyeSet.cell).cy };
  const eyesTo = { cx: x, cy: y + 4.1 };
  // The dark eyes vanish on the black cat and the Siamese's mask, so theirs take the iris color (lines take the light ink)
  const eyeColor = eyes === 'open' && P.iris ? P.iris : P.ink;
  return (
    <>
      {blushOf(suit).map((n, i) => (
        <Borrowed
          key={i} cell={BLUSH_CELL[suit]} nodes={[n]} from={boundsOf([n])}
          to={{ cx: x + (i === 0 ? -1 : 1) * BLUSH_X, cy: y + BLUSH_Y }} s={BLUSH_SCALE}
        />
      ))}
      <Borrowed
        cell={eyeSet.cell} nodes={eyeSet.nodes.filter((n) => !isHighlight(n))} from={fromEyes} to={eyesTo} s={EYE_SCALE}
        paint={(c, n) => (c.toLowerCase() !== FOX_INK ? c : almondsOf(eyeSet).includes(n) ? eyeColor : P.ink)}
      />
      {eyes === 'open' && almondsOf(eyeSet).map((n, i) => {
        // Each almond's middle, placed like the eyes, with a thin pointed slit down it
        const c = boundsOf([n]);
        const [cx, cy] = [eyesTo.cx + EYE_SCALE * (c.cx - fromEyes.cx), eyesTo.cy + EYE_SCALE * (c.cy - fromEyes.cy)];
        const h = (SLIT.h * EYE_SCALE) / 2;
        return <path key={i} fill={SLIT.color} d={`M${cx} ${cy - h} Q${cx + SLIT.w * 2} ${cy} ${cx} ${cy + h} Q${cx - SLIT.w * 2} ${cy} ${cx} ${cy - h} Z`} />;
      })}
      <Borrowed cell={eyeSet.cell} nodes={eyeSet.nodes.filter(isHighlight)} from={fromEyes} to={eyesTo} s={EYE_SCALE} />
      <path
        {...stroke(P.line, 0.9)}
        opacity={0.55}
        d={`M${x - W0} ${y + 4.4} L${x - W1} ${y + 3.4} M${x - W0} ${y + 6} L${x - W1} ${y + 6.8} M${x + W0} ${y + 4.4} L${x + W1} ${y + 3.4} M${x + W0} ${y + 6} L${x + W1} ${y + 6.8}`}
      />
      <path fill={P.nose} d={`M${x - 1.6} ${y + 3.2} L${x + 1.6} ${y + 3.2} Q${x + 1.4} ${y + 4.3} ${x} ${y + 5} Q${x - 1.4} ${y + 4.3} ${x - 1.6} ${y + 3.2} Z`} />
      {mustache ? (
        // The owner's mustache; on the black cat in its light line color, or it would vanish into the fur
        <Mustache cx={x} cy={y + 6.4} color={P.iris && !P.point ? P.line : undefined} />
      ) : (
        <path {...stroke(P.line, MOUTH)} d={`M${x - 2.6} ${y + 5.6} Q${x - 1.3} ${y + 7.2} ${x} ${y + 5.4} Q${x + 1.3} ${y + 7.2} ${x + 2.6} ${y + 5.6}`} />
      )}
    </>
  );
}

/** Whiskers start just outside the blush and reach past the cheek. */
const [W0, W1] = [15, 21];
/** The fox's mouth line is this thick. */
const MOUTH = 0.5;
const EYE_SCALE = 1.02;
/** A cat's slit pupil down the middle of each open eye: its height (before EYE_SCALE) and half its width. */
const SLIT = { h: 4.4, w: 0.75, color: '#16141B' };
const BLUSH_SCALE = 0.85;
const BLUSH_X = 12.5;
const BLUSH_Y = 4.4;

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
      <CatFace y={20.5 + dy} eyes={eyes} P={P} suit={suit} queen={hat === 'queen'} mustache={hat === 'king'} />
    </>
  );
}

/** The fox's raised paw (the owner's Waving fox, file 02): the arm, drawn as one thick rounded line, and its pink pads. */
const FOX_WAVE: FoxOwlCellId = 'Waving_fox';
const FOX_ARM = cellOf(FOX_WAVE).nodes.find((n) => n.attrs.strokeWidth === '26')!;
/** The pads are the pink shapes on the paw (the fox's inner ears are the same pink). */
const FOX_PADS = cellOf(FOX_WAVE).nodes.filter((n) => n.attrs.fill === '#d1808b' && boundsOf([n]).cy > FOX_ARM.box[1] - 3);
/** The fox's raised paw as drawn, moved `dx`, `dy`: the arm in `color`, pads the cat's inner pink. */
function RaisedPaw({ P, dx, dy, color }: { P: CatColors; dx: number; dy: number; color: string }) {
  return (
    <Borrowed
      cell={FOX_WAVE} nodes={[FOX_ARM, ...FOX_PADS]} from={{ cx: 0, cy: 0 }} to={{ cx: dx, cy: dy }}
      paint={(c) => (c === '#d1808b' ? P.inner : color)}
    />
  );
}

const Paw = ({ x, y, color }: { x: number; y: number; color: string }) => <ellipse cx={x} cy={y} rx={4.2} ry={2.8} fill={color} />;

const SIT_BODY = 'M32 30 C42 30 47 40 47 50 C47 56 43 59.5 38 59.5 L26 59.5 C21 59.5 17 56 17 50 C17 40 22 30 32 30 Z';

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

/** The skinny cats: sitting up with the tail curled around the side. */
function SittingCat({ suit, eyes = 'happy', hat, wave, badge, badgeColor, bowtie, uid }: CatDrawProps) {
  const P = CAT[suit];
  const edge = P.outline ? { stroke: P.outline, strokeWidth: 1.2 } : {};
  return (
    <>
      <path
        fill="none" stroke={suit === 'diamonds' ? PATCH_ORANGE : P.dark} strokeWidth={6} strokeLinecap="round"
        d="M40 57.5 Q55 58.5 55.5 47 Q55.5 40 50.5 37.5"
      />
      <path fill={P.fur} {...edge} d={SIT_BODY} />
      {suit === 'diamonds' && (
        <>
          <clipPath id={`${uid}-spots`}><path d={SIT_BODY} /></clipPath>
          <g clipPath={`url(#${uid}-spots)`}>
            <circle cx={16} cy={44} r={8} fill={PATCH_ORANGE} />
            <circle cx={47} cy={54} r={7} fill={PATCH_BLACK} />
          </g>
        </>
      )}
      <ellipse cx={32} cy={48} rx={7} ry={9} fill={P.belly} />
      {!wave && <Paw x={27} y={58.6} color={P.belly} />}
      <Paw x={37} y={58.6} color={P.belly} />
      <Head suit={suit} P={P} dy={0} eyes={eyes} hat={hat} badge={!!(badge && badgeColor)} uid={uid} />
      {/* The calico's arm is orange, with no outline, so it blends into the orange patch it rises over */}
      {wave && <RaisedPaw P={P} dx={0.5} dy={0} color={suit === 'diamonds' ? PATCH_ORANGE : P.fur} />}
      {badge && <Badge suit={suit} color={badgeColor} x={28.4} y={9.2} scale={0.3} />}
      <BowTie cx={32} cy={37.4} color={bowtie && suit === 'spades' ? BLACK_CAT_BOWTIE : bowtie} />
      <Crown hat={hat} suit={suit} fit="cat" />
    </>
  );
}

const LOAF_BODY = 'M14 60 C8 60 6.5 54 7.5 48.5 C9.5 40.5 18 36.5 30 36.5 L36 36.5 C50 36.5 57.5 42 57.5 50.5 C57.5 57 54.5 60 49.5 60 Z';

/** The fat cats: a loaf with paws tucked and the tail wrapped along the front; the orange tabby keeps its side stripes. */
function LoafCat({ suit, eyes = 'open', hat, wave, badge, badgeColor, bowtie, uid }: CatDrawProps) {
  const P = CAT[suit];
  const dy = 5;
  const pawColor = P.point ?? P.belly;
  return (
    <>
      <path fill={P.fur} d={LOAF_BODY} />
      {P.point && (
        <>
          <clipPath id={`${uid}-haunch`}><path d={LOAF_BODY} /></clipPath>
          <g clipPath={`url(#${uid}-haunch)`}><ellipse cx={54} cy={54} rx={9} ry={8} fill={P.point} opacity={0.35} /></g>
        </>
      )}
      {suit === 'hearts' && (
        <path fill="none" stroke={P.dark} strokeWidth={1.8} strokeLinecap="round" d="M9.6 47 L14 48.2 M9 52.5 L13.6 53 M54.4 46 L50 47.4 M55 51.5 L50.4 52.2" />
      )}
      <path fill="none" stroke={P.point ?? P.dark} strokeWidth={5} strokeLinecap="round" d="M55 55.5 Q50 60.5 40.5 59.6" />
      {!wave && <Paw x={25} y={59} color={pawColor} />}
      <Paw x={35} y={59} color={pawColor} />
      <Head suit={suit} P={P} dy={dy} eyes={eyes} hat={hat} badge={!!(badge && badgeColor)} uid={uid} />
      {wave && <RaisedPaw P={P} dx={0} dy={dy} color={P.point ?? P.fur} />}
      {badge && <Badge suit={suit} color={badgeColor} x={28.4} y={9.2 + dy} scale={0.3} />}
      <BowTie cx={32} cy={37.4 + dy + 1} color={bowtie} />
      <Crown hat={hat} suit={suit} fit="cat" dy={dy} />
    </>
  );
}

/** The orange tabby and the Siamese lie as fat loaves; the calico and the black cat sit up, skinny. */
export const isLoafCat = (suit: Suit) => suit === 'hearts' || suit === 'clubs';

export function Cat(props: CatDrawProps) {
  return isLoafCat(props.suit) ? <LoafCat {...props} /> : <SittingCat {...props} />;
}

