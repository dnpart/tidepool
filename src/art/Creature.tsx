// Octopus and manta characters, drawn from the owner's Illustrator file (design/art-export/01-characters-octo-manta.svg, imported into
// octoMantaArt.ts by `npm run art:octo`). Everything shares the viewBox 0 -8 64 68 so hats and faces line up across
// both species and the other decks.
//
// The file has a cell for every card character and the extra poses. A character is drawn from the cell that fits it
// best (`recipeFor`): its suit comes from the color asked for (a pose drawn in the other suit is recolored and takes
// that suit's cheeks), other eyes are borrowed from a cell that has them, and the waving octopus borrows its crown from
// the Queen or King. Cells keep their shapes exactly as drawn.
import type { Suit } from '../cards/deck';
import { OCTO_MANTA_CELLS, OCTO_MANTA_RECOLOR, type OctoMantaCellId, type OctoMantaNode } from './octoMantaArt';

export type CreatureKind = 'octopus' | 'manta';
export type Eyes = 'happy' | 'open' | 'sleepy';
export type Hat = 'king' | 'queen';

export interface CreatureProps {
  kind: CreatureKind;
  /** The body color; picks the nearest suit the owner drew (pink or peach octopus, blue or teal manta). */
  color: string;
  eyes?: Eyes;
  hat?: Hat;
  /** Octopus only: raise the right tentacle. */
  wave?: boolean;
  /** The Ace's character (the owner's Aces have no badge; any suit given picks the Ace drawing). */
  badge?: Suit;
  /** Kept for callers; the owner's art has no badge. */
  badgeColor?: string;
  /** Kept for callers; each crown has its suit's jewel as drawn. */
  jewel?: string;
  /** A Jack's bow tie (drawn in the suit's own color in the art; any value picks the Jack drawing). */
  bowtie?: string;
}

export const VIEWBOX = '0 -8 64 68';
export const ASPECT = 68 / 64;

type Team = 'hearts' | 'diamonds' | 'spades' | 'clubs';
const SUIT_TITLE: Record<Team, string> = { hearts: 'Hearts', diamonds: 'Diamonds', spades: 'Spades', clubs: 'Clubs' };

/** The body color each suit was drawn in. */
const BODY: Record<CreatureKind, [Team, string][]> = {
  octopus: [['hearts', '#ee8c9e'], ['diamonds', '#f6b07a']],
  manta: [['spades', '#7a9eb0'], ['clubs', '#6fafa3']],
};

/** The suit each extra pose was drawn in. */
const POSE_SUIT: Partial<Record<OctoMantaCellId, Team>> = {
  Waving: 'diamonds', Sleepy: 'hearts', Manta: 'spades', Sleepy_manta: 'clubs',
};

const rgb = (hex: string) => {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
};

/** The suit whose body color is closest to `color`. */
function suitFor(kind: CreatureKind, color: string): Team {
  const [r, g, b] = rgb(color);
  let best = BODY[kind][0];
  let bestD = Infinity;
  for (const entry of BODY[kind]) {
    const [r2, g2, b2] = rgb(entry[1]);
    const d = (r - r2) ** 2 + (g - g2) ** 2 + (b - b2) ** 2;
    if (d < bestD) [best, bestD] = [entry, d];
  }
  return best[0];
}

const cellSuit = (cell: OctoMantaCellId): Team =>
  POSE_SUIT[cell] ?? (cell.split('_')[0].toLowerCase() as Team);

/** Colors to change so a cell drawn in one suit shows another (Hearts ↔ Diamonds, Spades ↔ Clubs). */
function recolorFor(kind: CreatureKind, from: Team, to: Team): Record<string, string> {
  if (from === to) return {};
  const map = OCTO_MANTA_RECOLOR[kind] as Record<string, string>;
  const forward = from === 'hearts' || from === 'spades';
  return forward ? map : Object.fromEntries(Object.entries(map).map(([a, b]) => [b, a]));
}

/** The eyes each cell was drawn with. */
function naturalEyes(kind: CreatureKind, cell: OctoMantaCellId): Eyes {
  if (cell === 'Sleepy' || cell === 'Sleepy_manta') return 'sleepy';
  if (cell.endsWith('_Ace')) return 'happy';
  if (cell.endsWith('_number_cards')) return kind === 'octopus' ? 'happy' : 'open';
  return 'open';
}

export interface CreatureRecipe {
  cell: OctoMantaCellId;
  recolor: Record<string, string>;
  /** Draw these eyes instead of the cell's own. */
  eyesFrom?: { cell: OctoMantaCellId; recolor: Record<string, string> };
  /** Draw this cell's crown on top (the waving octopus as Queen or King). */
  crownFrom?: OctoMantaCellId;
  /** Draw this cell's cheeks instead (they're shaped like the suit, so a recolored pose takes its suit's). */
  cheeksFrom?: OctoMantaCellId;
}

/** Which drawing a character comes from, and what it borrows. */
export function recipeFor({ kind, color, eyes, hat, wave, badge, bowtie }: CreatureProps): CreatureRecipe {
  const suit = suitFor(kind, color);
  const title = SUIT_TITLE[suit];
  let cell: OctoMantaCellId;
  let crownFrom: OctoMantaCellId | undefined;
  if (kind === 'octopus' && wave) {
    cell = 'Waving';
    if (hat) crownFrom = `${title}_${hat === 'queen' ? 'Queen' : 'King'}` as OctoMantaCellId;
  } else if (hat) cell = `${title}_${hat === 'queen' ? 'Queen' : 'King'}` as OctoMantaCellId;
  else if (bowtie) cell = `${title}_Jack` as OctoMantaCellId;
  else if (badge) cell = `${title}_Ace` as OctoMantaCellId;
  else if (eyes === 'sleepy') cell = kind === 'octopus' ? 'Sleepy' : 'Sleepy_manta';
  else cell = `${title}_number_cards` as OctoMantaCellId;

  const recipe: CreatureRecipe = { cell, recolor: recolorFor(kind, cellSuit(cell), suit), crownFrom };
  if (cellSuit(cell) !== suit) recipe.cheeksFrom = `${title}_number_cards` as OctoMantaCellId;
  const wanted = eyes ?? naturalEyes(kind, cell);
  if (wanted !== naturalEyes(kind, cell)) {
    const donor: OctoMantaCellId =
      wanted === 'sleepy' ? (kind === 'octopus' ? 'Sleepy' : 'Sleepy_manta')
        : wanted === 'happy' ? (`${title}_${kind === 'octopus' ? 'number_cards' : 'Ace'}` as OctoMantaCellId)
          : (`${title}_${kind === 'octopus' ? 'Jack' : 'number_cards'}` as OctoMantaCellId);
    recipe.eyesFrom = { cell: donor, recolor: recolorFor(kind, cellSuit(donor), suit) };
  }
  return recipe;
}

/** Every shape the recipe draws, each with the cell it comes from (whose transform places it). */
function shapesFor(recipe: CreatureRecipe): { node: OctoMantaNode; cell: OctoMantaCellId; recolor: Record<string, string> }[] {
  const own = OCTO_MANTA_CELLS[recipe.cell].nodes
    .filter((n) => !(recipe.eyesFrom && n.part === 'eyes') && !(recipe.cheeksFrom && n.part === 'cheeks'))
    .map((node) => ({ node, cell: recipe.cell, recolor: recipe.recolor }));
  const cheeks = recipe.cheeksFrom
    ? OCTO_MANTA_CELLS[recipe.cheeksFrom].nodes.filter((n) => n.part === 'cheeks')
      .map((node) => ({ node, cell: recipe.cheeksFrom!, recolor: {} }))
    : [];
  const borrowed = recipe.eyesFrom
    ? OCTO_MANTA_CELLS[recipe.eyesFrom.cell].nodes.filter((n) => n.part === 'eyes')
      .map((node) => ({ node, cell: recipe.eyesFrom!.cell, recolor: recipe.eyesFrom!.recolor }))
    : [];
  const crown = recipe.crownFrom
    ? OCTO_MANTA_CELLS[recipe.crownFrom].nodes.filter((n) => n.part === 'crown')
      .map((node) => ({ node, cell: recipe.crownFrom!, recolor: {} }))
    : [];
  return [...own, ...cheeks, ...borrowed, ...crown];
}

/** Top and bottom of what a character draws, in viewBox units (for centering it on a card). */
export function creatureBounds(props: Pick<CreatureProps, 'kind' | 'hat' | 'wave' | 'bowtie' | 'badge' | 'eyes'>): { top: number; bottom: number } {
  const shapes = shapesFor(recipeFor({ ...props, color: BODY[props.kind][0][1] }));
  return {
    top: Math.min(...shapes.map((s) => s.node.box[1])),
    bottom: Math.max(...shapes.map((s) => s.node.box[1] + s.node.box[3])),
  };
}

function Shape({ node, recolor }: { node: OctoMantaNode; recolor: Record<string, string> }) {
  const props: Record<string, string> = { ...node.attrs };
  if (props.fill && recolor[props.fill]) props.fill = recolor[props.fill];
  if (props.stroke && recolor[props.stroke]) props.stroke = recolor[props.stroke];
  const Tag = node.tag;
  return <Tag {...props} />;
}

/** The creature drawn in viewBox coordinates, for use inside another SVG. */
export function CreatureArt(props: CreatureProps) {
  const shapes = shapesFor(recipeFor(props));
  // Consecutive shapes from the same cell share one group with that cell's transform
  const runs: { cell: OctoMantaCellId; items: typeof shapes }[] = [];
  for (const s of shapes) {
    const last = runs[runs.length - 1];
    if (last && last.cell === s.cell) last.items.push(s);
    else runs.push({ cell: s.cell, items: [s] });
  }
  return (
    <g>
      {runs.map((run, i) => (
        <g key={i} transform={OCTO_MANTA_CELLS[run.cell].transform}>
          {run.items.map((s, j) => <Shape key={j} node={s.node} recolor={s.recolor} />)}
        </g>
      ))}
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
