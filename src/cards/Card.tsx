// Card faces drawn on a 140×196 reference card (PLAN.md "Card deck") and scaled by `width`.
import { useId } from 'react';
import { CreatureAt, type CreatureProps, type Hat } from '../art/Creature';
import { SuitPath } from '../art/Suit';
import { cardName, rankLabel, SUIT_STYLE, type Card as CardData, type Rank, type Suit } from './deck';
import styles from './Card.module.css';

export const REF_W = 140;
export const REF_H = 196;
/** Below this width cards switch to the compact play layout. */
export const PIP_MIN_WIDTH = 80;

const FACE_BG = '#FFFDF8';

/** Rank text color: red suits use slightly darker text than their symbols so it reads at 4.5:1 (7:1 in high contrast). */
const rankColor = (suit: Suit) => `var(--rank-${suit}, ${SUIT_STYLE[suit].symbol})`;
const BORDER = '#DDD5C4';

// Approximate Fredoka 600 advance widths (em), to place the suit beside or under the rank
const RANK_EM: Record<string, number> = { A: 0.66, J: 0.5, Q: 0.7, K: 0.64, '10': 1.0 };
const rankWidthEm = (label: string) => RANK_EM[label] ?? 0.58;

/** Vertical extent of a creature's drawing in viewBox units, so it can be centered visually. */
export function contentBounds(kind: CreatureProps['kind'], hat?: Hat): { top: number; bottom: number } {
  if (kind === 'octopus') return { top: hat ? -7 : 4, bottom: 58 };
  return { top: hat ? 0 : 12, bottom: 59 };
}

/** Top y that centers a creature of `size` width on `centerY`, in card units. */
function centeredTop(kind: CreatureProps['kind'], hat: Hat | undefined, size: number, centerY: number) {
  const { top, bottom } = contentBounds(kind, hat);
  const s = size / 64;
  return centerY - ((top + bottom) / 2 + 8) * s;
}

const HAT_FOR: Partial<Record<Rank, Hat>> = { 12: 'queen', 13: 'king' };

function creatureFor(suit: Suit, rank: Rank): CreatureProps {
  const style = SUIT_STYLE[suit];
  const props: CreatureProps = { kind: style.team, color: style.creature };
  if (rank === 1) return { ...props, eyes: 'happy', badge: suit, badgeColor: style.symbol };
  if (rank >= 11) return { ...props, eyes: 'open', hat: HAT_FOR[rank] };
  return props;
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

function Pips({ suit, rank }: { suit: Suit; rank: Rank }) {
  const color = SUIT_STYLE[suit].symbol;
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
function CornerIndex({ suit, rank }: { suit: Suit; rank: Rank }) {
  const label = rankLabel(rank);
  const color = SUIT_STYLE[suit].symbol;
  const cx = 8 + (rankWidthEm(label) * 22) / 2;
  return (
    <g>
      <text x={cx} y={25} textAnchor="middle" fontSize={22} className={styles.rank} style={{ fill: rankColor(suit) }}>{label}</text>
      <SuitPath suit={suit} color={color} size={15} x={cx - 7.5} y={29} />
    </g>
  );
}

/** Rank beside suit in the top strip, sized in screen px via `s` (card units per px). */
function StripIndex({ suit, rank, s }: { suit: Suit; rank: Rank; s: number }) {
  const label = rankLabel(rank);
  const color = SUIT_STYLE[suit].symbol;
  const rankPx = 13;
  const suitPx = 10;
  const left = 4;
  const top = 3;
  const suitX = left + rankWidthEm(label) * rankPx + 1.5;
  return (
    <g>
      <text x={left * s} y={(top + rankPx * 0.74) * s} fontSize={rankPx * s} className={styles.rank} style={{ fill: rankColor(suit) }}>
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
}

export function Card({ card, width, className, style }: CardProps) {
  const clipId = useId();
  const { suit, rank } = card;
  const suitStyle = SUIT_STYLE[suit];
  const s = REF_W / width;
  const compact = width < PIP_MIN_WIDTH;
  const radius = compact ? 8 * s : 14;
  const isFace = rank >= 11;
  const creature = creatureFor(suit, rank);
  const inset = 0.75 * s;

  let art: React.ReactNode;
  if (compact) {
    const size = 78;
    art = <CreatureAt {...creature} size={size} x={REF_W / 2 - size / 2} y={centeredTop(creature.kind, creature.hat, size, 122)} />;
  } else if (rank === 1) {
    art = (
      <>
        <SuitPath suit={suit} color={suitStyle.creature} opacity={0.3} size={116} x={12} y={40} />
        <CreatureAt {...creature} size={84} x={28} y={centeredTop(creature.kind, undefined, 84, 100)} />
      </>
    );
  } else if (isFace) {
    // A little under the plan's 62px so manta wingtips keep clear of the frame, as in the mockup
    const size = 58;
    const scale = size / 64;
    const { top, bottom } = contentBounds(creature.kind, creature.hat);
    const artH = (bottom - top) * scale;
    const gap = 5;
    const suitSize = 18;
    const groupTop = REF_H / 2 - (artH + gap + suitSize) / 2;
    art = (
      <>
        <rect x={36} y={24} width={68} height={148} rx={10} fill="none" stroke={suitStyle.frame} strokeWidth={1.5} />
        <CreatureAt {...creature} size={size} x={REF_W / 2 - size / 2} y={groupTop - (top + 8) * scale} />
        <SuitPath suit={suit} color={suitStyle.symbol} size={suitSize} x={REF_W / 2 - suitSize / 2} y={groupTop + artH + gap} />
      </>
    );
  } else {
    const size = 56;
    art = (
      <>
        <Pips suit={suit} rank={rank} />
        <CreatureAt {...creature} size={size} x={REF_W / 2 - size / 2} y={REF_H - 0.6 * size * (68 / 64)} />
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
        <rect width={REF_W} height={REF_H} fill={isFace ? suitStyle.tint : FACE_BG} />
        {art}
        {compact ? (
          <StripIndex suit={suit} rank={rank} s={s} />
        ) : (
          <>
            <CornerIndex suit={suit} rank={rank} />
            <g transform={`rotate(180 ${REF_W / 2} ${REF_H / 2})`}>
              <CornerIndex suit={suit} rank={rank} />
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
        stroke={BORDER}
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
