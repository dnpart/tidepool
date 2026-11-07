import { lazy, Suspense } from 'react';
import { findGame } from '../games/registry';
import { About } from '../screens/About';
import { Feedback } from '../screens/Feedback';
import { Gallery } from '../screens/Gallery';
import { Home } from '../screens/Home';
import { WhatsNew } from '../screens/WhatsNew';
import { SettingsProvider } from '../settings/SettingsContext';
import { SettingsScreen } from '../settings/SettingsScreen';
import { SkyBackground } from '../sky/SkyBackground';
import { useTapSounds } from '../sound/useTapSounds';
import { ThemeProvider } from '../theme/ThemeProvider';
import { useRoute } from './router';

// The two-phone page brings QR code libraries, so it loads only when opened (it is still saved for offline use)
// The art sheet is only for exporting the art (scripts/export-art.mjs)
const ArtSheet = lazy(() => import('../screens/ArtSheet').then((m) => ({ default: m.ArtSheet })));
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
    case 'art':
      return (
        <Suspense fallback={null}>
          <ArtSheet />
        </Suspense>
      );
    case 'about':
      return <About fromHome={route.from === 'home'} />;
    case 'feedback':
      return <Feedback fromHome={route.from === 'home'} />;
    case 'whatsNew':
      return <WhatsNew fromHome={route.from === 'home'} />;
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
