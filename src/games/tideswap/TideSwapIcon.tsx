import { Friend } from '../falling/Friend';

/** A turtle and an octopus trading places, with the swap arrows between them. */
export function TideSwapIcon({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <Friend kind="turtle" cx={10} cy={12} size={17} />
      <Friend kind="octo" cx={30} cy={12} size={17} />
      <g fill="none" stroke="var(--accent)" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 26 H30 M26 22.5 L30 26 L26 29.5" />
        <path d="M31 34 H10 M14 30.5 L10 34 L14 37.5" />
      </g>
    </svg>
  );
}
