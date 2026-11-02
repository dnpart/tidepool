// Draws a Bubble Pals tank as an svg, 32 units per cell: what's resting, the falling piece, the faint outline of
// where it will land, friends popping, and friends dropping into place after a landing or a pop.
import { Friend, FriendDefs } from '../falling/Friend';
import { COLS, pieceCells, ROWS, type Board, type Cell, type Piece } from './rules';
import styles from './BubblePals.module.css';

export const U = 32;
const VISIBLE = ROWS - 1;
/** How much of the hidden row shows above the tank, so a new pair's top friend peeks in. */
export const PEEK = 12;
/** The tank's height in cells, counting the peek. */
export const TANK_ROWS = VISIBLE + PEEK / U;

/** Friends drawn this step: each cell's drop distance in rows (for the settle animation), and what popped. */
export interface TankAnimation {
  key: number;
  drops: Map<string, number>;
  pops: { row: number; col: number; cell: Exclude<Cell, null> }[];
  /** Wait for the pop before things drop. */
  dropDelay: number;
}

const y = (row: number) => (row - 1) * U;

export function TankSvg({ board, piece, landing, anim, smooth }: {
  board: Board;
  piece: Piece | null;
  landing: Piece | null;
  anim: TankAnimation | null;
  smooth: boolean;
}) {
  const resting: React.ReactElement[] = [];
  board.forEach((row, r) =>
    row.forEach((cell, c) => {
      if (cell === null) return;
      const dist = anim?.drops.get(`${r},${c}`) ?? 0;
      const falling = dist > 0 && smooth;
      resting.push(
        <Friend
          key={falling ? `${anim!.key}:${r},${c}` : `${r},${c}`}
          kind={cell}
          cx={c * U + U / 2}
          cy={y(r) + U / 2}
          size={U * 0.92}
          className={falling ? styles.dropping : undefined}
          style={falling ? ({
            '--from': `${-dist * U}px`,
            animationDuration: `${Math.min(320, 90 + dist * 45)}ms`,
            animationDelay: `${anim!.dropDelay}ms`,
          } as React.CSSProperties) : undefined}
        />,
      );
    }),
  );

  const ghost = landing && piece && landing.row !== piece.row
    ? pieceCells(landing).filter(({ row }) => row >= 1)
    : [];

  return (
    <svg viewBox={`0 ${-PEEK} ${COLS * U} ${VISIBLE * U + PEEK}`} aria-hidden="true">
      <FriendDefs />
      {ghost.map(({ row, col }) => (
        <rect
          key={`ghost${row},${col}`}
          x={col * U + 3}
          y={y(row) + 3}
          width={U - 6}
          height={U - 6}
          rx={8}
          className={styles.ghost}
        />
      ))}
      {resting}
      {piece && pieceCells(piece).map(({ row, col, cell }, i) => (
        <g
          key={`piece${i}`}
          className={smooth ? styles.piece : undefined}
          style={{ transform: `translate(${col * U}px, ${y(row)}px)` }}
        >
          <Friend kind={cell} cx={U / 2} cy={U / 2} size={U * 0.92} />
        </g>
      ))}
      {anim?.pops.map(({ row, col, cell }) => (
        <g key={`${anim.key}pop${row},${col}`} className={smooth ? styles.pop : styles.popStill}>
          <circle cx={col * U + U / 2} cy={y(row) + U / 2} r={U * 0.45} className={styles.popRing} />
          <Friend kind={cell} cx={col * U + U / 2} cy={y(row) + U / 2} size={U * 0.92} />
        </g>
      ))}
    </svg>
  );
}
