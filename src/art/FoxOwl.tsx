// Fox and owl characters for the Fox + Owl deck, drawn from the owner's redrawn sheet
// (design/art-export/02-characters-fox-owl.svg, imported into foxOwlArt.ts by `npm run art:fox`). Same viewBox as the
// octopus and manta, so layouts don't change.
//
// The sheet has a cell for every card character and every extra pose the screens use. A character is drawn from the
// cell that fits it (`recipeFor`), as drawn; when other eyes are asked for (happy on a matched Tide Pairs card, sleepy
// when paused), they're borrowed from a cell that has them. The art decides badges and bow tie colors.
import type { Suit } from '../cards/deck';
import type { Eyes, Hat } from './Creature';
import { ASPECT, VIEWBOX } from './Creature';
import { FOX_OWL_CELLS, type FoxOwlCellId, type FoxOwlNode } from './foxOwlArt';

export type FoxOwlKind = 'fox' | 'owl';

export interface FoxOwlProps {
  kind: FoxOwlKind;
  /** Hearts or Diamonds for a fox, Spades or Clubs for an owl. */
  suit: Suit;
  /** Default: as drawn (open, but happy on the Aces). */
  eyes?: Eyes;
  hat?: Hat;
  /** Fox only: the waving pose. */
  wave?: boolean;
  /** The Ace's character (the owner's Aces have no badge; any value picks the Ace drawing). */
  badge?: boolean;
  /** Kept for callers; the owner's art has no badge. */
  badgeColor?: string;
  /** A Jack's bow tie (drawn in the suit's own color; any value picks the Jack drawing). */
  bowtie?: string;
}

/** The eyes each cell was drawn with. */
function naturalEyes(cell: FoxOwlCellId): Eyes {
  if (/^Sleepy/.test(cell)) return 'sleepy';
  if (cell.endsWith('_Ace') || cell === 'Cheering_Queen_fox' || cell === 'Happy_King_owl') return 'happy';
  return 'open';
}

export interface FoxOwlRecipe {
  cell: FoxOwlCellId;
  /** Draw this cell's eyes instead of the cell's own. */
  eyesFrom?: FoxOwlCellId;
}

/** Which drawing a character comes from, and whose eyes it borrows. */
export function recipeFor({ kind, suit, eyes, hat, wave, badge, bowtie }: FoxOwlProps): FoxOwlRecipe {
  let cell: FoxOwlCellId;
  let title: string;
  let sleepy: FoxOwlCellId;
  if (kind === 'fox') {
    title = suit === 'diamonds' ? 'Diamonds' : 'Hearts';
    sleepy = 'Sleepy_fox';
    if (hat === 'queen') cell = title === 'Hearts' && eyes === 'happy' ? 'Cheering_Queen_fox' : `${title}_Queen` as FoxOwlCellId;
    else if (hat === 'king') cell = `${title}_King` as FoxOwlCellId;
    else if (bowtie) cell = `${title}_Jack` as FoxOwlCellId;
    else if (badge) cell = `${title}_Ace` as FoxOwlCellId;
    else if (wave) cell = 'Waving_fox';
    else if (eyes === 'sleepy' && title === 'Hearts') cell = 'Sleepy_fox';
    else if (eyes === 'open' && title === 'Diamonds') cell = 'Diamonds_fox_open_eyes';
    else cell = `${title}_number_cards` as FoxOwlCellId;
  } else {
    title = suit === 'clubs' ? 'Clubs' : 'Spades';
    sleepy = title === 'Clubs' ? 'Sleepy_owl' : 'Sleepy_owl_spades';
    if (hat === 'king') {
      cell = title === 'Spades' && eyes === 'happy' ? 'Happy_King_owl'
        : title === 'Spades' && eyes === 'sleepy' ? 'Sleepy_King_owl' : `${title}_King` as FoxOwlCellId;
    } else if (hat === 'queen') cell = `${title}_Queen` as FoxOwlCellId;
    else if (bowtie) cell = `${title}_Jack` as FoxOwlCellId;
    else if (badge) cell = `${title}_Ace` as FoxOwlCellId;
    else if (eyes === 'sleepy') cell = sleepy;
    else cell = `${title}_number_cards` as FoxOwlCellId;
  }
  const wanted = eyes ?? naturalEyes(cell);
  if (wanted === naturalEyes(cell)) return { cell };
  const donor = wanted === 'sleepy' ? sleepy : `${title}_${wanted === 'happy' ? 'Ace' : 'number_cards'}` as FoxOwlCellId;
  return { cell, eyesFrom: donor };
}

const eyesOf = (cell: FoxOwlCellId) => FOX_OWL_CELLS[cell].nodes.filter((n) => n.part === 'eyes');
/** The middle of a cell's eyes across, in viewBox units. */
function eyesMiddle(cell: FoxOwlCellId): number {
  const boxes = eyesOf(cell).map((n) => n.box);
  return (Math.min(...boxes.map((b) => b[0])) + Math.max(...boxes.map((b) => b[0] + b[2]))) / 2;
}

/** Every shape the recipe draws: the cell's own, then any borrowed eyes moved across onto this face. */
function partsFor(recipe: FoxOwlRecipe): { cell: FoxOwlCellId; nodes: FoxOwlNode[]; dx: number }[] {
  const own = FOX_OWL_CELLS[recipe.cell].nodes.filter((n) => !(recipe.eyesFrom && n.part === 'eyes'));
  if (!recipe.eyesFrom) return [{ cell: recipe.cell, nodes: own, dx: 0 }];
  // The owls don't all sit in the same spot in their frames, so borrowed eyes line up with the eyes they replace
  const dx = Math.round((eyesMiddle(recipe.cell) - eyesMiddle(recipe.eyesFrom)) * 100) / 100;
  return [{ cell: recipe.cell, nodes: own, dx: 0 }, { cell: recipe.eyesFrom, nodes: eyesOf(recipe.eyesFrom), dx }];
}

/** Top and bottom of what a character draws, in viewBox units (for centering it on a card). */
export function foxOwlBounds(props: Pick<FoxOwlProps, 'kind' | 'hat'>): { top: number; bottom: number } {
  const nodes = partsFor(recipeFor({ ...props, suit: props.kind === 'fox' ? 'hearts' : 'spades', eyes: 'open' }))
    .flatMap((p) => p.nodes);
  return {
    top: Math.min(...nodes.map((n) => n.box[1])),
    bottom: Math.max(...nodes.map((n) => n.box[1] + n.box[3])),
  };
}

/** The character drawn in viewBox coordinates, for use inside another SVG. */
export function FoxOwlArt(props: FoxOwlProps) {
  return (
    <g>
      {partsFor(recipeFor(props)).map(({ cell, nodes, dx }, i) => (
        <g key={i} transform={dx ? `translate(${dx} 0) ${FOX_OWL_CELLS[cell].transform}` : FOX_OWL_CELLS[cell].transform}>
          {nodes.map((n, j) => {
            const Tag = n.tag;
            return <Tag key={j} {...n.attrs} />;
          })}
        </g>
      ))}
    </g>
  );
}

/** Places a fox or owl inside another SVG with its top-left at (x, y), `size` wide. */
export function FoxOwlAt({ x, y, size, ...props }: FoxOwlProps & { x: number; y: number; size: number }) {
  return (
    <svg x={x} y={y} width={size} height={size * ASPECT} viewBox={VIEWBOX} overflow="visible">
      <FoxOwlArt {...props} />
    </svg>
  );
}

/** Just the happy Hearts fox's head (ear tips to chin), `width` wide with its top-left at (x, y), for small icons. */
export function FoxHeadAt({ x, y, width }: { x: number; y: number; width: number }) {
  const box = { left: 6, top: -4, w: 52, h: 44 };
  return (
    <svg x={x} y={y} width={width} height={(width * box.h) / box.w} viewBox={`${box.left} ${box.top} ${box.w} ${box.h}`}>
      <FoxOwlArt kind="fox" suit="hearts" />
    </svg>
  );
}

/** A standalone fox or owl, `size` px wide. Decorative unless given a `label`. */
export function FoxOwl({
  size = 64, label, className, style, ...props
}: FoxOwlProps & { size?: number; label?: string; className?: string; style?: React.CSSProperties }) {
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
      <FoxOwlArt {...props} />
    </svg>
  );
}
