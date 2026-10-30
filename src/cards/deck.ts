export type Suit = 'hearts' | 'diamonds' | 'spades' | 'clubs';
export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;
export type Team = 'octopus' | 'manta';

export interface Card {
  suit: Suit;
  rank: Rank;
}

export const SUITS: readonly Suit[] = ['hearts', 'diamonds', 'spades', 'clubs'];
export const RANKS: readonly Rank[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

// Suit colors never change with palette, from PLAN.md "Design tokens"
export const SUIT_STYLE: Record<Suit, { team: Team; symbol: string; creature: string; tint: string; frame: string }> = {
  hearts: { team: 'octopus', symbol: '#D23F5B', creature: '#EE8C9E', tint: '#FDE6EB', frame: '#F2A9B7' },
  diamonds: { team: 'octopus', symbol: '#C8501F', creature: '#F6B07A', tint: '#FFEBDC', frame: '#F7BE96' },
  spades: { team: 'manta', symbol: '#1E3557', creature: '#7A9EB0', tint: '#E3ECF9', frame: '#A9C1E6' },
  clubs: { team: 'manta', symbol: '#1D4F4A', creature: '#6FAFA3', tint: '#DFF2EC', frame: '#9ED3C6' },
};

export const teamOf = (suit: Suit): Team => SUIT_STYLE[suit].team;

const RANK_LABELS: Record<Rank, string> = {
  1: 'A', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9', 10: '10', 11: 'J', 12: 'Q', 13: 'K',
};
const RANK_NAMES: Partial<Record<Rank, string>> = { 1: 'Ace', 11: 'Jack', 12: 'Queen', 13: 'King' };

export const rankLabel = (rank: Rank): string => RANK_LABELS[rank];

/** Screen reader name, e.g. "7 of hearts" or "Queen of spades". */
export const cardName = ({ suit, rank }: Card): string => `${RANK_NAMES[rank] ?? rank} of ${suit}`;

export const cardId = ({ suit, rank }: Card): string => `${rank}${suit[0]}`;

export function createDeck(): Card[] {
  return SUITS.flatMap((suit) => RANKS.map((rank) => ({ suit, rank })));
}

/** Fisher–Yates shuffle into a new array. Pass a seeded `random` for repeatable deals. */
export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
