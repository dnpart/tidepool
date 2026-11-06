// The checkers board: 8 × 8 squares in the palette's colors, the counters sliding square to square, the last move
// marked, and while it's your turn the pieces that can move ringed and the squares they can land on dotted.
import type { KeyboardEvent } from 'react';
import { PieceArt } from './Piece';
import { colOf, rowOf, type Seat } from './rules';
import styles from './Checkers.module.css';

const S = 40;

/** A piece where it is drawn right now (mid-move it may be between its start and its landing). */
export interface ShownPiece {
  id: number;
  sq: number;
  seat: Seat;
  king: boolean;
  /** Jumped this move: it fades away. */
  taken?: boolean;
}

export interface Target {
  sq: number;
  /** Landing here jumps a piece. */
  jump: boolean;
  label: string;
  onSelect: () => void;
}

export const squareName = (sq: number) => `${String.fromCharCode(97 + colOf(sq))}${8 - rowOf(sq)}`;

const press = (onSelect: () => void) => (e: KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    onSelect();
  }
};

export function Board({
  pieces, size, hopMs, marked, movable, selected, shaking, targets, onPiece, label,
}: {
  pieces: ShownPiece[];
  size: number;
  /** How long a piece takes to slide one hop. */
  hopMs: number;
  /** The last move's start and landing squares. */
  marked: number[];
  /** Pieces that can move now (ringed), with what tapping one does. */
  movable: { sq: number; label: string }[];
  selected: number | null;
  shaking: number | null;
  targets: Target[];
  onPiece: (sq: number) => void;
  label: string;
}) {
  const squares = [];
  for (let sq = 0; sq < 64; sq++) {
    const dark = (rowOf(sq) + colOf(sq)) % 2 === 1;
    squares.push(
      <rect key={sq} x={colOf(sq) * S} y={rowOf(sq) * S} width={S} height={S}
        className={marked.includes(sq) ? styles.marked : dark ? styles.dark : styles.light} />,
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 320 320" className={styles.board}>
      <title>{label}</title>
      {squares}
      {/* Pieces keep their place in the list (by id), so a moving piece slides instead of jumping */}
      {[...pieces].sort((a, b) => a.id - b.id).map((p) => (
        <g key={p.id} className={styles.piece} data-taken={p.taken || undefined} data-shaking={shaking === p.sq || undefined}
          style={{ transform: `translate(${colOf(p.sq) * S}px, ${rowOf(p.sq) * S}px)`, transitionDuration: `${hopMs}ms` }}>
          <g className={styles.pieceBody} data-lifted={selected === p.sq || undefined}>
            <PieceArt seat={p.seat} king={p.king} />
          </g>
        </g>
      ))}
      {movable.map(({ sq, label: what }) => (
        <g key={`m${sq}`} role="button" tabIndex={0} aria-label={what} aria-pressed={selected === sq}
          className={styles.movable} data-selected={selected === sq || undefined}
          onClick={() => onPiece(sq)} onKeyDown={press(() => onPiece(sq))}>
          <rect x={colOf(sq) * S + 1.5} y={rowOf(sq) * S + 1.5} width={S - 3} height={S - 3} rx={8} className={styles.ring} />
        </g>
      ))}
      {targets.map((t) => (
        <g key={`t${t.sq}`} role="button" tabIndex={0} aria-label={t.label} className={styles.target}
          onClick={t.onSelect} onKeyDown={press(t.onSelect)}>
          <rect x={colOf(t.sq) * S} y={rowOf(t.sq) * S} width={S} height={S} fill="transparent" />
          <circle cx={colOf(t.sq) * S + S / 2} cy={rowOf(t.sq) * S + S / 2} r={t.jump ? 8 : 6.5} className={styles.dot} />
        </g>
      ))}
    </svg>
  );
}
