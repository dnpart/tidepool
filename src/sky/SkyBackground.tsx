import { useEffect, useMemo, useState } from 'react';
import { Cloud } from '../art/Cloud';
import { Crystal } from '../art/Crystal';
import { shade } from '../art/color';
import { useSettings } from '../settings/SettingsContext';
import { useReducedMotion } from '../theme/ThemeProvider';
import { skyFor } from '../theme/tokens';
import {
  COMB_CLUSTERS, CRYSTALS, hexPath, layoutCluster, makeClouds, makeFireflies, makeLeaves, makePollen, makeSnow, makeStars,
  makeStillStars, type CombCluster,
} from './stars';
import styles from './Sky.module.css';

function usePageVisible(): boolean {
  const [visible, setVisible] = useState(() => document.visibilityState !== 'hidden');
  useEffect(() => {
    const onChange = () => setVisible(document.visibilityState !== 'hidden');
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, []);
  return visible;
}

function SnowLayer({ mode, active, paused }: { mode: 'light' | 'dark'; active: boolean; paused: boolean }) {
  const flakes = useMemo(() => makeSnow(mode), [mode]);
  return (
    <div className={styles.layer} data-active={active} data-paused={paused || !active} data-snow={mode}>
      {flakes.map((f, i) => (
        <div
          key={i}
          className={styles.flake}
          style={{ left: `${f.left * 100}%`, animationDuration: `${f.duration}s`, animationDelay: `${f.delay}s` }}
        >
          <span className={styles.sway} style={{ animationDuration: `${f.sway}s` }}>
            <span className={styles.dot} style={{ width: f.size, height: f.size, opacity: f.opacity }} />
          </span>
        </div>
      ))}
      {CRYSTALS[mode].map((c, i) => (
        <div
          key={`c${i}`}
          className={styles.crystal}
          style={{ left: `${c.left * 100}%`, animationDuration: `${c.duration}s`, animationDelay: `${c.delay}s` }}
        >
          <Crystal size={c.size} />
        </div>
      ))}
    </div>
  );
}

function Cluster({ cluster }: { cluster: CombCluster }) {
  const { centers, width, height } = layoutCluster(cluster);
  const { top, left, right, half } = cluster.place;
  const shift = half === 'right' ? 'translateX(50%)' : half === 'left' ? 'translateX(-50%)' : undefined;
  return (
    <svg className={styles.comb} width={width} height={height} style={{ top, left, right, transform: shift }}>
      {centers.map(([x, y], i) => {
        const filled = cluster.filled.includes(i);
        return (
          <path
            key={i}
            d={hexPath(x, y, cluster.r - 2)}
            className={filled ? styles.honeyCell : undefined}
            fill={filled ? 'var(--honey)' : 'none'}
            stroke="var(--comb)"
            strokeWidth={1.6}
          />
        );
      })}
    </svg>
  );
}

/** Honeycomb: still cells with a few filled with honey, and pollen rising slowly. */
function CombLayer({ mode, active, paused }: { mode: 'light' | 'dark'; active: boolean; paused: boolean }) {
  const pollen = useMemo(() => makePollen(mode), [mode]);
  return (
    <div className={styles.layer} data-active={active} data-paused={paused || !active} data-comb={mode}>
      {COMB_CLUSTERS.map((c, i) => <Cluster key={i} cluster={c} />)}
      {pollen.map((p, i) => (
        <div
          key={i}
          className={styles.pollen}
          style={{ left: `${p.left * 100}%`, animationDuration: `${p.duration}s`, animationDelay: `${p.delay}s` }}
        >
          <span className={styles.pollenSway} style={{ animationDuration: `${p.sway}s` }}>
            <span className={styles.speck} style={{ width: p.size, height: p.size, opacity: p.opacity }} />
          </span>
        </div>
      ))}
    </div>
  );
}

/** Forest by day: leaves drifting down, tipping side to side as they sway. */
function LeafLayer({ active, paused }: { active: boolean; paused: boolean }) {
  const leaves = useMemo(() => makeLeaves(), []);
  return (
    <div className={styles.layer} data-active={active} data-paused={paused || !active}>
      {leaves.map((l, i) => (
        <div
          key={i}
          className={styles.leaf}
          style={{ left: `${l.left * 100}%`, animationDuration: `${l.duration}s`, animationDelay: `${l.delay}s` }}
        >
          <span className={styles.leafSway} style={{ animationDuration: `${l.sway}s` }}>
            <svg width={(l.size * 2) / 3} height={l.size} viewBox="-5 -7.5 10 15">
              <path d="M0 -7 C5 -4 5 4 0 8 C-5 4 -5 -4 0 -7 Z" fill={l.color} />
              <path d="M0 -6 L0 7" stroke={shade(l.color, 0.78)} strokeWidth={0.9} />
            </svg>
          </span>
        </div>
      ))}
    </div>
  );
}

/** Forest by night: fireflies wandering and blinking under a few faint, still stars. */
function FireflyLayer({ active, paused }: { active: boolean; paused: boolean }) {
  const flies = useMemo(() => makeFireflies(), []);
  const stars = useMemo(() => makeStillStars(), []);
  return (
    <div className={styles.layer} data-active={active} data-paused={paused || !active}>
      {stars.map((s, i) => (
        <span
          key={`s${i}`}
          className={styles.stillStar}
          style={{ left: `${s.left * 100}%`, top: `${s.top * 100}%`, width: s.size, height: s.size, opacity: s.opacity }}
        />
      ))}
      {flies.map((f, i) => (
        <div
          key={i}
          className={styles.firefly}
          style={{
            left: `${f.left * 100}%`,
            top: `${f.top * 100}%`,
            animationDuration: `${f.wander}s`,
            ['--dx' as string]: `${f.dx}px`,
            ['--dy' as string]: `${f.dy}px`,
          }}
        >
          <span
            className={styles.glow}
            style={{ width: f.size, height: f.size, animationDuration: `${f.blink}s`, animationDelay: `${f.delay}s` }}
          />
        </div>
      ))}
    </div>
  );
}

/** The palette's sky: clouds by day and stars by night, Winter's snow, Honeycomb's cells and pollen, or Forest's leaves and fireflies. Sits behind every screen and never takes taps. */
export function SkyBackground() {
  const { palette, mode } = useSettings().settings;
  const sky = skyFor(palette, mode);
  const reduced = useReducedMotion();
  const visible = usePageVisible();
  // Layout comes from the size at launch, so it stays stable while the app is open
  const stars = useMemo(() => makeStars(window.innerWidth, window.innerHeight), []);
  const clouds = useMemo(() => makeClouds(), []);
  const paused = reduced || !visible;

  return (
    <div className={styles.sky} data-reduced={reduced} aria-hidden="true">
      <div className={styles.layer} data-active={sky === 'clouds'} data-paused={paused || sky !== 'clouds'}>
        {clouds.map((c, i) => (
          <div
            key={i}
            className={styles.cloud}
            style={{
              top: `${c.top * 100}%`,
              opacity: c.opacity,
              animationDuration: `${c.duration}s`,
              animationDelay: `${c.delay}s`,
            }}
          >
            <Cloud width={c.width} />
          </div>
        ))}
      </div>
      <div className={styles.layer} data-active={sky === 'stars'} data-paused={paused || sky !== 'stars'}>
        {stars.map((s, i) => (
          <div
            key={i}
            className={styles.starSpot}
            style={{ transform: `translate(${s.x}px, ${s.y}px)`, opacity: s.brightness }}
          >
            <div
              className={styles.star}
              style={{
                width: s.size,
                height: s.size,
                animationDuration: `${s.duration}s`,
                animationDelay: `${s.delay}s`,
                ['--dx' as string]: `${s.dx}px`,
                ['--dy' as string]: `${s.dy}px`,
              }}
            />
          </div>
        ))}
      </div>
      <SnowLayer mode="light" active={sky === 'snow' && mode === 'light'} paused={paused} />
      <SnowLayer mode="dark" active={sky === 'snow' && mode === 'dark'} paused={paused} />
      <CombLayer mode="light" active={sky === 'comb' && mode === 'light'} paused={paused} />
      <CombLayer mode="dark" active={sky === 'comb' && mode === 'dark'} paused={paused} />
      <LeafLayer active={sky === 'leaves'} paused={paused} />
      <FireflyLayer active={sky === 'fireflies'} paused={paused} />
    </div>
  );
}
