/** Six-armed snow crystal (24×24 box), stroked with the theme's crystal color by default. Inside another SVG, pass x and y. */
export function Crystal({
  size = 20, color = 'var(--crystal)', strokeWidth = 1.6, x, y,
}: { size?: number; color?: string; strokeWidth?: number; x?: number; y?: number }) {
  return (
    <svg x={x} y={y} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <g fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round">
        <path d="M12 1.5 V22.5 M2.9 6.75 L21.1 17.25 M2.9 17.25 L21.1 6.75" />
        <path d="M9.5 3.8 L12 6 L14.5 3.8 M9.5 20.2 L12 18 L14.5 20.2 M3.6 10 L6.8 10.5 L5.8 7.4 M18.2 16.6 L17.2 13.5 L20.4 14 M3.6 14 L6.8 13.5 L5.8 16.6 M18.2 7.4 L17.2 10.5 L20.4 10" />
      </g>
    </svg>
  );
}
