import { lazy, Suspense } from 'react';
import { findGame } from '../games/registry';
import { Gallery } from '../screens/Gallery';
import { Home } from '../screens/Home';
import { SettingsProvider } from '../settings/SettingsContext';
import { SettingsScreen } from '../settings/SettingsScreen';
import { SkyBackground } from '../sky/SkyBackground';
import { useTapSounds } from '../sound/useTapSounds';
import { ThemeProvider } from '../theme/ThemeProvider';
import { useRoute } from './router';

// The two-phone page brings QR code libraries, so it loads only when opened (it is still saved for offline use)
const TogetherScreen = lazy(() => import('../together/TogetherScreen').then((m) => ({ default: m.TogetherScreen })));

function Screens() {
  const route = useRoute();
  useTapSounds();
  switch (route.name) {
    case 'home':
      return <Home />;
    case 'settings':
      return <SettingsScreen />;
    case 'gallery':
      return <Gallery />;
    case 'together':
      return (
        <Suspense fallback={null}>
          <TogetherScreen />
        </Suspense>
      );
    case 'play': {
      const game = findGame(route.gameId);
      if (!game) return <Home />;
      const Game = game.component;
      return <Game />;
    }
  }
}

export function App() {
  return (
    <SettingsProvider>
      <ThemeProvider>
        <SkyBackground />
        <Screens />
      </ThemeProvider>
    </SettingsProvider>
  );
}
