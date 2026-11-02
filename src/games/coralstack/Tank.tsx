// A Coral Stack tank: the shared tank drawing (`falling/TankSvg`) with coral and sand blocks for cells, and waves
// washing rows away on top.
import { rowY, tankRows, TankSvg, U, type DrawCell, type TankAnimation, type TankShape } from '../falling/TankSvg';
import { Block } from './Block';
import { COLS, HIDDEN, pieceCells, ROWS, type Board, type Cell, type Piece } from './rules';
import styles from './CoralStack.module.css';

export const SHAPE: TankShape = { cols: COLS, rows: ROWS, hidden: HIDDEN };
export const TANK_ROWS = tankRows(SHAPE);
export type BlockKind = Exclude<Cell, null>;
/** `pops` are the blocks washing away; `waveRows` the rows they were in. */
export interface CoralAnimation extends TankAnimation<BlockKind> {
  waveRows: number[];
}

// Blocks fill their whole cell, as in the mockup
const drawBlock: DrawCell<BlockKind> = (cell, cx, cy, _size, extra) => (
  <Block kind={cell} cx={cx} cy={cy} size={U} className={extra?.className} style={extra?.style} />
);

/** A wavy line across the tank, one crest per cell. */
const WAVE_PATH = `M4 ${U / 2}` + ' q8 -9 16 0 t16 0'.repeat(COLS * 2 - 1);

export function CoralTank({ board, piece, landing, anim, smooth }: {
  board: Board;
  piece: Piece | null;
  landing: Piece | null;
  anim: CoralAnimation | null;
  smooth: boolean;
}) {
  const ghost = landing && piece && landing.row !== piece.row ? pieceCells(landing) : [];
  const y = (row: number) => rowY(SHAPE, row);
  return (
    <TankSvg shape={SHAPE} board={board} piece={piece && pieceCells(piece).map((c) => ({ ...c, cell: piece.color }))}
      ghost={ghost} anim={anim} smooth={smooth} draw={drawBlock}>
      {anim?.pops.map(({ row, col, cell }) => (
        <Block key={`${anim.key}wash${row},${col}`} kind={cell} cx={col * U + U / 2} cy={y(row) + U / 2} size={U}
          className={smooth ? styles.wash : styles.washStill}
          style={{ animationDelay: smooth ? `${col * 18}ms` : undefined }} />
      ))}
      {anim?.waveRows.map((row) => (
        <g key={`${anim.key}wave${row}`} transform={`translate(0 ${y(row)})`} className={styles.wave}>
          <rect x={1} y={0} width={COLS * U - 2} height={U} rx={8} className={styles.waveBand} />
          {smooth && <path d={WAVE_PATH} pathLength={1} className={styles.waveLine} />}
        </g>
      ))}
    </TankSvg>
  );
}
