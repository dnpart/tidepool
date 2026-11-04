// The sea friends and the other pieces of the falling-block games (PLAN.md "Falling-block games"), drawn by the owner
// (design/art-export/08-…svg, imported into src/art/piecesArt.ts) in a 32-unit box centered on (0, 0).
import { ArtPiece } from '../../art/Piece';

export type FriendKind = 'octo' | 'manta' | 'star' | 'turtle' | 'jelly' | 'pearl' | 'pebble' | 'shellBottom' | 'shellTop';

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
  pearl: ['pearl', 'pearls'],
  pebble: ['pebble', 'pebbles'],
  shellBottom: ['bottom shell', 'bottom shells'],
  shellTop: ['top shell', 'top shells'],
};

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
      <g transform={`translate(${cx} ${cy}) scale(${size / 32})`}><ArtPiece id={kind} /></g>
    </g>
  );
}
