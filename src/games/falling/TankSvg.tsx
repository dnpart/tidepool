// Draws a falling-block tank as an svg, 32 units per cell: what's resting, the falling piece, the faint outline of
// where it will land, and things dropping into place (or rising, for sandbars) after a step. Each game draws its own
// cells (`draw`) and its own effects on top (`children`: pops, waves).
import type { ReactElement, ReactNode } from 'react';
import styles from './Falling.module.css';

export const U = 32;
/** How much of the hidden rows shows above the tank, so a new piece peeks in. */
export const PEEK = 12;

/** A tank's size: columns, all rows, and how many of them are hidden above the part you see. */
export interface TankShape {
  cols: number;
  rows: number;
  hidden: number;
}

/** The tank's height in cells, counting the peek. */
export const tankRows = (shape: TankShape): number => shape.rows - shape.hidden + PEEK / U;
/** The top of a row, in svg units (the first row you see is at 0). */
export const rowY = (shape: TankShape, row: number): number => (row - shape.hidden) * U;

/** This step's animation: each cell's drop in rows (negative rises), what left, and how long to wait before moving. */
export interface TankAnimation<C> {
  key: number;
  drops: Map<string, number>;
  pops: { row: number; col: number; cell: C }[];
  dropDelay: number;
}

export type DrawCell<C> = (cell: C, cx: number, cy: number, size: number, extra?: { className?: string; style?: React.CSSProperties }) => ReactElement;

export function TankSvg<C>({ shape, board, piece, ghost, anim, smooth, draw, defs, children }: {
  shape: TankShape;
  board: readonly (readonly (C | null)[])[];
  /** The falling piece's cells. */
  piece: { row: number; col: number; cell: C }[] | null;
  /** Where the piece will land. */
  ghost: { row: number; col: number }[];
  anim: TankAnimation<C> | null;
  smooth: boolean;
  draw: DrawCell<C>;
  defs?: ReactNode;
  children?: ReactNode;
}) {
  const visible = shape.rows - shape.hidden;
  const y = (row: number) => rowY(shape, row);
  const size = U * 0.92;
  const resting: ReactElement[] = [];
  board.forEach((row, r) =>
    row.forEach((cell, c) => {
      if (cell === null) return;
      const dist = anim?.drops.get(`${r},${c}`) ?? 0;
      const moving = dist !== 0 && smooth;
      resting.push(
        <g key={moving ? `${anim!.key}:${r},${c}` : `${r},${c}`}>
          {draw(cell, c * U + U / 2, y(r) + U / 2, size, moving ? {
            className: styles.dropping,
            style: {
              '--from': `${-dist * U}px`,
              animationDuration: `${Math.min(320, 90 + Math.abs(dist) * 45)}ms`,
              animationDelay: `${anim!.dropDelay}ms`,
            } as React.CSSProperties,
          } : undefined)}
        </g>,
      );
    }),
  );

  return (
    <svg viewBox={`0 ${-PEEK} ${shape.cols * U} ${visible * U + PEEK}`} aria-hidden="true">
      {defs}
      {ghost.filter(({ row }) => row >= shape.hidden).map(({ row, col }) => (
        <rect key={`ghost${row},${col}`} x={col * U + 3} y={y(row) + 3} width={U - 6} height={U - 6} rx={8} className={styles.ghost} />
      ))}
      {resting}
      {piece?.map(({ row, col, cell }, i) => (
        <g key={`piece${i}`} className={smooth ? styles.piece : undefined} style={{ transform: `translate(${col * U}px, ${y(row)}px)` }}>
          {draw(cell, U / 2, U / 2, size)}
        </g>
      ))}
      {children}
    </svg>
  );
}
