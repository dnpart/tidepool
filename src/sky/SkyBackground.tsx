import { useEffect, useMemo, useState } from 'react';
import { Cloud } from '../art/Cloud';
import { useSettings } from '../settings/SettingsContext';
import { useReducedMotion } from '../theme/ThemeProvider';
import { makeClouds, makeStars } from './stars';
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

/** Drifting clouds in light mode, expanding stars in dark mode. Sits behind every screen and never takes taps. */
export function SkyBackground() {
  const dark = useSettings().settings.mode === 'dark';
  const reduced = useReducedMotion();
  const visible = usePageVisible();
  // Layout comes from the size at launch, so it stays stable while the app is open
  const stars = useMemo(() => makeStars(window.innerWidth, window.innerHeight), []);
  const clouds = useMemo(() => makeClouds(), []);
  const paused = reduced || !visible;

  return (
    <div className={styles.sky} data-reduced={reduced} aria-hidden="true">
      <div className={styles.layer} data-active={!dark} data-paused={paused || dark}>
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
      <div className={styles.layer} data-active={dark} data-paused={paused || !dark}>
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
    </div>
  );
}
