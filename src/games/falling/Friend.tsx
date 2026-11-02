// The faceless sea friends used as pieces in the falling-block games (PLAN.md "Falling-block games"), drawn in a
// 32-unit box centered on (0, 0). The owner asked for no faces: each friend is told apart by its shape as well as color.
import type { ReactElement } from 'react';

export type FriendKind = 'octo' | 'manta' | 'star' | 'turtle' | 'jelly' | 'clam' | 'pearl' | 'pebble' | 'shellBottom' | 'shellTop';

export const FRIEND_COLORS: Record<'octo' | 'manta' | 'star' | 'turtle' | 'jelly', string> = {
  octo: '#EE8C9E',
  manta: '#6F9FC8',
  star: '#F2C14E',
  turtle: '#5FAF7C',
  jelly: '#A688D6',
};

/** Singular and plural names, for the status line and screen readers. */
export const FRIEND_NAMES: Record<FriendKind, [string, string]> = {
  octo: ['octopus', 'octopuses'],
  manta: ['manta', 'mantas'],
  star: ['starfish', 'starfish'],
  turtle: ['turtle', 'turtles'],
  jelly: ['jellyfish', 'jellyfish'],
  clam: ['clam', 'clams'],
  pearl: ['pearl', 'pearls'],
  pebble: ['pebble', 'pebbles'],
  shellBottom: ['bottom shell', 'bottom shells'],
  shellTop: ['top shell', 'top shells'],
};

const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const shade = (h: string, f: number) => '#' + hex(h).map((v) => Math.round(v * f).toString(16).padStart(2, '0')).join('');

function starPath(R: number, r: number) {
  let d = '';
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r : R;
    d += `${i ? 'L' : 'M'}${(Math.cos(a) * rr).toFixed(2)} ${(Math.sin(a) * rr + 1.5).toFixed(2)}`;
  }
  return d + 'Z';
}
const STAR = starPath(14.5, 7);

/** The id of the pearl's gradient; draw `<FriendDefs />` once in any svg that shows pearls. */
const PEARL_GRADIENT = 'tp-pearl-gradient';

export function FriendDefs() {
  return (
    <defs>
      <radialGradient id={PEARL_GRADIENT} cx=".35" cy=".35" r=".75">
        <stop offset="0" stopColor="#FFFFFF" />
        <stop offset=".6" stopColor="#F3ECF7" />
        <stop offset="1" stopColor="#D9CDE6" />
      </radialGradient>
    </defs>
  );
}

function shape(kind: FriendKind): ReactElement {
  switch (kind) {
    case 'octo': {
      const c = FRIEND_COLORS.octo, sh = shade(c, 0.86);
      return (
        <>
          {[-8.5, -2.8, 2.8, 8.5].map((x) => <circle key={x} cx={x} cy={9.5} r={3.8} fill={sh} />)}
          <circle cy={-2} r={11.8} fill={c} />
          <path d="M-6 -11.5 C-10 -9 -11.8 -5 -11.8 -2 C-11.8 3 -9 6.5 -5 8.5 C-8 4 -8.5 -4 -6 -11.5Z" fill={sh} />
          <path d="M-4 -9.5 Q-7.5 -7.5 -8 -3.5" stroke="#FFF" strokeWidth={1.8} fill="none" opacity={0.55} strokeLinecap="round" />
        </>
      );
    }
    case 'manta': {
      const c = FRIEND_COLORS.manta, sh = shade(c, 0.86);
      return (
        <>
          <path d="M0 8 Q3 12 0 15" stroke={sh} strokeWidth={1.6} fill="none" strokeLinecap="round" />
          <path d="M0 -8 C3.5 -8 6 -6.5 8 -4 C11 -7 14 -9 16 -9 C15 -2 11 5 5 8.5 C3 9.6 -3 9.6 -5 8.5 C-11 5 -15 -2 -16 -9 C-14 -9 -11 -7 -8 -4 C-6 -6.5 -3.5 -8 0 -8Z" fill={c} />
          <path d="M8 -4 C11 -7 14 -9 16 -9 C15 -2 11 5 5 8.5 C7 4 8 0 8 -4Z" fill={sh} />
          <circle cx={-3.5} cy={-7.2} r={2} fill={c} />
          <circle cx={3.5} cy={-7.2} r={2} fill={c} />
        </>
      );
    }
    case 'star': {
      const c = FRIEND_COLORS.star, sh = shade(c, 0.86);
      return (
        <>
          <path d={STAR} fill={c} stroke={c} strokeWidth={3} strokeLinejoin="round" />
          <g fill={sh}>
            <circle cx={0} cy={-7} r={1.2} /><circle cx={-7.5} cy={-0.5} r={1.2} /><circle cx={7.5} cy={-0.5} r={1.2} />
            <circle cx={-4.5} cy={7.5} r={1.2} /><circle cx={4.5} cy={7.5} r={1.2} /><circle cx={0} cy={1.5} r={1.6} />
          </g>
        </>
      );
    }
    case 'turtle': {
      const c = FRIEND_COLORS.turtle, sh = shade(c, 0.86);
      return (
        <>
          {[[-10.5, -7], [10.5, -7], [-10.5, 9], [10.5, 9]].map(([x, y]) => <ellipse key={`${x},${y}`} cx={x} cy={y} rx={4.6} ry={3.2} fill={sh} />)}
          <circle cy={-12.5} r={4.2} fill={sh} />
          <circle cy={1} r={12.2} fill={c} />
          <g stroke="#BFE3C9" strokeWidth={1.3} strokeLinecap="round" fill="none" opacity={0.9}>
            <path d="M0 -5 L5.6 -2 L5.6 4.5 L0 7.8 L-5.6 4.5 L-5.6 -2Z" />
            <path d="M0 -5 V-10.5 M5.6 -2 L10.5 -4.5 M-5.6 -2 L-10.5 -4.5 M5.6 4.5 L10 7.5 M-5.6 4.5 L-10 7.5" />
          </g>
        </>
      );
    }
    case 'jelly': {
      const c = FRIEND_COLORS.jelly, sh = shade(c, 0.86);
      return (
        <>
          {[-6, 0, 6].map((x) => (
            <path key={x} d={`M${x} 4 Q${x + 2.5} 8 ${x} 11 Q${x - 2.5} 13.5 ${x} 15.5`} stroke={sh} strokeWidth={2} fill="none" strokeLinecap="round" />
          ))}
          <path d="M-13 4 C-13 -15 13 -15 13 4 Q9.75 7 6.5 4 Q3.25 7 0 4 Q-3.25 7 -6.5 4 Q-9.75 7 -13 4Z" fill={c} />
          <path d="M-7 -9 Q-10 -4 -9.5 1" stroke="#FFF" strokeWidth={1.6} fill="none" opacity={0.55} strokeLinecap="round" />
        </>
      );
    }
    case 'clam':
      return (
        <>
          <path d="M-14 7 C-15 -6 -8 -13 0 -13 C8 -13 15 -6 14 7 Q0 10.5 -14 7Z" fill="#C3BBCF" />
          <path d="M0 7 L-10 -6 M0 7 L-4 -11.5 M0 7 L4 -11.5 M0 7 L10 -6" stroke="#A49BB3" strokeWidth={1.3} strokeLinecap="round" />
          <path d="M-14 7 Q0 10.5 14 7 L13 9.5 Q0 13 -13 9.5Z" fill="#A49BB3" />
        </>
      );
    case 'pearl':
      return (
        <>
          <circle r={11} fill={`url(#${PEARL_GRADIENT})`} stroke="#D9CDE6" strokeWidth={1} />
          <path d="M-4 -6 Q-6.5 -3.5 -6 0" stroke="#FFF" strokeWidth={2} fill="none" strokeLinecap="round" />
          <path d="M12 -13 l1.2 3 3 1.2 -3 1.2 -1.2 3 -1.2 -3 -3 -1.2 3 -1.2Z" fill="#F6C752" />
        </>
      );
    // Tide Swap's clam shell halves, as in the mockup (design/block-games/mockups.html, 'B' and 'T')
    case 'shellBottom':
      return (
        <>
          <path d="M-15 -3 Q-15 13 0 13 Q15 13 15 -3Z" fill="#F2C3A8" />
          <g stroke="#D99E80" strokeWidth={1.3} strokeLinecap="round">
            <path d="M0 -3 L0 12" /><path d="M-6 -3 L-5 11" /><path d="M6 -3 L5 11" />
          </g>
          <path d="M-15 -3 L15 -3" stroke="#D99E80" strokeWidth={1.6} strokeLinecap="round" />
        </>
      );
    case 'shellTop':
      return (
        <>
          <path d="M-15 5 Q-15 -12 0 -12 Q15 -12 15 5Z" fill="#F2C3A8" />
          <g stroke="#D99E80" strokeWidth={1.3} strokeLinecap="round">
            <path d="M0 5 L0 -11" /><path d="M-6 5 L-6.5 -9.5" /><path d="M6 5 L6.5 -9.5" />
          </g>
          <path d="M-15 5 L15 5" stroke="#D99E80" strokeWidth={1.6} strokeLinecap="round" />
        </>
      );
    case 'pebble':
      return (
        <>
          <ellipse cy={2} rx={13} ry={10} fill="#A3ACB5" />
          <ellipse cx={-4} cy={-2} rx={5} ry={3} fill="#C4CBD2" />
          <circle cx={6} cy={5} r={1.4} fill="#8C959F" />
        </>
      );
  }
}

/** One friend centered on (cx, cy), `size` units across. */
export function Friend({ kind, cx, cy, size, className, style }: {
  kind: FriendKind;
  cx: number;
  cy: number;
  size: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    // The outer group is free for CSS animations; the position lives on the inner one so they don't clash
    <g className={className} style={style}>
      <g transform={`translate(${cx} ${cy}) scale(${size / 32})`}>{shape(kind)}</g>
    </g>
  );
}
