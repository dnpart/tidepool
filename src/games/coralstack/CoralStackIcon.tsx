import { Block } from './Block';

/** A bent coral piece settling on a full row, with a little wave washing past. */
export function CoralStackIcon({ size = 40 }: { size?: number }) {
  const s = 10;
  const at = (col: number, row: number) => ({ cx: col * s + s / 2, cy: row * s + s / 2 + 1, size: s });
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <Block kind="b" {...at(1, 0)} />
      <Block kind="b" {...at(1, 1)} />
      <Block kind="b" {...at(2, 1)} />
      <Block kind="a" {...at(0, 2)} />
      <Block kind="c" {...at(1, 2)} />
      <Block kind="a" {...at(2, 2)} />
      <Block kind="c" {...at(3, 2)} />
      <path d="M2.5 36.5 q4.4 -3.6 8.8 0 t8.8 0 t8.8 0 t8.8 0" fill="none" stroke="#5FB4C8" strokeWidth={2.4} strokeLinecap="round" />
    </svg>
  );
}
