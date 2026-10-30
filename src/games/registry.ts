import type { ComponentType } from 'react';
import type { DeckStyle } from '../decks/decks';
import { BlackjackIcon } from './blackjack/BlackjackIcon';
import { BlackjackScreen } from './blackjack/BlackjackScreen';
import { PairsIcon } from './pairs/PairsIcon';
import { PairsScreen } from './pairs/PairsScreen';
import { SolitaireIcon } from './solitaire/SolitaireIcon';
import { SolitaireScreen } from './solitaire/SolitaireScreen';
import { SpeedIcon } from './speed/SpeedIcon';
import { SpeedScreen } from './speed/SpeedScreen';

export interface GameEntry {
  id: string;
  title: string;
  /** One line on Home; the deck supplies character names. */
  description: (deck: DeckStyle) => string;
  icon: ComponentType<{ size?: number }>;
  component: ComponentType;
}

// Adding a game: a new folder in games/ and one entry here.
export const GAMES: GameEntry[] = [
  {
    id: 'solitaire',
    title: 'Solitaire',
    description: () => 'Klondike, at your own pace',
    icon: SolitaireIcon,
    component: SolitaireScreen,
  },
  {
    id: 'speed',
    title: 'Speed',
    description: (d) => `A quick race against the ${d.names.opponent}`,
    icon: SpeedIcon,
    component: SpeedScreen,
  },
  {
    id: 'pairs',
    title: 'Tide Pairs',
    description: (d) => `Find the matching ${d.names.friends}`,
    icon: PairsIcon,
    component: PairsScreen,
  },
  {
    id: 'blackjack',
    title: 'Blackjack',
    description: (d) => `Get to 21 while the ${d.names.dealer} deals`,
    icon: BlackjackIcon,
    component: BlackjackScreen,
  },
];

export const findGame = (id: string): GameEntry | undefined => GAMES.find((g) => g.id === id);
