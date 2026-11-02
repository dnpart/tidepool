// Finger gestures on a falling-block tank: drag sideways to slide the piece a column per cell width, tap to turn it,
// flick down to drop it. The buttons do the same things.
import { useRef, type PointerEvent as ReactPointerEvent } from 'react';

interface Options {
  /** Width of one column on screen, in px. */
  cellPx: number;
  enabled: boolean;
  onSlide: (dx: -1 | 1) => void;
  onTurn: () => void;
  onDrop: () => void;
}

const TAP_PX = 10;
const TAP_MS = 400;
const FLICK_PX = 48;

export function useTankGestures({ cellPx, enabled, onSlide, onTurn, onDrop }: Options) {
  const drag = useRef<{ id: number; x0: number; y0: number; anchor: number; t0: number; slid: boolean } | null>(null);

  const onPointerDown = (e: ReactPointerEvent<HTMLElement>) => {
    if (!enabled || e.button > 0) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    drag.current = { id: e.pointerId, x0: e.clientX, y0: e.clientY, anchor: e.clientX, t0: e.timeStamp, slid: false };
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId || !enabled) return;
    // Mostly downward movement is a flick on the way; don't slide for it
    if (e.clientY - d.y0 > Math.abs(e.clientX - d.x0) * 1.5 && e.clientY - d.y0 > TAP_PX) return;
    const step = Math.max(18, cellPx * 0.8);
    while (e.clientX - d.anchor >= step) { d.anchor += step; d.slid = true; onSlide(1); }
    while (d.anchor - e.clientX >= step) { d.anchor -= step; d.slid = true; onSlide(-1); }
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLElement>) => {
    const d = drag.current;
    drag.current = null;
    if (!d || d.id !== e.pointerId || !enabled) return;
    const dx = e.clientX - d.x0, dy = e.clientY - d.y0;
    if (dy > FLICK_PX && dy > Math.abs(dx) * 1.5) onDrop();
    else if (!d.slid && Math.hypot(dx, dy) < TAP_PX && e.timeStamp - d.t0 < TAP_MS) onTurn();
  };

  const onPointerCancel = () => {
    drag.current = null;
  };

  return { onPointerDown, onPointerMove, onPointerUp, onPointerCancel };
}
