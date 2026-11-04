// A Bubble Pals tank: the shared tank drawing (`falling/TankSvg`) with friends for cells, and friends popping on top.
import { Friend } from '../falling/Friend';
import { rowY, tankRows, TankSvg, U, type DrawCell, type TankAnimation, type TankShape } from '../falling/TankSvg';
import { COLS, pieceCells, ROWS, type Board, type Cell, type Piece } from './rules';
import styles from './BubblePals.module.css';

export const SHAPE: TankShape = { cols: COLS, rows: ROWS, hidden: 1 };
export const TANK_ROWS = tankRows(SHAPE);
export type PalsAnimation = TankAnimation<Exclude<Cell, null>>;

const drawFriend: DrawCell<Exclude<Cell, null>> = (cell, cx, cy, size, extra) => (
  <Friend kind={cell} cx={cx} cy={cy} size={size} className={extra?.className} style={extra?.style} />
);

export function PalsTank({ board, piece, landing, anim, smooth }: {
  board: Board;
  piece: Piece | null;
  landing: Piece | null;
  anim: PalsAnimation | null;
  smooth: boolean;
}) {
  const ghost = landing && piece && landing.row !== piece.row ? pieceCells(landing) : [];
  const y = (row: number) => rowY(SHAPE, row);
  return (
    <TankSvg shape={SHAPE} board={board} piece={piece && pieceCells(piece)} ghost={ghost} anim={anim} smooth={smooth}
      draw={drawFriend}>
      {anim?.pops.map(({ row, col, cell }) => (
        <g key={`${anim.key}pop${row},${col}`} className={smooth ? styles.pop : styles.popStill}>
          <circle cx={col * U + U / 2} cy={y(row) + U / 2} r={U * 0.45} className={styles.popRing} />
          <Friend kind={cell} cx={col * U + U / 2} cy={y(row) + U / 2} size={U * 0.92} />
        </g>
      ))}
    </TankSvg>
  );
}
