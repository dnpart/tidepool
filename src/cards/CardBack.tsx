// Card backs from PLAN.md "Card deck": Starry sea (default) and Night tide.
import { useId } from 'react';
import { CreatureAt } from '../art/Creature';
import { PIP_MIN_WIDTH, REF_H, REF_W } from './Card';
import styles from './Card.module.css';

export type CardBackStyle = 'starry' | 'tide';

const SPARKLE = '#FFF1C2';
const INNER_BORDER = 'rgba(255,241,194,.45)';
const BACKS: Record<CardBackStyle, { bg: string; label: string }> = {
  starry: { bg: '#13213A', label: 'Starry sea' },
  tide: { bg: '#123B45', label: 'Night tide' },
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

export function CardBack({
  back = 'starry', width, className, style,
}: { back?: CardBackStyle; width: number; className?: string; style?: React.CSSProperties }) {
  const clipId = useId();
  const s = REF_W / width;
  const compact = width < PIP_MIN_WIDTH;
  const radius = compact ? 8 * s : 14;
  const borderInset = compact ? 4 * s : 8;
  const { bg, label } = BACKS[back];
  return (
    <svg
      width={width}
      height={width * (REF_H / REF_W)}
      viewBox={`0 0 ${REF_W} ${REF_H}`}
      role="img"
      aria-label={`Face-down card, ${label}`}
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
        {back === 'starry' ? <StarrySea detailed={!compact} /> : <NightTide detailed={!compact} />}
      </g>
      <rect
        x={borderInset}
        y={borderInset}
        width={REF_W - 2 * borderInset}
        height={REF_H - 2 * borderInset}
        rx={compact ? 5 * s : 9}
        fill="none"
        stroke={INNER_BORDER}
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
