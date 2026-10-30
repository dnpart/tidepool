// Card backs, one per deck and palette (PLAN.md "Card deck" and "Card backs follow the palette"):
// Octo + Manta: Night tide (Lagoon), Coral garden (Coral Reef), Starry sea (Winter).
// Fox + Owl: Northern lights (Lagoon), Winter knit (Coral Reef), Snowfall (Winter).
import { useId } from 'react';
import { CreatureAt } from '../art/Creature';
import { Crystal } from '../art/Crystal';
import { FoxHeadAt, FoxOwlAt } from '../art/FoxOwl';
import { CARD_BACK_NAMES, type CardBackStyle } from '../decks/decks';
import { useCardBack } from '../decks/useDeck';
import { PIP_MIN_WIDTH, REF_H, REF_W } from './Card';
import styles from './Card.module.css';

export type { CardBackStyle };

const SPARKLE = '#FFF1C2';
const BACKS: Record<CardBackStyle, { bg: string; border: string }> = {
  starry: { bg: '#13213A', border: 'rgba(255,241,194,.45)' },
  tide: { bg: '#123B45', border: 'rgba(255,241,194,.45)' },
  garden: { bg: '#8A2E4A', border: 'rgba(255,226,214,.5)' },
  aurora: { bg: '#0F2438', border: 'rgba(220,235,250,.45)' },
  knit: { bg: '#9E2341', border: 'rgba(246,239,228,.55)' },
  snowfall: { bg: '#1F4775', border: 'rgba(220,235,250,.55)' },
};

/** 4-point sparkle centered on (cx, cy). */
export function Sparkle({ cx, cy, r, color = SPARKLE }: { cx: number; cy: number; r: number; color?: string }) {
  const k = r * 0.18;
  return (
    <path
      fill={color}
      d={`M${cx} ${cy - r} Q${cx + k} ${cy - k} ${cx + r} ${cy} Q${cx + k} ${cy + k} ${cx} ${cy + r} Q${cx - k} ${cy + k} ${cx - r} ${cy} Q${cx - k} ${cy - k} ${cx} ${cy - r} Z`}
    />
  );
}

// 3×4 grid, alternating octopus and manta, with two sparkle cells
const GRID: ('o' | 'm' | '*')[][] = [
  ['o', 'm', 'o'],
  ['m', '*', 'm'],
  ['o', '*', 'o'],
  ['m', 'o', 'm'],
];

function StarrySea({ detailed }: { detailed: boolean }) {
  if (!detailed) {
    return (
      <>
        <Sparkle cx={70} cy={98} r={16} />
        <circle cx={38} cy={52} r={3} fill={SPARKLE} opacity={0.6} />
        <circle cx={104} cy={146} r={3} fill={SPARKLE} opacity={0.6} />
      </>
    );
  }
  const cellW = 124 / 3;
  const cellH = 180 / 4;
  const size = 27;
  return (
    <>
      {GRID.flatMap((row, r) =>
        row.map((cell, c) => {
          const cx = 8 + cellW * (c + 0.5);
          const cy = 8 + cellH * (r + 0.5);
          if (cell === '*') return <Sparkle key={`${r}${c}`} cx={cx} cy={cy} r={7} />;
          const octopus = cell === 'o';
          return (
            <CreatureAt
              key={`${r}${c}`}
              kind={octopus ? 'octopus' : 'manta'}
              color={octopus ? '#EE8C9E' : '#7A9EB0'}
              size={size}
              x={cx - size / 2}
              y={cy - ((octopus ? 31 : 30) + 8) * (size / 64)}
            />
          );
        }),
      )}
    </>
  );
}

function NightTide({ detailed }: { detailed: boolean }) {
  const size = detailed ? 88 : 96;
  return (
    <>
      <g fill={SPARKLE} opacity={0.55}>
        <circle cx={42} cy={44} r={1.6} />
        <circle cx={102} cy={36} r={1.2} />
        <circle cx={112} cy={86} r={1.4} />
        <circle cx={30} cy={120} r={1.2} />
        <circle cx={44} cy={166} r={1.6} />
        <circle cx={96} cy={172} r={1.2} />
      </g>
      <Sparkle cx={28} cy={30} r={5} />
      <Sparkle cx={112} cy={140} r={5} />
      <CreatureAt kind="octopus" color="#EE8C9E" eyes="sleepy" size={size} x={70 - size / 2} y={98 - 39 * (size / 64)} />
    </>
  );
}

// --- Coral garden (Octo + Manta, Coral Reef) ---

const FOAM = '#FFE2D6';
const CORAL = '#F29A8A';
const CORAL_PALE = '#FFC2B0';

/** A soft branching coral growing up from (x, base), with round knobs on its three tips. */
function Coral({ x, base, h, color, w, flip = false }: { x: number; base: number; h: number; color: string; w: number; flip?: boolean }) {
  const s = flip ? -1 : 1;
  const d =
    `M${x} ${base} L${x} ${base - h} ` +
    `M${x} ${base - h * 0.45} Q${x - 9 * s} ${base - h * 0.55} ${x - 11 * s} ${base - h * 0.85} ` +
    `M${x} ${base - h * 0.7} Q${x + 8 * s} ${base - h * 0.78} ${x + 10 * s} ${base - h * 1.02} ` +
    `M${x - 11 * s} ${base - h * 0.85} L${x - 14 * s} ${base - h} ` +
    `M${x} ${base - h} L${x + 2 * s} ${base - h * 1.12}`;
  const tips: [number, number][] = [[x - 14 * s, base - h], [x + 10 * s, base - h * 1.02], [x + 2 * s, base - h * 1.12]];
  return (
    <>
      <path d={d} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
      {tips.map(([tx, ty], i) => <circle key={i} cx={tx} cy={ty} r={w * 0.85} fill={color} />)}
    </>
  );
}

function Bubbles({ spots, scale = 1 }: { spots: [number, number, number][]; scale?: number }) {
  return (
    <g fill="none" stroke={FOAM} strokeWidth={1.3 * scale} opacity={0.85}>
      {spots.map(([cx, cy, r], i) => <circle key={i} cx={cx} cy={cy} r={r * scale} />)}
    </g>
  );
}

function CoralGarden({ detailed }: { detailed: boolean }) {
  const size = detailed ? 78 : 84;
  const octopus = <CreatureAt kind="octopus" color="#F4A6BE" eyes="happy" size={size} x={70 - size / 2} y={94 - 39 * (size / 64)} />;
  if (!detailed) {
    return (
      <>
        <Coral x={30} base={200} h={34} color={CORAL} w={10} />
        <Coral x={110} base={200} h={30} color={CORAL_PALE} w={10} flip />
        <Bubbles spots={[[30, 46, 6], [112, 70, 5]]} scale={1.6} />
        {octopus}
      </>
    );
  }
  return (
    <>
      <Coral x={26} base={196} h={40} color={CORAL} w={5.5} />
      <Coral x={48} base={196} h={26} color={CORAL_PALE} w={4.5} flip />
      <Coral x={96} base={196} h={30} color={CORAL_PALE} w={4.5} />
      <Coral x={116} base={196} h={42} color={CORAL} w={5.5} flip />
      <g fill={CORAL_PALE}>
        <circle cx={70} cy={192} r={9} />
        <circle cx={62} cy={194} r={6} />
        <circle cx={79} cy={195} r={6} />
      </g>
      <Bubbles spots={[[24, 40, 4], [30, 28, 2.5], [20, 58, 2], [114, 46, 3.5], [108, 32, 2.2], [118, 64, 2], [70, 22, 2.5]]} />
      {octopus}
    </>
  );
}

// --- Northern lights (Fox + Owl, Lagoon) ---

const AURORA: [string, string, number][] = [
  ['M0 40 C40 14 84 50 140 18 L140 34 C84 70 42 30 0 58 Z', '#8CC3EC', 0.5],
  ['M0 64 C38 34 74 80 140 42 L140 66 C74 104 40 58 0 88 Z', '#6FE0C1', 0.55],
  ['M0 94 C44 68 90 100 140 72 L140 82 C90 114 46 80 0 106 Z', '#B7A6F2', 0.45],
];
const AURORA_STARS: [number, number, number][] = [[24, 22, 1.3], [112, 16, 1.3], [58, 30, 1.1], [122, 96, 1.2], [18, 112, 1.2], [96, 120, 1.1]];

function NorthernLights({ detailed, blurId }: { detailed: boolean; blurId: string }) {
  const size = detailed ? 62 : 78;
  return (
    <>
      <filter id={blurId} x="-20%" y="-40%" width="140%" height="180%">
        <feGaussianBlur stdDeviation={detailed ? 3 : 4.5} />
      </filter>
      <g filter={`url(#${blurId})`}>
        {(detailed ? AURORA : AURORA.slice(0, 2)).map(([d, color, opacity]) => <path key={d} d={d} fill={color} opacity={opacity} />)}
      </g>
      {detailed && (
        <g fill="#FFF4D6" opacity={0.8}>
          {AURORA_STARS.map(([cx, cy, r]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} />)}
        </g>
      )}
      <path d="M0 146 C34 126 82 128 140 144 L140 196 L0 196 Z" fill="#9FB9D4" />
      <path d="M0 166 C44 150 96 150 140 168 L140 196 L0 196 Z" fill="#D9E6F3" />
      {/* Feet on the front hill: the fox's drawing ends 70.7 units below its box top */}
      <FoxOwlAt kind="fox" suit="hearts" eyes="sleepy" size={size} x={70 - size / 2} y={168 - (70.7 * size) / 64} />
    </>
  );
}

// --- Winter knit (Fox + Owl, Coral Reef) ---

const YARN = '#F6EFE4';
const KNIT_BG = BACKS.knit.bg;

/** Nordic eight-point star: eight diamonds from the center, with a small square stitch in the middle. */
function KnitStar({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const at = (deg: number, dist: number) => {
    const t = (deg * Math.PI) / 180;
    return `${(cx + dist * Math.cos(t)).toFixed(2)} ${(cy + dist * Math.sin(t)).toFixed(2)}`;
  };
  const d = Array.from({ length: 8 }, (_, i) => {
    const deg = i * 45 - 90;
    return `M${cx} ${cy} L${at(deg - 22.5, r * 0.42)} L${at(deg, r)} L${at(deg + 22.5, r * 0.42)} Z`;
  }).join(' ');
  const hole = r * 0.13;
  return (
    <>
      <path d={d} fill={YARN} stroke={KNIT_BG} strokeWidth={r * 0.05} strokeLinejoin="round" />
      <rect x={cx - hole} y={cy - hole} width={2 * hole} height={2 * hole} fill={KNIT_BG} transform={`rotate(45 ${cx} ${cy})`} />
    </>
  );
}

function zigzag(y: number, startLow: boolean): string {
  return Array.from({ length: 14 }, (_, i) => `${12 + 9 * i},${(i % 2 === 0) === startLow ? y : y - 7}`).join(' ');
}

function WinterKnit({ detailed }: { detailed: boolean }) {
  if (!detailed) return <KnitStar cx={70} cy={98} r={46} />;
  const dots = [18, 28, 38, 48, 58, 68, 78, 88, 98, 108, 118];
  const stitches: [number, number][] = [[24, 66], [116, 66], [24, 98], [116, 98], [24, 130], [116, 130]];
  return (
    <>
      <g fill="none" stroke={YARN} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round">
        <polyline points={zigzag(32, true)} />
        <polyline points={zigzag(171, false)} />
      </g>
      <g fill={YARN}>
        {[44, 152].flatMap((y) =>
          dots.map((x) => <rect key={`${x}-${y}`} x={x - 1.6} y={y - 1.6} width={3.2} height={3.2} transform={`rotate(45 ${x} ${y})`} />),
        )}
      </g>
      <g fill="none" stroke={YARN} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" opacity={0.55}>
        {stitches.map(([x, y]) => <path key={`${x}-${y}`} d={`M${x - 3} ${y - 2} L${x} ${y + 2} L${x + 3} ${y - 2}`} />)}
      </g>
      <KnitStar cx={70} cy={98} r={34} />
      <g fill={YARN}>
        {[45, 135, 225, 315].map((deg) => (
          <circle key={deg} cx={70 + 40 * Math.cos((deg * Math.PI) / 180)} cy={98 + 40 * Math.sin((deg * Math.PI) / 180)} r={2} />
        ))}
      </g>
    </>
  );
}

// --- Snowfall (Fox + Owl, Winter) ---

const ICE = '#DCEBFA';
const SNOW_CRYSTALS: [number, number][] = [[34, 30], [70, 30], [106, 30], [52, 52], [88, 52], [52, 144], [88, 144], [34, 166], [70, 166], [106, 166]];
const SNOW_DOTS: [number, number][] = [[22, 98], [118, 98], [22, 52], [118, 52], [22, 144], [118, 144], [34, 76], [106, 76], [34, 120], [106, 120]];

/** The happy fox's head (44:52 crop), `width` wide and centered on (cx, cy). */
const headAt = (cx: number, cy: number, width: number) => <FoxHeadAt x={cx - width / 2} y={cy - (width * 44) / 52 / 2} width={width} />;

function Snowfall({ detailed }: { detailed: boolean }) {
  if (!detailed) {
    return (
      <>
        <circle cx={70} cy={98} r={40} fill="#F5F8FC" />
        {headAt(70, 97, 64)}
        <Crystal x={70 - 11} y={36 - 11} size={22} color={ICE} strokeWidth={2.4} />
        <Crystal x={70 - 11} y={160 - 11} size={22} color={ICE} strokeWidth={2.4} />
      </>
    );
  }
  return (
    <>
      {SNOW_CRYSTALS.map(([x, y]) => <Crystal key={`${x}-${y}`} x={x - 8.5} y={y - 8.5} size={17} color={ICE} strokeWidth={1.8} />)}
      <g fill={ICE} opacity={0.7}>
        {SNOW_DOTS.map(([cx, cy]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={1.6} />)}
      </g>
      <circle cx={70} cy={98} r={31} fill="#F5F8FC" />
      <circle cx={70} cy={98} r={35} fill="none" stroke={ICE} strokeWidth={1.2} opacity={0.6} />
      {headAt(70, 97, 48)}
    </>
  );
}

export function CardBack({
  back: backProp, width, className, style,
}: { back?: CardBackStyle; width: number; className?: string; style?: React.CSSProperties }) {
  const clipId = useId();
  const chosen = useCardBack();
  const back = backProp ?? chosen;
  const s = REF_W / width;
  const compact = width < PIP_MIN_WIDTH;
  const detailed = !compact;
  const radius = compact ? 8 * s : 14;
  const borderInset = compact ? 4 * s : 8;
  const { bg, border } = BACKS[back];
  return (
    <svg
      width={width}
      height={width * (REF_H / REF_W)}
      viewBox={`0 0 ${REF_W} ${REF_H}`}
      role="img"
      aria-label={`Face-down card, ${CARD_BACK_NAMES[back]}`}
      className={`${styles.card} ${className ?? ''}`}
      style={style}
    >
      <defs>
        <clipPath id={clipId}>
          <rect width={REF_W} height={REF_H} rx={radius} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <rect width={REF_W} height={REF_H} fill={bg} />
        {back === 'starry' && <StarrySea detailed={detailed} />}
        {back === 'tide' && <NightTide detailed={detailed} />}
        {back === 'garden' && <CoralGarden detailed={detailed} />}
        {back === 'aurora' && <NorthernLights detailed={detailed} blurId={`${clipId}-blur`} />}
        {back === 'knit' && <WinterKnit detailed={detailed} />}
        {back === 'snowfall' && <Snowfall detailed={detailed} />}
      </g>
      <rect
        x={borderInset}
        y={borderInset}
        width={REF_W - 2 * borderInset}
        height={REF_H - 2 * borderInset}
        rx={compact ? 5 * s : 9}
        fill="none"
        stroke={border}
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
