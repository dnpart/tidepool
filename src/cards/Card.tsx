// Card faces drawn on a 140×196 reference card (PLAN.md "Card deck") and scaled by `width`.
import { useId } from 'react';
import { CreatureAt, type CreatureProps, type Eyes, type Hat } from '../art/Creature';
import { FoxOwlAt, type FoxOwlProps } from '../art/FoxOwl';
import { isLoafCat } from '../art/Cat';
import { GardenAt, type GardenKind, type GardenProps } from '../art/Garden';
import { SuitPath } from '../art/Suit';
import { DECKS, GARDEN_CAST, isGardenDeck, type DeckId } from '../decks/decks';
import { useDeck } from '../decks/useDeck';
import { cardName, rankLabel, teamOf, type Card as CardData, type Rank, type Suit } from './deck';
import styles from './Card.module.css';

export const REF_W = 140;
export const REF_H = 196;
/** Below this width cards switch to the compact play layout. */
export const PIP_MIN_WIDTH = 80;

/**
 * Rank text color: red suits use slightly darker text than their symbols so it reads at 4.5:1 (7:1 in high contrast).
 * Face cards on a dark tint use the deck's light face card ink instead.
 */
const rankColor = (deck: DeckId, suit: Suit, rank: Rank) => {
  const { faceInk, symbol } = DECKS[deck].suits[suit];
  return rank >= 11 && faceInk ? faceInk : `var(--rank-${deck}-${suit}, ${symbol})`;
};
/** Suit symbol color in the corners and under a face card's character. */
const suitColor = (deck: DeckId, suit: Suit, rank: Rank) => {
  const { faceInk, symbol } = DECKS[deck].suits[suit];
  return rank >= 11 && faceInk ? faceInk : symbol;
};

// Approximate Fredoka 600 advance widths (em), to place the suit beside or under the rank
const RANK_EM: Record<string, number> = { A: 0.66, J: 0.5, Q: 0.7, K: 0.64, '10': 1.0 };
const rankWidthEm = (label: string) => RANK_EM[label] ?? 0.58;

type Kind = CreatureProps['kind'] | 'fox' | 'owl' | GardenKind;

/** Vertical extent of a creature's drawing in viewBox units (measured from the art), so it can be centered visually. */
export function contentBounds(kind: Kind, hat?: Hat, suit?: Suit): { top: number; bottom: number } {
  if (kind === 'octopus') return { top: hat ? -7 : 4, bottom: 58 };
  if (kind === 'manta') return { top: hat ? 0 : 12, bottom: 59 };
  if (kind === 'fox') return { top: hat === 'king' ? -3.5 : -3, bottom: 62.7 };
  if (kind === 'sloth') return { top: hat === 'king' ? -6.5 : hat === 'queen' ? -4 : 1.4, bottom: 60.2 };
  if (kind === 'bee') return { top: hat ? 0.5 : 0, bottom: 59 };
  if (kind === 'mushroom') return { top: hat === 'king' ? -8 : hat === 'queen' ? -5.5 : 3, bottom: 60 };
  if (kind === 'moth') return { top: hat === 'king' ? -2.8 : hat === 'queen' ? -0.6 : 1, bottom: 59.5 };
  if (kind === 'cat') {
    // Loaf cats sit 5 units lower than the sitting ones
    const dy = suit && isLoafCat(suit) ? 5 : 0;
    return { top: (hat === 'king' ? -6.5 : hat === 'queen' ? -4 : 1.5) + dy, bottom: dy ? 61.8 : 61.4 };
  }
  return { top: hat === 'king' ? -8 : hat === 'queen' ? -6.7 : -2.2, bottom: 60.5 };
}

/** Top y that centers a creature of `size` width on `centerY`, in card units. */
function centeredTop(kind: Kind, hat: Hat | undefined, size: number, centerY: number, suit?: Suit) {
  const { top, bottom } = contentBounds(kind, hat, suit);
  const s = size / 64;
  return centerY - ((top + bottom) / 2 + 8) * s;
}

const HAT_FOR: Partial<Record<Rank, Hat>> = { 12: 'queen', 13: 'king' };

/** The card's character: an octopus or manta, a fox or owl, or a sloth, bee, toadstool or moth. */
type Character =
  | { deck: 'sea'; props: CreatureProps }
  | { deck: 'arctic'; props: FoxOwlProps }
  | { deck: 'garden'; props: GardenProps };

function characterFor(deck: DeckId, suit: Suit, rank: Rank, eyes?: Eyes): Character {
  const colors = DECKS[deck].suits[suit];
  const hat = HAT_FOR[rank];
  if (isGardenDeck(deck)) {
    const cast = GARDEN_CAST[deck];
    const props: GardenProps = { kind: teamOf(suit) === 'octopus' ? cast.red : cast.black, suit };
    if (rank === 1) Object.assign(props, { eyes: 'happy', badge: true, badgeColor: colors.symbol });
    if (rank === 11) Object.assign(props, { eyes: 'open', bowtie: colors.symbol });
    if (hat) Object.assign(props, { eyes: 'open', hat });
    return { deck: 'garden', props: eyes ? { ...props, eyes } : props };
  }
  if (deck === 'arctic') {
    const props: FoxOwlProps = { kind: teamOf(suit) === 'octopus' ? 'fox' : 'owl', suit };
    if (rank === 1) Object.assign(props, { badge: true, badgeColor: colors.symbol });
    if (rank === 11) Object.assign(props, { eyes: 'open', bowtie: colors.symbol });
    if (hat) Object.assign(props, { eyes: 'open', hat });
    return { deck, props: eyes ? { ...props, eyes } : props };
  }
  const props: CreatureProps = { kind: teamOf(suit), color: colors.creature };
  if (rank === 1) Object.assign(props, { eyes: 'happy', badge: suit, badgeColor: colors.symbol });
  if (rank === 11) Object.assign(props, { eyes: 'open', bowtie: colors.symbol });
  if (hat) Object.assign(props, { eyes: 'open', hat });
  return { deck, props: eyes ? { ...props, eyes } : props };
}

function CharacterAt({ character, x, y, size }: { character: Character; x: number; y: number; size: number }) {
  if (character.deck === 'garden') return <GardenAt {...character.props} x={x} y={y} size={size} />;
  return character.deck === 'arctic'
    ? <FoxOwlAt {...character.props} x={x} y={y} size={size} />
    : <CreatureAt {...character.props} x={x} y={y} size={size} />;
}

// Pip centers as [column, row] with columns 0..2 and rows 0..1 down the pip area
const PIPS: Record<number, [number, number][]> = {
  2: [[1, 0], [1, 1]],
  3: [[1, 0], [1, 0.5], [1, 1]],
  4: [[0, 0], [2, 0], [0, 1], [2, 1]],
  5: [[0, 0], [2, 0], [1, 0.5], [0, 1], [2, 1]],
  6: [[0, 0], [2, 0], [0, 0.5], [2, 0.5], [0, 1], [2, 1]],
  7: [[0, 0], [2, 0], [1, 0.25], [0, 0.5], [2, 0.5], [0, 1], [2, 1]],
  8: [[0, 0], [2, 0], [1, 0.25], [0, 0.5], [2, 0.5], [1, 0.75], [0, 1], [2, 1]],
  9: [[0, 0], [2, 0], [0, 1 / 3], [2, 1 / 3], [1, 0.5], [0, 2 / 3], [2, 2 / 3], [0, 1], [2, 1]],
  10: [[0, 0], [2, 0], [1, 1 / 6], [0, 1 / 3], [2, 1 / 3], [0, 2 / 3], [2, 2 / 3], [1, 5 / 6], [0, 1], [2, 1]],
};
const PIP_X = [48, 70, 92];
const PIP_TOP = 42;
const PIP_BOTTOM = 122;
const PIP_SIZE = 20;

function Pips({ suit, rank, color }: { suit: Suit; rank: Rank; color: string }) {
  return (
    <>
      {PIPS[rank].map(([col, row], i) => (
        <SuitPath
          key={i}
          suit={suit}
          color={color}
          size={PIP_SIZE}
          x={PIP_X[col] - PIP_SIZE / 2}
          y={PIP_TOP + row * (PIP_BOTTOM - PIP_TOP) - PIP_SIZE / 2}
          rotate={row > 0.5}
        />
      ))}
    </>
  );
}

/** Rank above suit, top-left at reference size. */
function CornerIndex({ deck, suit, rank }: { deck: DeckId; suit: Suit; rank: Rank }) {
  const label = rankLabel(rank);
  const color = suitColor(deck, suit, rank);
  const cx = 8 + (rankWidthEm(label) * 22) / 2;
  return (
    <g>
      <text x={cx} y={25} textAnchor="middle" fontSize={22} className={styles.rank} style={{ fill: rankColor(deck, suit, rank) }}>{label}</text>
      <SuitPath suit={suit} color={color} size={15} x={cx - 7.5} y={29} />
    </g>
  );
}

/** Rank beside suit in the top strip, sized in screen px via `s` (card units per px). */
function StripIndex({ deck, suit, rank, s }: { deck: DeckId; suit: Suit; rank: Rank; s: number }) {
  const label = rankLabel(rank);
  const color = suitColor(deck, suit, rank);
  const rankPx = 13;
  const suitPx = 10;
  const left = 4;
  const top = 3;
  const suitX = left + rankWidthEm(label) * rankPx + 1.5;
  return (
    <g>
      <text x={left * s} y={(top + rankPx * 0.74) * s} fontSize={rankPx * s} className={styles.rank} style={{ fill: rankColor(deck, suit, rank) }}>
        {label}
      </text>
      <SuitPath suit={suit} color={color} size={suitPx * s} x={suitX * s} y={(top + rankPx * 0.37 - suitPx / 2) * s} />
    </g>
  );
}

export interface CardProps {
  card: CardData;
  /** Width in px; height keeps the 5:7 ratio. */
  width: number;
  className?: string;
  style?: React.CSSProperties;
  /** Force the compact play layout (index plus one big creature) at any width. */
  compact?: boolean;
  /** Override the creature's eyes, e.g. happy eyes on a matched pair. */
  eyes?: Eyes;
  /** Which deck to draw; defaults to the one chosen in Settings. */
  deck?: DeckId;
}

export function Card({ card, width, className, style, compact: forceCompact = false, eyes, deck: deckProp }: CardProps) {
  const clipId = useId();
  const chosenDeck = useDeck();
  const deck = deckProp ?? chosenDeck;
  const { suit, rank } = card;
  const deckStyle = DECKS[deck];
  const suitStyle = deckStyle.suits[suit];
  const s = REF_W / width;
  const compact = forceCompact || width < PIP_MIN_WIDTH;
  const radius = compact ? 8 * s : 14;
  const isFace = rank >= 11;
  const character = characterFor(deck, suit, rank, eyes);
  const kind = character.props.kind;
  const hat = character.props.hat;
  const inset = 0.75 * s;

  let art: React.ReactNode;
  if (compact) {
    const size = 78;
    art = <CharacterAt character={character} size={size} x={REF_W / 2 - size / 2} y={centeredTop(kind, hat, size, 122, suit)} />;
  } else if (rank === 1) {
    art = (
      <>
        <SuitPath suit={suit} color={suitStyle.ace.color} opacity={suitStyle.ace.opacity} size={116} x={12} y={40} />
        <CharacterAt character={character} size={84} x={28} y={centeredTop(kind, undefined, 84, 100, suit)} />
      </>
    );
  } else if (isFace) {
    // A little under the plan's 62px so manta wingtips keep clear of the frame, as in the mockup
    const size = 58;
    const scale = size / 64;
    const { top, bottom } = contentBounds(kind, hat, suit);
    const artH = (bottom - top) * scale;
    const gap = 5;
    const suitSize = 18;
    const groupTop = REF_H / 2 - (artH + gap + suitSize) / 2;
    art = (
      <>
        <rect x={36} y={24} width={68} height={148} rx={10} fill="none" stroke={suitStyle.frame} strokeWidth={1.5} />
        <CharacterAt character={character} size={size} x={REF_W / 2 - size / 2} y={groupTop - (top + 8) * scale} />
        <SuitPath suit={suit} color={suitColor(deck, suit, rank)} size={suitSize} x={REF_W / 2 - suitSize / 2} y={groupTop + artH + gap} />
      </>
    );
  } else {
    const size = 56;
    art = (
      <>
        <Pips suit={suit} rank={rank} color={suitStyle.symbol} />
        <CharacterAt character={character} size={size} x={REF_W / 2 - size / 2} y={REF_H - 0.6 * size * (68 / 64)} />
      </>
    );
  }

  return (
    <svg
      width={width}
      height={width * (REF_H / REF_W)}
      viewBox={`0 0 ${REF_W} ${REF_H}`}
      role="img"
      aria-label={cardName(card)}
      className={`${styles.card} ${className ?? ''}`}
      style={style}
    >
      <defs>
        <clipPath id={clipId}>
          <rect width={REF_W} height={REF_H} rx={radius} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <rect width={REF_W} height={REF_H} fill={isFace ? suitStyle.tint : deckStyle.face} />
        {art}
        {compact ? (
          <StripIndex deck={deck} suit={suit} rank={rank} s={s} />
        ) : (
          <>
            <CornerIndex deck={deck} suit={suit} rank={rank} />
            <g transform={`rotate(180 ${REF_W / 2} ${REF_H / 2})`}>
              <CornerIndex deck={deck} suit={suit} rank={rank} />
            </g>
          </>
        )}
      </g>
      <rect
        x={inset}
        y={inset}
        width={REF_W - 2 * inset}
        height={REF_H - 2 * inset}
        rx={radius - inset}
        fill="none"
        stroke={deckStyle.border}
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
