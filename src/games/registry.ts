import type { ComponentType } from 'react';
import type { DeckStyle } from '../decks/decks';
import { BlackjackIcon } from './blackjack/BlackjackIcon';
import { BubblePalsIcon } from './bubblepals/BubblePalsIcon';
import { BubblePalsScreen } from './bubblepals/BubblePalsScreen';
import { BlackjackScreen } from './blackjack/BlackjackScreen';
import { CheckersIcon } from './checkers/CheckersIcon';
import { CheckersScreen } from './checkers/CheckersScreen';
import { CoralStackIcon } from './coralstack/CoralStackIcon';
import { CoralStackScreen } from './coralstack/CoralStackScreen';
import { FishyIcon } from './fishy/FishyIcon';
import { FishyScreen } from './fishy/FishyScreen';
import { DominoesIcon } from './dominoes/DominoesIcon';
import { DominoesScreen } from './dominoes/DominoesScreen';
import { PondHopIcon } from './pondhop/PondHopIcon';
import { PondHopScreen } from './pondhop/PondHopScreen';
import { PairsIcon } from './pairs/PairsIcon';
import { PairsScreen } from './pairs/PairsScreen';
import { SolitaireIcon } from './solitaire/SolitaireIcon';
import { SolitaireScreen } from './solitaire/SolitaireScreen';
import { SpeedIcon } from './speed/SpeedIcon';
import { SpeedScreen } from './speed/SpeedScreen';
import { TideSwapIcon } from './tideswap/TideSwapIcon';
import { TideSwapScreen } from './tideswap/TideSwapScreen';

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
    id: 'fishy',
    title: 'Fishy',
    description: () => 'Bluff your cards away, or call a fib',
    icon: FishyIcon,
    component: FishyScreen,
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
  {
    id: 'dominoes',
    title: 'Dominoes',
    description: () => 'Match the ends and play out your tiles',
    icon: DominoesIcon,
    component: DominoesScreen,
  },
  {
    id: 'pondhop',
    title: 'Pond Hop',
    description: () => 'Race your marbles round the pond',
    icon: PondHopIcon,
    component: PondHopScreen,
  },
  {
    id: 'bubblepals',
    title: 'Bubble Pals',
    description: () => 'Pop four of a kind and set off chains',
    icon: BubblePalsIcon,
    component: BubblePalsScreen,
  },
  {
    id: 'coralstack',
    title: 'Coral Stack',
    description: () => 'Fill rows and let the sand sink',
    icon: CoralStackIcon,
    component: CoralStackScreen,
  },
  {
    id: 'tideswap',
    title: 'Tide Swap',
    description: () => 'Swap columns so friends land on their twins',
    icon: TideSwapIcon,
    component: TideSwapScreen,
  },
  {
    id: 'checkers',
    title: 'Checkers',
    description: (d) => `Jump your way past the ${d.names.opponent}`,
    icon: CheckersIcon,
    component: CheckersScreen,
  },
];

export const findGame = (id: string): GameEntry | undefined => GAMES.find((g) => g.id === id);
