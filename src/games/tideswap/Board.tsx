// Tide Swap's board: four columns side by side, each stack sliding to its new column when swapped, the falling
// friends gliding down a slot each beat, and what happens on landing (twins swimming away, a clam closing into a
// pearl, a top shell melting). Drawn in HTML so stacks and friends can move with CSS transitions.
import { Friend, FRIEND_NAMES, type FriendKind } from '../falling/Friend';
import shared from '../falling/Falling.module.css';
import { COLS, HEIGHT, preview, type Item, type Tank } from './rules';
import styles from './TideSwap.module.css';

/** How much of the slot above the tank shows, so a new drop peeks in. */
export const PEEK = 12;

export const kindOf = (item: Item): FriendKind => (item === 'bottom' ? 'shellBottom' : item === 'top' ? 'shellTop' : item);

/** Something leaving after a landing, drawn in the column it happened in. */
export interface Effect {
  key: number;
  col: number;
  /** 'wash': the tide going out at the end of a Solo level, taking what was left. */
  kind: 'match' | 'clam' | 'melt' | 'wash';
  items: { slot: number; item: Item }[];
  /** A clam's middle slot, where the pearl forms. */
  center: number;
}

export interface Geometry {
  /** Slot height, and each column's width and the gap between columns, in px. */
  cell: number;
  colW: number;
  gap: number;
}

export const boardWidth = ({ colW, gap }: Geometry) => COLS * colW + (COLS - 1) * gap;
export const boardHeight = ({ cell }: Geometry) => HEIGHT * cell + PEEK;

function Piece({ kind, size }: { kind: FriendKind; size: number }) {
  return (
    <svg width={size} height={size} viewBox="-16 -16 32 32" aria-hidden="true">
      <Friend kind={kind} cx={0} cy={0} size={30} />
    </svg>
  );
}

export function Board({ tank, ids, geo, fallMs, smooth, effects, mode, label, gestures, children }: {
  tank: Tank;
  /** Which stack (by identity) is in each column, so a swapped stack can slide rather than jump. */
  ids: number[];
  geo: Geometry;
  fallMs: number;
  smooth: boolean;
  effects: Effect[];
  mode: 'light' | 'dark';
  label: string;
  /** Pointer handlers for the columns (drag to swap, flick down to drop). */
  gestures?: React.HTMLAttributes<HTMLDivElement>;
  children?: React.ReactNode;
}) {
  const { cell, colW, gap } = geo;
  const height = boardHeight(geo);
  const x = (col: number) => col * (colW + gap);
  const top = (slot: number) => height - (slot + 1) * cell;
  const size = Math.round(Math.min(cell, colW) * 0.86);
  const box = { width: colW, height: cell };

  return (
    <div className={styles.board} style={{ width: boardWidth(geo), height }} role="img" aria-label={label} {...gestures}>
      {Array.from({ length: COLS }, (_, c) => (
        <div key={c} className={`${shared.tank} ${styles.column}`} data-mode={mode} style={{ left: x(c), width: colW, height }} />
      ))}
      {ids.map((id, col) => (
        <div
          key={`stack${id}`}
          className={styles.stack}
          data-col={col}
          data-smooth={smooth || undefined}
          style={{ transform: `translateX(${x(col)}px)`, width: colW, height }}
        >
          {tank.stacks[col].map((item, slot) => (
            <div key={slot} className={styles.slot} style={{ ...box, top: top(slot) }} data-item={item}>
              <Piece kind={kindOf(item)} size={size} />
            </div>
          ))}
        </div>
      ))}
      {tank.falling.map((f) => (
        <div
          key={`f${f.id}`}
          className={styles.slot}
          data-item={f.item}
          data-col={f.col}
          data-y={f.y}
          style={{
            ...box,
            // Sideways with its column when swapped (as quick as the stack), down a slot each beat
            left: x(f.col),
            transform: `translateY(${top(f.y)}px)`,
            transition: smooth ? `left 150ms ease-out, transform ${fallMs}ms linear` : undefined,
          }}
        >
          <Piece kind={kindOf(f.item)} size={size} />
        </div>
      ))}
      {effects.map((e) => (
        <div key={`e${e.key}`} className={styles.effect} style={{ transform: `translateX(${x(e.col)}px)`, width: colW, height }}>
          {e.items.map(({ slot, item }, i) => (
            <div
              key={i}
              className={`${styles.slot} ${smooth ? styles[e.kind] : styles.fade}`}
              style={{
                ...box,
                top: top(slot),
                '--to': `${(slot - e.center) * cell}px`,
                // The tide pulls the lowest pieces first, column by column
                ...(e.kind === 'wash' && smooth ? { animationDelay: `${e.col * 60 + slot * 45}ms`, '--drift': `${(e.col - 1.5) * 6}px` } : {}),
              } as React.CSSProperties}
            >
              <Piece kind={kindOf(item)} size={size} />
            </div>
          ))}
          {e.kind === 'clam' && (
            <div className={`${styles.slot} ${smooth ? styles.pearl : styles.fade}`} style={{ ...box, top: top(e.center) }}>
              <Piece kind="pearl" size={size} />
            </div>
          )}
        </div>
      ))}
      {children}
    </div>
  );
}

/** Height of the row of Next boxes over the columns. */
export const NEXT_H = 40;

/** A box over each lane showing what the next drop brings into it (empty if nothing). Pebbles show in their own row. */
export function NextRow({ tank, geo }: { tank: Tank; geo: Geometry }) {
  const next = preview(tank);
  const words = next.map(({ col, item }) => `${FRIEND_NAMES[kindOf(item)][0]} in column ${col + 1}`);
  const size = NEXT_H - 12;
  return (
    <div
      className={styles.nextRow}
      style={{ width: boardWidth(geo), height: NEXT_H, gap: geo.gap }}
      role="img"
      aria-label={`Next: ${words.join(' and ')}`}
    >
      {Array.from({ length: COLS }, (_, col) => {
        const item = next.find((n) => n.col === col)?.item;
        return (
          <div key={col} className={styles.nextBox} style={{ width: geo.colW }} data-next={item}>
            {item && <Piece kind={kindOf(item)} size={size} />}
          </div>
        );
      })}
    </div>
  );
}

/** The opponent's columns, small and still. */
export function MiniBoard({ tank, cell, label, mode }: { tank: Tank; cell: number; label: string; mode: 'light' | 'dark' }) {
  const gap = 3;
  const height = HEIGHT * cell + 4;
  return (
    <div className={styles.board} style={{ width: COLS * cell + (COLS - 1) * gap, height }} role="img" aria-label={label}>
      {Array.from({ length: COLS }, (_, c) => (
        <div key={c} className={`${shared.tank} ${styles.column}`} data-mode={mode}
          style={{ left: c * (cell + gap), width: cell, height, borderRadius: 6 }}>
          {tank.stacks[c].map((item, slot) => (
            <div key={slot} className={styles.slot} style={{ width: cell, height: cell, top: height - (slot + 1) * cell - 2 }}>
              <Piece kind={kindOf(item)} size={cell - 2} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
