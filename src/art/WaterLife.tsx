// Stand-in drawings (Nov 7) for Coral Reef's tentacle in Pond Hop and the tide in Tide Swap, until the owner's own
// drawings come back from the art export (file 12, `12-water-life.svg`). Each is drawn in the box the owner's frame
// uses, so their drawing can replace it piece for piece:
//   Tentacle  40 × 80, its base (where it meets the water) at the bottom middle, (20, 80); it stands straight up.
//   TideCrest 80 × 40, the top of the wave: it repeats sideways, so its left and right edges meet at the same height
//             (y = 22), and below y = 40 the screen fills in plain water (`TIDE_WATER`).
//   TideFoam  80 × 40, foam and bubbles on their own, left behind as the water goes back down; also repeats sideways.

/** The water under the crest, and the crest's own colors, for the stand-in. */
export const TIDE_WATER = '#8FD3DC';
const CREST = '#B9E6EA';
const FOAM = '#FFFFFF';

/** Coral Reef's tentacle, standing up from the water, base at (20, 80). */
export function Tentacle() {
  return (
    <g>
      <path
        d="M5 80 C3 58 6 40 14 26 C21 13 35 7 38.5 18 C41 27 33 32 28 27.5 C25 24.5 27.5 20.5 31 22 C28 16.5 22.5 21 21 29 C18 44 22 62 31 80 Z"
        fill="#F2A08F"
      />
      <path d="M21 29 C18 44 22 62 31 80 L24 80 C16.5 62 13.5 44 17 32 Z" fill="#E08A79" />
      {([[24.5, 72, 2.6], [21.5, 61, 2.4], [20, 50, 2.1], [19.8, 40, 1.8], [20.8, 32.5, 1.4]] as const).map(([x, y, r]) => (
        <circle key={y} cx={x} cy={y} r={r} fill="#FFD6CC" />
      ))}
    </g>
  );
}

/** The top of the tide, 80 wide: a rolling crest with a foamy lip. Repeats sideways. */
export function TideCrest() {
  return (
    <g>
      <path d="M0 22 C10 10 22 6 34 12 C42 16 46 24 56 22 C66 20 72 14 80 22 L80 40 L0 40 Z" fill={TIDE_WATER} />
      <path d="M0 22 C10 10 22 6 34 12 C42 16 46 24 56 22 C66 20 72 14 80 22 L80 28 C72 22 66 27 56 29 C46 31 41 23 34 19 C24 13 12 17 0 28 Z" fill={CREST} />
      <path d="M2 21 C12 10 22 7 33 12" fill="none" stroke={FOAM} strokeWidth={3} strokeLinecap="round" />
      <path d="M57 21 C66 19 72 15 79 21" fill="none" stroke={FOAM} strokeWidth={3} strokeLinecap="round" />
    </g>
  );
}

/** Foam and bubbles the tide leaves behind, 80 wide. Repeats sideways. */
export function TideFoam() {
  return (
    <g fill={FOAM}>
      {([[8, 24, 3], [16, 30, 2], [27, 22, 2.5], [38, 32, 1.8], [47, 25, 3.2], [58, 31, 2], [66, 23, 2.4], [74, 29, 1.6]] as const).map(
        ([x, y, r]) => <circle key={x} cx={x} cy={y} r={r} opacity={0.9} />,
      )}
      <path d="M4 34 C14 30 22 36 32 33 C42 30 50 36 60 33 C68 31 74 35 80 34" fill="none" stroke={FOAM} strokeWidth={2}
        strokeLinecap="round" opacity={0.8} />
    </g>
  );
}
