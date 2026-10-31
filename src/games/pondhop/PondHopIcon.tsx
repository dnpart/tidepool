import { Marble } from './Board';

/** Three marbles round a little pond with a lily pad. */
export function PondHopIcon({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <circle cx={20} cy={21} r={10} fill="#B9E1E3" stroke="var(--ink)" strokeWidth={1.8} />
      <path d="M14.5 19 q3 -2 6 0" fill="none" stroke="#FFFFFF" strokeWidth={1.4} strokeLinecap="round" />
      <circle cx={23} cy={24} r={3.4} fill="#7CC08A" />
      <Marble x={8} y={11} r={5} seat={0} />
      <Marble x={33} y={14} r={5} seat={1} />
      <Marble x={14} y={34} r={5} seat={2} />
    </svg>
  );
}
