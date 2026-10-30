/** Cloud shape (viewBox 0 0 80 44), filled with the theme's cloud color by default. */
export function Cloud({
  width = 120, color = 'var(--cloud)', className, style,
}: { width?: number; color?: string; className?: string; style?: React.CSSProperties }) {
  return (
    <svg width={width} height={width * 0.55} viewBox="0 0 80 44" className={className} style={style} aria-hidden="true">
      <g fill={color}>
        <circle cx="24" cy="27" r="12" />
        <circle cx="40" cy="19" r="15" />
        <circle cx="57" cy="26" r="11" />
        <rect x="12" y="26" width="58" height="13" rx="6.5" />
      </g>
    </svg>
  );
}
