// The tide at the end of a Solo level (Nov 7): water rises from the bottom of the columns over what's left, its crest
// rolling sideways, then pulls back down taking the pieces with it (the board's `wash` effects, timed to it), leaving
// foam that fades. The crest and foam are stand-ins in art/WaterLife.tsx until the owner's drawings come back.
import { useId } from 'react';
import { TIDE_WATER, TideCrest, TideFoam } from '../../art/WaterLife';
import styles from './TideSwap.module.css';

/** The whole tide, in ms: up, a moment at the top, and back down. The wash effects start as it turns back. */
export const TIDE_MS = 1500;
/** When the water turns back and starts pulling the pieces down. */
export const TIDE_TURN_MS = 650;
/** One crest tile: the drawings are 80 × 40, shown 64 × 32. */
const TILE_W = 64;
const TILE_H = 32;

function Strip({ width, art }: { width: number; art: 'crest' | 'foam' }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg width={width} height={TILE_H} aria-hidden="true" style={{ display: 'block' }}>
      <defs>
        <pattern id={`tide${id}`} width={TILE_W} height={TILE_H} patternUnits="userSpaceOnUse">
          <g transform={`scale(${TILE_W / 80})`}>{art === 'crest' ? <TideCrest /> : <TideFoam />}</g>
        </pattern>
      </defs>
      <rect width={width} height={TILE_H} fill={`url(#tide${id})`} />
    </svg>
  );
}

/**
 * `peak` is how far down from the board's top the crest's top reaches (just over the tallest stack); the water starts
 * and ends below the board.
 */
export function Tide({ width, height, peak }: { width: number; height: number; peak: number }) {
  const vars = {
    '--below': `${height + 4}px`,
    '--peak': `${peak}px`,
  } as React.CSSProperties;
  return (
    <div className={styles.tide} style={{ ...vars, width, height }} aria-hidden="true">
      <div className={styles.tideWater} style={{ width }}>
        {/* the crest is a tile wider than the board, so it can roll sideways as it comes */}
        <div className={styles.tideCrest}><Strip width={width + TILE_W} art="crest" /></div>
        <div className={styles.tideBody} style={{ background: TIDE_WATER, height }} />
      </div>
      <div className={styles.tideFoam} style={{ top: peak + TILE_H * 0.4 }}><Strip width={width} art="foam" /></div>
    </div>
  );
}
