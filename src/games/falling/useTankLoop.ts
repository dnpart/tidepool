// Keeps time for one tank of a falling-block game: its piece falls a row each tick, and after a landing each step
// (a chain link, a wave) resolves on its own beat. The effect restarts only when play starts or stops or the phase
// changes, so sliding and turning never reset the fall timer. Used for your tank and, in Versus, the opponent's.
import { useEffect, useRef, type MutableRefObject } from 'react';

/** The beat after a piece lands, and between links of a chain. */
export const LAND_MS = 160;
export const LINK_MS = 520;

/** What the loop needs from a game's tank. */
export interface LoopTank {
  phase: 'falling' | 'resolving' | 'over';
  /** Pieces dealt so far: a new piece restarts the fall timer. */
  dealt: number;
}

export function useTankLoop<T extends LoopTank>({ tank, tankRef, apply, running, fallMs, reduced, fall, resolve }: {
  tank: T;
  tankRef: MutableRefObject<T>;
  apply: (next: T) => void;
  running: boolean;
  /** Read on every tick, so the speed can change as the game goes on. */
  fallMs: () => number;
  reduced: boolean;
  /** The game's own rules: one row down, and one step after a landing. */
  fall: (t: T) => T;
  resolve: (t: T) => T;
}) {
  const fallRef = useRef(fallMs);
  fallRef.current = fallMs;
  const applyRef = useRef(apply);
  applyRef.current = apply;
  const rules = useRef({ fall, resolve });
  rules.current = { fall, resolve };

  useEffect(() => {
    if (!running) return;
    let timer: ReturnType<typeof setTimeout>;
    const link = reduced ? LINK_MS / 2 : LINK_MS;
    const tick = () => {
      const t = tankRef.current;
      if (t.phase === 'falling') {
        applyRef.current(rules.current.fall(t));
        if (tankRef.current.phase === 'falling') timer = setTimeout(tick, fallRef.current());
      } else if (t.phase === 'resolving') {
        applyRef.current(rules.current.resolve(t));
        if (tankRef.current.phase === 'resolving') timer = setTimeout(tick, link);
      }
    };
    timer = setTimeout(tick, tank.phase === 'falling' ? fallRef.current() : LAND_MS);
    return () => clearTimeout(timer);
  }, [running, tank.phase, tank.dealt, tankRef, reduced]);
}
