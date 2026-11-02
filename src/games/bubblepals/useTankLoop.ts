// Keeps time for one tank: its piece falls a row each tick, and after a landing each chain link resolves on its own
// beat. The effect restarts only when play starts or stops or the phase changes, so sliding and turning never reset
// the fall timer. Used for your tank and, in Versus, the opponent's.
import { useEffect, useRef, type MutableRefObject } from 'react';
import { fall, resolve, type Tank } from './rules';

/** The beat after a piece lands, and between links of a chain. */
export const LAND_MS = 160;
export const LINK_MS = 520;

export function useTankLoop({ tank, tankRef, apply, running, fallMs, reduced }: {
  tank: Tank;
  tankRef: MutableRefObject<Tank>;
  apply: (next: Tank) => void;
  running: boolean;
  /** Read on every tick, so the speed can change as the game goes on. */
  fallMs: () => number;
  reduced: boolean;
}) {
  const fallRef = useRef(fallMs);
  fallRef.current = fallMs;
  const applyRef = useRef(apply);
  applyRef.current = apply;

  useEffect(() => {
    if (!running) return;
    let timer: ReturnType<typeof setTimeout>;
    const link = reduced ? LINK_MS / 2 : LINK_MS;
    const tick = () => {
      const t = tankRef.current;
      if (t.phase === 'falling') {
        applyRef.current(fall(t));
        if (tankRef.current.phase === 'falling') timer = setTimeout(tick, fallRef.current());
      } else if (t.phase === 'resolving') {
        applyRef.current(resolve(t));
        if (tankRef.current.phase === 'resolving') timer = setTimeout(tick, link);
      }
    };
    timer = setTimeout(tick, tank.phase === 'falling' ? fallRef.current() : LAND_MS);
    return () => clearTimeout(timer);
  }, [running, tank.phase, tank.dealt, tankRef, reduced]);
}
