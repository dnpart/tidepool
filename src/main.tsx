import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/fredoka/latin-600.css';
import '@fontsource/nunito/latin-500.css';
import '@fontsource/nunito/latin-700.css';
import './theme/global.css';
import { registerSW } from 'virtual:pwa-register';
import { App } from './app/App';
import { markUpdateReady } from './app/updates';

/** How often an open app looks for a new version, besides each time it comes back on screen. */
const CHECK_MS = 30 * 60 * 1000;

const updateSW = registerSW({
  onNeedRefresh: () => markUpdateReady(() => void updateSW(true)),
  onRegisteredSW: (_url, registration) => {
    if (!registration) return;
    const check = () => { if (navigator.onLine !== false) registration.update().catch(() => {}); };
    setInterval(check, CHECK_MS);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') check(); });
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
