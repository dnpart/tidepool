import { Friend } from '../falling/Friend';

/** A starfish resting on an octopus, with a little pop beside them. */
export function BubblePalsIcon({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <Friend kind="star" cx={15} cy={12} size={20} />
      <Friend kind="octo" cx={15} cy={29} size={20} />
      <g stroke="var(--accent)" strokeWidth={2} strokeLinecap="round">
        <path d="M30 15 v-4" /><path d="M34.5 19 h4" /><path d="M33.5 15.5 l3 -3" />
      </g>
      <circle cx={32} cy={27} r={4.5} fill="none" stroke="var(--accent)" strokeWidth={1.8} />
    </svg>
  );
}
