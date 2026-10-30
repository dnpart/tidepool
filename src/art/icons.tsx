// Small line icons, drawn in currentColor.

interface IconProps {
  size?: number;
  className?: string;
}

function Icon({ size = 24, className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const SlidersIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 8h16M4 16h16" />
    <circle cx="15" cy="8" r="2.4" fill="var(--surface)" />
    <circle cx="9" cy="16" r="2.4" fill="var(--surface)" />
  </Icon>
);

export const ChevronRight = (p: IconProps) => <Icon {...p}><path d="M9 5l7 7-7 7" /></Icon>;
export const ChevronLeft = (p: IconProps) => <Icon {...p}><path d="M15 5l-7 7 7 7" /></Icon>;
export const PlusIcon = (p: IconProps) => <Icon {...p}><path d="M12 5v14M5 12h14" /></Icon>;

export const SunIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="3.6" />
    <path d="M12 3v1.6M12 19.4V21M3 12h1.6M19.4 12H21M5.6 5.6l1.1 1.1M17.3 17.3l1.1 1.1M5.6 18.4l1.1-1.1M17.3 6.7l1.1-1.1" />
  </Icon>
);

export const MoonIcon = (p: IconProps) => (
  <Icon {...p}><path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5Z" /></Icon>
);

export const SpeakerLow = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 10v4h3.5L12 18V6L7.5 10Z" />
    <path d="M15.5 10a3 3 0 0 1 0 4" />
  </Icon>
);

export const SpeakerHigh = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 10v4h3.5L12 18V6L7.5 10Z" />
    <path d="M15.5 10a3 3 0 0 1 0 4M18 7.5a6.5 6.5 0 0 1 0 9" />
  </Icon>
);
