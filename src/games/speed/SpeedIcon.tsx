import { INK_DARK } from '../../art/color';
import { useTheme } from '../../theme/ThemeProvider';

/** Two cards with speed lines; the second card is a manta. */
export function SpeedIcon({ size = 40 }: { size?: number }) {
  const { manta, accent } = useTheme();
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <path d="M3 15h6M2 20h7M3 25h6" stroke={accent} strokeWidth={2} strokeLinecap="round" />
      <rect x={11} y={9} width={14} height={20} rx={3} fill="#FFFDF8" stroke="var(--ink)" strokeWidth={2} transform="rotate(-8 18 19)" />
      <rect x={20} y={11} width={14} height={20} rx={3} fill={manta} stroke="var(--ink)" strokeWidth={2} transform="rotate(8 27 21)" />
      <g transform="rotate(8 27 21)">
        <circle cx={25} cy={19.5} r={0.9} fill={INK_DARK} />
        <circle cx={29} cy={19.5} r={0.9} fill={INK_DARK} />
        <path d="M25.6 22.4 q1.4 1.2 2.8 0" stroke={INK_DARK} strokeWidth={0.9} fill="none" strokeLinecap="round" />
      </g>
    </svg>
  );
}
