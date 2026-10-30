import type { ComponentType } from 'react';
import { PairsIcon } from './pairs/PairsIcon';
import { PairsScreen } from './pairs/PairsScreen';
import { SolitaireIcon } from './solitaire/SolitaireIcon';
import { SolitaireScreen } from './solitaire/SolitaireScreen';
import { SpeedIcon } from './speed/SpeedIcon';
import { SpeedScreen } from './speed/SpeedScreen';

export interface GameEntry {
  id: string;
  title: string;
  description: string;
  icon: ComponentType<{ size?: number }>;
  component: ComponentType;
}

// Adding a game: a new folder in games/ and one entry here.
export const GAMES: GameEntry[] = [
  {
    id: 'solitaire',
    title: 'Solitaire',
    description: 'Klondike, at your own pace',
    icon: SolitaireIcon,
    component: SolitaireScreen,
  },
  {
    id: 'speed',
    title: 'Speed',
    description: 'A quick race against the octopus',
    icon: SpeedIcon,
    component: SpeedScreen,
  },
  {
    id: 'pairs',
    title: 'Tide Pairs',
    description: 'Find the matching sea friends',
    icon: PairsIcon,
    component: PairsScreen,
  },
];

export const findGame = (id: string): GameEntry | undefined => GAMES.find((g) => g.id === id);
