// How far each piece of a falling-block tank moved after a step, for the drop animation. Shared by the games whose
// boards are `board[row][col]` with null for empty, row 0 at the top.

/**
 * How far each cell in `after` fell, in rows: things keep their order in a column, so the k-th from the bottom after
 * is the k-th from the bottom of what was there before (minus what left, plus `added`). Anything with nothing to match
 * (clams dropping in) came from above the tank.
 */
export function fallDistances(
  before: readonly (readonly unknown[])[],
  after: readonly (readonly unknown[])[],
  gone: Set<string>,
  added: { row: number; col: number }[],
): Map<string, number> {
  const drops = new Map<string, number>();
  const rows = before.length, cols = before[0]?.length ?? 0;
  for (let c = 0; c < cols; c++) {
    const from: number[] = [];
    for (let r = 0; r < rows; r++) if (before[r][c] !== null && !gone.has(`${r},${c}`)) from.push(r);
    for (const a of added) if (a.col === c) from.push(a.row);
    from.sort((a, b) => b - a);
    const to: number[] = [];
    for (let r = rows - 1; r >= 0; r--) if (after[r][c] !== null) to.push(r);
    to.forEach((row, i) => {
      const src = i < from.length ? from[i] : -1 - (i - from.length);
      if (row > src) drops.set(`${row},${c}`, row - src);
    });
  }
  return drops;
}

/** Everything on `after` rose `rows` rows (sandbars pushing up from the bottom): negative drops. */
export function riseDistances(after: readonly (readonly unknown[])[], rows: number): Map<string, number> {
  const drops = new Map<string, number>();
  after.forEach((row, r) => row.forEach((cell, c) => { if (cell !== null) drops.set(`${r},${c}`, -rows); }));
  return drops;
}
