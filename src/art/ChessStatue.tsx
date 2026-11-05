// Chess pieces as little statues of each deck's characters (Nov 5, the owner asked; a first version for the owner to
// redraw in Illustrator, design/art-export/11-chess-pieces.svg). Each piece is the side's character carved in one
// color, cream for you and ink for the other side, on the classic piece's base: the pawn small and bare-headed, the rook
// behind a little tower, the knight in a plumed helmet, the bishop in a mitre, the queen and king in the owner's crowns.
//
// The character is the app's own drawing, turned to stone: every color becomes the side's tone at the same lightness,
// and an outline copy sits behind it.
import { renderToStaticMarkup } from 'react-dom/server';
import type { Suit } from '../cards/deck';
import type { DeckId } from '../decks/decks';
import { CreatureArt, creatureBounds, type Hat } from './Creature';
import { FoxOwlArt, foxOwlBounds } from './FoxOwl';
import { GardenArt } from './Garden';

export type ChessRole = 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';
export type ChessSide = 'light' | 'dark';
export const CHESS_ROLES: readonly ChessRole[] = ['pawn', 'rook', 'knight', 'bishop', 'queen', 'king'];

type Species = 'octopus' | 'manta' | 'fox' | 'owl' | 'sloth' | 'bee' | 'mushroom' | 'moth' | 'catLight' | 'catDark';

/** Who plays each side: the deck's two teams, cream for you and ink for the other side. */
export const CHESS_CAST: Record<DeckId, Record<ChessSide, Species>> = {
  sea: { light: 'octopus', dark: 'manta' },
  arctic: { light: 'fox', dark: 'owl' },
  honey: { light: 'sloth', dark: 'bee' },
  woodland: { light: 'mushroom', dark: 'moth' },
  cats: { light: 'catLight', dark: 'catDark' },
};

export const SPECIES_NAME: Record<Species, string> = {
  octopus: 'Octopus', manta: 'Manta', fox: 'Fox', owl: 'Owl', sloth: 'Sloth', bee: 'Bee', mushroom: 'Toadstool',
  moth: 'Moth', catLight: 'Calico', catDark: 'Black cat',
};

/** Where each character's King's crown sits in its viewBox (0 -8 64 68): left, top, right, bottom, measured. */
const CROWN: Record<Species, [number, number, number, number]> = {
  octopus: [21.3, -6.6, 42.5, 9.4], manta: [20.4, -4, 43.6, 13.4], fox: [20.7, -8.1, 42, 7.9], owl: [21.8, -7.7, 45, 9.7],
  sloth: [21, -6.5, 43, 6.5], bee: [21, 0.5, 43, 13.5], mushroom: [21, -8, 43, 5], moth: [21, -2.8, 43, 10.2],
  catLight: [21, -6.5, 43, 6.5], catDark: [21, -6.5, 43, 6.5],
};

/** The lowest point of each character, in its viewBox. */
function bottomOf(s: Species): number {
  if (s === 'octopus' || s === 'manta') return creatureBounds({ kind: s }).bottom;
  if (s === 'fox' || s === 'owl') return foxOwlBounds({ kind: s }).bottom;
  return { sloth: 60.2, bee: 59, mushroom: 58, moth: 59.5, catLight: 61.4, catDark: 61.4 }[s];
}

/** The owner's drawings are in Illustrator units, four to a viewBox unit; the others are in viewBox units. */
const ART_UNITS: Record<Species, number> = {
  octopus: 4, manta: 4, fox: 4, owl: 4, sloth: 1, bee: 1, mushroom: 1, moth: 1, catLight: 1, catDark: 1,
};

function Character({ s, hat }: { s: Species; hat?: Hat }) {
  switch (s) {
    case 'octopus': return <CreatureArt kind="octopus" color="#EE8C9E" eyes="happy" hat={hat} />;
    case 'manta': return <CreatureArt kind="manta" color="#7A9EB0" eyes="open" hat={hat} />;
    case 'fox': return <FoxOwlArt kind="fox" suit="hearts" eyes="happy" hat={hat} />;
    case 'owl': return <FoxOwlArt kind="owl" suit="spades" hat={hat} />;
    case 'mushroom': return <GardenArt kind="mushroom" suit="hearts" hat={hat} grass={false} />;
    default: {
      const kind = s === 'catLight' || s === 'catDark' ? 'cat' : s;
      const suit: Suit = s === 'catLight' ? 'diamonds' : s === 'catDark' || s === 'bee' ? 'spades' : s === 'moth' ? 'clubs' : 'hearts';
      return <GardenArt kind={kind} suit={suit} hat={hat} />;
    }
  }
}

// --- turning a drawing to stone ---

export interface StatueTone {
  /** The lightest tone (white in the drawing), the darkest (black), and the outline. */
  hi: string;
  lo: string;
  edge: string;
}

export const STATUE_TONES: Record<ChessSide, StatueTone> = {
  light: { hi: '#FCF7EC', lo: '#5A5041', edge: '#7D705A' },
  dark: { hi: '#6A7B87', lo: '#0E161C', edge: '#0A1116' },
};

const rgb = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '');
  const f = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return [0, 2, 4].map((i) => parseInt(f.slice(i, i + 2), 16)) as [number, number, number];
};
const toHex = (c: number[]) => `#${c.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')}`;
const mix = (a: string, b: string, t: number) => {
  const [x, y] = [rgb(a), rgb(b)];
  return toHex(x.map((v, i) => y[i] + (v - y[i]) * t));
};

/** How light a color looks, 0 to 1 (CIE L*). */
function lightness(hex: string): number {
  const lin = rgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const y = 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
  const l = y > 0.008856 ? 116 * Math.cbrt(y) - 16 : 903.3 * y;
  return l / 100;
}

/** A drawing's color in stone: the side's tone at the same lightness, lifted so bodies read as the side's color. */
export const stoneColor = (color: string, tone: StatueTone): string => mix(tone.hi, tone.lo, Math.min(1, lightness(color) ** 0.8));

const NAMED: Record<string, string> = { white: '#ffffff', black: '#000000' };
const SHAPE = /<(path|circle|ellipse|rect|polygon|polyline|line)\b([^>]*?)(\/?)>/g;

/** The drawing's markup with every color turned to stone. */
function toned(markup: string, tone: StatueTone): string {
  return markup.replace(/(fill|stroke|stop-color)="(#[0-9a-fA-F]{3,6}|white|black)"/g, (_, attr, value) =>
    `${attr}="${stoneColor(NAMED[value] ?? value, tone)}"`);
}

/** The drawing's markup as one solid outline color, stroked `width` (in its own units) all round. */
function outline(markup: string, color: string, width: number): string {
  return markup.replace(SHAPE, (_, tag, attrs: string, close) => {
    const kept = attrs.replace(/\s(fill|stroke|stroke-width|stroke-linejoin|stroke-linecap|opacity|fill-opacity|stroke-opacity)="[^"]*"/g, '');
    const fill = /\sfill="none"/.test(attrs) ? 'none' : color;
    return `<${tag}${kept} fill="${fill}" stroke="${color}" stroke-width="${width}" stroke-linejoin="round" stroke-linecap="round"${close}>`;
  });
}

/** Gives every id in a piece of markup a suffix, so copies on one page don't share clip paths. */
function uniqueIds(markup: string, suffix: string): string {
  return markup.replace(/id="([^"]+)"/g, `id="$1${suffix}"`).replace(/url\(#([^)]+)\)/g, `url(#$1${suffix})`);
}

// --- headgear, drawn in the character's viewBox over where its crown would sit ---

function Mitre({ crown, fill, line }: { crown: number[]; fill: string; line: string }) {
  const [l, , r, b] = crown;
  const cx = (l + r) / 2;
  const w = (r - l) * 1.05;
  const top = b - 30;
  return (
    <g>
      <path d={`M${cx - w / 2} ${b} C${cx - w / 2} ${b - 9} ${cx - w / 4} ${top + 5} ${cx} ${top} C${cx + w / 4} ${top + 5} ${cx + w / 2} ${b - 9} ${cx + w / 2} ${b} Z`}
        fill={fill} stroke={line} strokeWidth={1.6} strokeLinejoin="round" />
      <path d={`M${cx + 1.5} ${top + 8} L${cx - 4.5} ${top + 17}`} fill="none" stroke={line} strokeWidth={2} strokeLinecap="round" />
      <path d={`M${cx - w / 2 + 0.8} ${b - 4} H${cx + w / 2 - 0.8}`} fill="none" stroke={line} strokeWidth={1.6} />
      <circle cx={cx} cy={top - 2} r={2.6} fill={fill} stroke={line} strokeWidth={1.4} />
    </g>
  );
}

/** A little cross over the King's crown, so the King stands apart from the Queen at a glance. */
function Cross({ crown, fill, line }: { crown: number[]; fill: string; line: string }) {
  const [l, t, r] = crown;
  const cx = (l + r) / 2;
  return (
    <path d={`M${cx - 1.8} ${t - 1} V${t - 5} H${cx - 5} V${t - 8.6} H${cx - 1.8} V${t - 12} H${cx + 1.8} V${t - 8.6} H${cx + 5} V${t - 5} H${cx + 1.8} V${t - 1} Z`}
      fill={fill} stroke={line} strokeWidth={1.4} strokeLinejoin="round" />
  );
}

function Helmet({ crown, fill, line }: { crown: number[]; fill: string; line: string }) {
  const [l, , r, b] = crown;
  const cx = (l + r) / 2;
  const w = (r - l) * 1.1;
  const top = b - 17;
  return (
    <g>
      {/* the plume, sweeping back over the helmet */}
      <path d={`M${cx - 2} ${top + 2} C${cx - 3} ${top - 11} ${cx + 12} ${top - 15} ${cx + 21} ${top - 5} C${cx + 14} ${top - 8} ${cx + 6} ${top - 5} ${cx + 4} ${top + 3} Z`}
        fill={fill} stroke={line} strokeWidth={1.6} strokeLinejoin="round" />
      <path d={`M${cx - w / 2} ${b} C${cx - w / 2} ${top + 2} ${cx + w / 2} ${top + 2} ${cx + w / 2} ${b} Z`}
        fill={fill} stroke={line} strokeWidth={1.6} strokeLinejoin="round" />
      <path d={`M${cx - w / 2 + 1.2} ${b - 4.2} H${cx + w / 2 - 1.2}`} fill="none" stroke={line} strokeWidth={1.6} />
      <path d={`M${cx} ${top + 4.5} V${b - 4.2}`} fill="none" stroke={line} strokeWidth={1.4} />
    </g>
  );
}

// --- the bases, in the piece's own 40 × 40 box ---

/** A classic foot: a flared base with a collar, `w` wide, standing on y = 37. */
function Foot({ w, collar, fill, line }: { w: number; collar: number; fill: string; line: string }) {
  return (
    <g>
      <path d={`M${20 - w / 2} 37 L${20 - w / 2 + 1.6} 33.4 H${20 + w / 2 - 1.6} L${20 + w / 2} 37 Z`} fill={fill} stroke={line} strokeWidth={1.1} strokeLinejoin="round" />
      <rect x={20 - collar / 2} y={31.6} width={collar} height={2.2} rx={1.1} fill={fill} stroke={line} strokeWidth={1.1} />
    </g>
  );
}

/** The rook's tower: battlements on top, a little door, standing on y = 37. */
function Tower({ fill, line }: { fill: string; line: string }) {
  return (
    <g>
      <path d="M11 37 L12.3 33.6 H13.5 V24 H11.6 V19.6 H14.8 V21.8 H17.6 V19.6 H22.4 V21.8 H25.2 V19.6 H28.4 V24 H26.5 V33.6 H27.7 L29 37 Z"
        fill={fill} stroke={line} strokeWidth={1.1} strokeLinejoin="round" />
      <path d="M13.5 24 H26.5 M13.5 33.6 H26.5" fill="none" stroke={line} strokeWidth={0.9} />
      <path d="M18.2 33.6 V30.4 A1.8 1.8 0 0 1 21.8 30.4 V33.6" fill="none" stroke={line} strokeWidth={0.9} />
    </g>
  );
}

/** How big the character is and where its lowest point sits, per piece; tall pieces stand on taller bases. */
const POSE: Record<ChessRole, { w: number; bottom: number; foot: number; collar: number }> = {
  pawn: { w: 21, bottom: 32.4, foot: 17, collar: 12 },
  rook: { w: 21, bottom: 27, foot: 0, collar: 0 },
  knight: { w: 23, bottom: 32.4, foot: 21, collar: 15 },
  bishop: { w: 23, bottom: 32.4, foot: 21, collar: 15 },
  queen: { w: 25, bottom: 32.4, foot: 23, collar: 17 },
  king: { w: 26, bottom: 32.4, foot: 24, collar: 18 },
};

let instance = 0;
const r2 = (n: number, places = 2) => Math.round(n * 10 ** places) / 10 ** places;

/** A chess piece, drawn in the box 0 0 40 40, for use inside another svg. */
export function ChessStatueArt({ deck, side, role }: { deck: DeckId; side: ChessSide; role: ChessRole }) {
  const s = CHESS_CAST[deck][side];
  const tone = STATUE_TONES[side];
  const pose = POSE[role];
  const hat: Hat | undefined = role === 'king' ? 'king' : role === 'queen' ? 'queen' : undefined;
  const stone = stoneColor('#E8E8E8', tone);
  const gear = role === 'bishop' ? <Mitre crown={CROWN[s]} fill={stone} line={tone.edge} />
    : role === 'knight' ? <Helmet crown={CROWN[s]} fill={stone} line={tone.edge} />
      : role === 'king' ? <Cross crown={CROWN[s]} fill={stone} line={tone.edge} /> : null;
  const drawing = renderToStaticMarkup(<g><Character s={s} hat={hat} /></g>);
  const suffix = `-cs${instance++}`;
  const art = uniqueIds(toned(drawing, tone), `${suffix}a`);
  const halo = uniqueIds(outline(drawing, tone.edge, 2.4 * ART_UNITS[s]), `${suffix}b`);
  const scale = pose.w / 64;
  const height = 68 * scale;
  const y = pose.bottom - ((bottomOf(s) + 8) / 68) * height;
  return (
    <g>
      {role !== 'rook' && <Foot w={pose.foot} collar={pose.collar} fill={stone} line={tone.edge} />}
      {/* The character's viewBox (0 -8 64 68) placed by a plain transform, not a nested svg, so nothing is clipped */}
      <g transform={`translate(${r2(20 - pose.w / 2)} ${r2(y + 8 * scale)}) scale(${r2(scale, 4)})`}>
        <g dangerouslySetInnerHTML={{ __html: halo }} />
        <g dangerouslySetInnerHTML={{ __html: art }} />
        {gear}
      </g>
      {role === 'rook' && <Tower fill={stone} line={tone.edge} />}
    </g>
  );
}

/** A standalone chess piece, `size` px square. Decorative unless given a `label`. */
export function ChessStatue({ size = 40, label, ...props }: { deck: DeckId; side: ChessSide; role: ChessRole; size?: number; label?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" overflow="visible" role={label ? 'img' : undefined}
      aria-label={label} aria-hidden={label ? undefined : true}>
      <ChessStatueArt {...props} />
    </svg>
  );
}
