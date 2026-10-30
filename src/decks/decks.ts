// Everything that differs between the two decks (PLAN.md "Decks" and "Fox + Owl card colors"), so a later deck is
// one new entry. Game rules only care about red and black teams, which both decks share.
import type { Suit } from '../cards/deck';

import type { Palette } from '../theme/tokens';

export type DeckId = 'sea' | 'arctic';
export const DECK_IDS: readonly DeckId[] = ['sea', 'arctic'];

export interface SuitColors {
  /** Pips, corner suit symbols and badges. */
  symbol: string;
  /** Corner rank text, darker than the symbol where needed for 4.5:1 (CSS var --rank-<deck>-<suit> holds it). */
  rank: string;
  /** Rank text with high contrast on, 7:1. */
  rankHigh: string;
  /** The big suit symbol behind an Ace's creature. */
  ace: { color: string; opacity: number };
  /** Face card background and suit buddy circles. */
  tint: string;
  /** Face card inner frame. */
  frame: string;
  /** Sea deck creature body color (the Fox + Owl art carries its own colors). */
  creature: string;
}

export interface DeckStyle {
  name: string;
  blurb: string;
  /** Lowercase names used in the games' wording, e.g. "The fox won this one". */
  names: { opponent: string; dealer: string; friends: string };
  /** Number card and Ace background, and the card edge. */
  face: string;
  border: string;
  suits: Record<Suit, SuitColors>;
}

export const DECKS: Record<DeckId, DeckStyle> = {
  sea: {
    name: 'Octo + Manta',
    blurb: 'Octopuses and manta rays',
    names: { opponent: 'octopus', dealer: 'King manta', friends: 'sea friends' },
    face: '#FFFDF8',
    border: '#DDD5C4',
    suits: {
      hearts: {
        symbol: '#D23F5B', rank: '#BF3953', rankHigh: '#8B2A3C', ace: { color: '#EE8C9E', opacity: 0.3 },
        tint: '#FDE6EB', frame: '#F2A9B7', creature: '#EE8C9E',
      },
      diamonds: {
        symbol: '#C8501F', rank: '#B84A1D', rankHigh: '#883615', ace: { color: '#F6B07A', opacity: 0.3 },
        tint: '#FFEBDC', frame: '#F7BE96', creature: '#F6B07A',
      },
      spades: {
        symbol: '#1E3557', rank: '#1E3557', rankHigh: '#1E3557', ace: { color: '#7A9EB0', opacity: 0.3 },
        tint: '#E3ECF9', frame: '#A9C1E6', creature: '#7A9EB0',
      },
      clubs: {
        symbol: '#1D4F4A', rank: '#1D4F4A', rankHigh: '#1D4F4A', ace: { color: '#6FAFA3', opacity: 0.3 },
        tint: '#DFF2EC', frame: '#9ED3C6', creature: '#6FAFA3',
      },
    },
  },
  arctic: {
    name: 'Fox + Owl',
    blurb: 'Arctic foxes and snowy owls',
    names: { opponent: 'fox', dealer: 'King owl', friends: 'snow friends' },
    face: '#FBFCFE',
    border: '#C9D6E4',
    suits: {
      hearts: {
        symbol: '#B5294A', rank: '#9E2341', rankHigh: '#7E1A33', ace: { color: '#EE8C9E', opacity: 0.3 },
        tint: '#F7D3DC', frame: '#E07C93', creature: '#EE8C9E',
      },
      diamonds: {
        symbol: '#B8461A', rank: '#9C3A12', rankHigh: '#7A2C0B', ace: { color: '#F6B07A', opacity: 0.3 },
        tint: '#FADBC2', frame: '#E39A5E', creature: '#F6B07A',
      },
      spades: {
        symbol: '#1E3557', rank: '#1E3557', rankHigh: '#0E1C36', ace: { color: '#9DB6E2', opacity: 1 },
        tint: '#9DB6E2', frame: '#4E6BA3', creature: '#5873A6',
      },
      clubs: {
        symbol: '#1D4F4A', rank: '#1D4F4A', rankHigh: '#0A2420', ace: { color: '#94C8B6', opacity: 1 },
        tint: '#94C8B6', frame: '#3F7A73', creature: '#3F7A73',
      },
    },
  },
};

export type CardBackStyle = 'starry' | 'tide' | 'garden' | 'aurora' | 'knit' | 'snowfall';

/** Each deck has one card back per palette (PLAN.md "Card backs follow the palette"). */
export const CARD_BACKS: Record<DeckId, Record<Palette, CardBackStyle>> = {
  sea: { lagoon: 'tide', coral: 'garden', winter: 'starry' },
  arctic: { lagoon: 'aurora', coral: 'knit', winter: 'snowfall' },
};

export const CARD_BACK_NAMES: Record<CardBackStyle, string> = {
  starry: 'Starry sea', tide: 'Night tide', garden: 'Coral garden',
  aurora: 'Northern lights', knit: 'Winter knit', snowfall: 'Snowfall',
};

/** CSS variables for rank text, set on <html> by ThemeProvider for both decks, so any card can read its own. */
export function rankVariables(highContrast: boolean): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const deck of DECK_IDS) {
    for (const [suit, c] of Object.entries(DECKS[deck].suits)) {
      vars[`--rank-${deck}-${suit}`] = highContrast ? c.rankHigh : c.rank;
    }
  }
  return vars;
}

/** "octopus" -> "Octopus", for names at the start of a sentence or label. */
export const capitalize = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);
