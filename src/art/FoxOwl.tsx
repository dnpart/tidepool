// Fox and owl characters for the Fox + Owl deck. Every shape comes from the owner's Illustrator file via the
// generated foxOwlArt.ts; this file only picks a drawing and applies the small changes in PLAN.md's cast table
// (borrowed eyes, suit recolors, suit badges). Same viewBox as the octopus and manta, so layouts don't change.
import type { Suit } from '../cards/deck';
import { shade } from './color';
import type { Eyes, Hat } from './Creature';
import { ASPECT, VIEWBOX } from './Creature';
import { FOX_OWL_CELLS, type ArtNode, type FoxOwlCellId } from './foxOwlArt';
import { SUIT_PATHS } from './Suit';

export type FoxOwlKind = 'fox' | 'owl';

export interface FoxOwlProps {
  kind: FoxOwlKind;
  /** Picks the fox's inner-ear color or the owl's accent color. */
  suit: Suit;
  /** Default: happy for a plain fox, open for everyone else. */
  eyes?: Eyes;
  hat?: Hat;
  /** Fox only: the waving pose. */
  wave?: boolean;
  /** Suit symbol on the fox's forehead or the owl's belly (suit buddies and Aces). Owls drop their speckles. */
  badge?: boolean;
  badgeColor?: string;
  /** Bow tie color (Jacks wear one in their suit symbol color). */
  bowtie?: string;
}

const EAR: Record<'hearts' | 'diamonds', string> = { hearts: '#ee8c9e', diamonds: '#f6b07a' };
const OWL_SPADES = ['#5873a6', '#3e5a92'];
const OWL_CLUBS = ['#3f7a73', '#2f625c'];

// Each drawing was made for one suit; other suits get a recolor
const NATIVE_SUIT: Record<FoxOwlCellId, Suit> = {
  foxHearts: 'hearts', foxDiamonds: 'diamonds', foxWaving: 'diamonds', foxSleepy: 'hearts', foxQueen: 'hearts',
  foxJack: 'hearts', foxKing: 'hearts',
  owlSpades: 'spades', owlClubs: 'clubs', owlSleepy: 'clubs', owlJack: 'clubs', owlKing: 'spades', owlQueen: 'spades',
};

// Bow ties as drawn: [bow, knot]
const NATIVE_BOWTIE: Partial<Record<FoxOwlCellId, [string, string]>> = {
  foxJack: ['#b5294a', '#91213b'],
  owlJack: ['#1d4f4a', '#163b37'],
};

/** Shared eye arcs (PLAN.md), for owl expressions that weren't drawn. */
const EYE_ARCS: Record<'happy' | 'sleepy', string> = {
  happy: 'M23.2 22 Q26 18.8 28.8 22 M35.2 22 Q38 18.8 40.8 22',
  sleepy: 'M23.6 21 Q26 23.4 28.4 21 M35.6 21 Q38 23.4 40.4 21',
};

export interface FoxOwlRecipe {
  cell: FoxOwlCellId;
  /** Replace the drawing's Eyes layer: with another cell's Eyes, or with shared arcs. */
  eyesFrom?: FoxOwlCellId;
  eyeArcs?: 'happy' | 'sleepy';
  drop: string[];
  recolor: Record<string, string>;
}

/** Which drawing to use and how to change it (PLAN.md "Fox + Owl art", cast table). */
export function recipeFor({ kind, suit, eyes, hat, wave, badge, bowtie }: FoxOwlProps): FoxOwlRecipe {
  const drop: string[] = [];
  let cell: FoxOwlCellId;
  let eyesFrom: FoxOwlCellId | undefined;
  let eyeArcs: 'happy' | 'sleepy' | undefined;

  if (kind === 'fox') {
    const own = suit === 'diamonds' ? 'foxDiamonds' : 'foxHearts';
    if (hat === 'king') cell = 'foxKing';
    else if (hat === 'queen') cell = 'foxQueen';
    else if (bowtie) cell = 'foxJack';
    else if (wave) cell = 'foxWaving';
    else cell = (eyes ?? 'happy') === 'sleepy' ? 'foxSleepy' : own;
    const drawn: Eyes = cell === 'foxSleepy' ? 'sleepy' : cell === own ? 'happy' : 'open';
    const want = eyes ?? drawn;
    if (want !== drawn) eyesFrom = want === 'happy' ? 'foxHearts' : want === 'sleepy' ? 'foxSleepy' : 'foxWaving';
  } else {
    if (hat === 'king') cell = 'owlKing';
    else if (hat === 'queen') cell = 'owlQueen';
    else if (bowtie) cell = 'owlJack';
    else if (eyes === 'sleepy' && !badge) cell = 'owlSleepy';
    else cell = suit === 'clubs' ? 'owlClubs' : 'owlSpades';
    const drawn: Eyes = cell === 'owlSleepy' ? 'sleepy' : 'open';
    const want = eyes ?? (badge ? 'happy' : drawn);
    if (want !== drawn && want !== 'open') eyeArcs = want;
    if (badge) drop.push('Chest_speckles', 'Wing_marks');
  }

  const recolor: Record<string, string> = {};
  const native = NATIVE_SUIT[cell];
  if (kind === 'fox' && native !== suit) {
    const target = suit === 'diamonds' ? 'diamonds' : 'hearts';
    recolor[EAR[native as 'hearts' | 'diamonds']] = EAR[target];
  }
  if (kind === 'owl' && native !== suit) {
    const [from, to] = native === 'spades' ? [OWL_SPADES, OWL_CLUBS] : [OWL_CLUBS, OWL_SPADES];
    from.forEach((c, i) => (recolor[c] = to[i]));
  }
  const tie = NATIVE_BOWTIE[cell];
  if (tie && bowtie) {
    recolor[tie[0]] = bowtie;
    recolor[tie[1]] = shade(bowtie, 0.8);
  }
  return { cell, eyesFrom, eyeArcs, drop, recolor };
}

function paint(attrs: Record<string, string>, recolor: Record<string, string>) {
  const out = { ...attrs };
  for (const key of ['fill', 'stroke'] as const) {
    const v = out[key]?.toLowerCase();
    if (v && recolor[v]) out[key] = recolor[v];
  }
  return out;
}

function Node({ node, recipe }: { node: ArtNode; recipe: FoxOwlRecipe }) {
  if (node.name && recipe.drop.includes(node.name)) return null;
  if (node.name === 'Eyes' && (recipe.eyesFrom || recipe.eyeArcs)) {
    const [ox, oy] = FOX_OWL_CELLS[recipe.cell].origin;
    if (recipe.eyeArcs) {
      // Back from Illustrator coordinates into the viewBox, where the shared arcs are drawn
      return (
        <g transform={`matrix(6 0 0 6 ${ox} ${oy})`}>
          <path d={EYE_ARCS[recipe.eyeArcs]} fill="none" stroke="#3E4A5A" strokeWidth={1.6} strokeLinecap="round" />
        </g>
      );
    }
    const source = FOX_OWL_CELLS[recipe.eyesFrom!];
    const eyes = findLayer(source.layers, 'Eyes');
    if (!eyes) return null;
    const [sx, sy] = source.origin;
    return (
      <g transform={`translate(${ox - sx} ${oy - sy})`}>
        <Node node={eyes} recipe={{ ...recipe, eyesFrom: undefined }} />
      </g>
    );
  }
  const Tag = node.tag;
  const props = paint(node.attrs, recipe.recolor);
  if (!node.children) return <Tag {...props} />;
  return (
    <Tag {...props}>
      {node.children.map((child, i) => <Node key={i} node={child} recipe={recipe} />)}
    </Tag>
  );
}

export function findLayer(nodes: ArtNode[], name: string): ArtNode | undefined {
  for (const n of nodes) {
    if (n.name === name) return n;
    const inner = n.children && findLayer(n.children, name);
    if (inner) return inner;
  }
  return undefined;
}

/** The character drawn in viewBox coordinates, for use inside another SVG. */
export function FoxOwlArt(props: FoxOwlProps) {
  const recipe = recipeFor(props);
  const cell = FOX_OWL_CELLS[recipe.cell];
  const badgeTransform = props.kind === 'fox' ? 'translate(28.4 11) scale(0.3)' : 'translate(29 37) scale(0.25)';
  return (
    <g>
      <g transform={cell.transform}>
        {cell.layers.map((layer, i) => <Node key={i} node={layer} recipe={recipe} />)}
      </g>
      {props.badge && <path d={SUIT_PATHS[props.suit]} fill={props.badgeColor} transform={badgeTransform} />}
    </g>
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
