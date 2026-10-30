import { useEffect, useMemo, useState } from 'react';
import { Cloud } from '../art/Cloud';
import { Crystal } from '../art/Crystal';
import { useSettings } from '../settings/SettingsContext';
import { useReducedMotion } from '../theme/ThemeProvider';
import { skyFor } from '../theme/tokens';
import { CRYSTALS, makeClouds, makeSnow, makeStars } from './stars';
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

/** The palette's sky: clouds by day and stars by night, or Winter's snow. Sits behind every screen and never takes taps. */
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
    </div>
  );
}
