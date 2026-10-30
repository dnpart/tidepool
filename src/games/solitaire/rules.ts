// Klondike rules as pure functions (PLAN.md "Game 1: Solitaire"). Nothing here mutates its input.
import { createDeck, shuffle, SUITS, teamOf, type Card, type Suit } from '../../cards/deck';

export interface Column {
  /** Face-down cards, bottom first. */
  down: Card[];
  /** Face-up run on top of them, bottom first. */
  up: Card[];
}

export interface Board {
  /** Face down; the last card is the top. */
  stock: Card[];
  /** Face up; the last card is the top. */
  waste: Card[];
  /** One pile per suit, in FOUNDATION_SUITS order, Ace first. */
  foundations: Card[][];
  tableau: Column[];
}

export type DrawCount = 1 | 3;

export interface Solitaire {
  board: Board;
  drawCount: DrawCount;
  moves: number;
  /** Earlier positions, newest last, for unlimited undo. */
  history: { board: Board; moves: number }[];
}

/** Each foundation slot holds one suit, so empty slots can show a faint suit outline. */
export const FOUNDATION_SUITS: readonly Suit[] = SUITS;
export const foundationIndex = (suit: Suit): number => FOUNDATION_SUITS.indexOf(suit);

export type Source =
  | { pile: 'waste' }
  | { pile: 'foundation'; index: number }
  /** `cardIndex` is the position in the column's face-up run where the moved cards start. */
  | { pile: 'tableau'; index: number; cardIndex: number };

export type Target = { pile: 'foundation'; index: number } | { pile: 'tableau'; index: number };

export type Move = { type: 'draw' } | { type: 'move'; from: Source; to: Target };

const top = <T>(cards: readonly T[]): T | undefined => cards[cards.length - 1];

// --- dealing ---

export function deal(random: () => number = Math.random, drawCount: DrawCount = 1): Solitaire {
  const deck = shuffle(createDeck(), random);
  const tableau: Column[] = [];
  let next = 0;
  for (let i = 0; i < 7; i++) {
    const cards = deck.slice(next, next + i + 1);
    next += i + 1;
    tableau.push({ down: cards.slice(0, -1), up: cards.slice(-1) });
  }
  return {
    board: { stock: deck.slice(next), waste: [], foundations: FOUNDATION_SUITS.map(() => []), tableau },
    drawCount,
    moves: 0,
    history: [],
  };
}

// --- legality ---

/** Tableau builds down in alternating team: octopus on manta, manta on octopus. Only a King fills an empty column. */
export function canStackOnTableau(card: Card, column: Column): boolean {
  const target = top(column.up);
  if (!target) return column.down.length === 0 && card.rank === 13;
  return target.rank === card.rank + 1 && teamOf(target.suit) !== teamOf(card.suit);
}

/** Foundations build up by suit from Ace to King. */
export function canPlaceOnFoundation(card: Card, foundation: readonly Card[], index: number): boolean {
  return card.suit === FOUNDATION_SUITS[index] && card.rank === foundation.length + 1;
}

/** The cards a source would pick up, bottom first, or [] if nothing can be picked up there. */
export function pickUp(board: Board, from: Source): Card[] {
  switch (from.pile) {
    case 'waste': {
      const card = top(board.waste);
      return card ? [card] : [];
    }
    case 'foundation': {
      const card = top(board.foundations[from.index] ?? []);
      return card ? [card] : [];
    }
    case 'tableau': {
      const column = board.tableau[from.index];
      if (!column || from.cardIndex < 0 || from.cardIndex >= column.up.length) return [];
      return column.up.slice(from.cardIndex);
    }
  }
}

const sameSpot = (from: Source, to: Target) =>
  from.pile === to.pile && 'index' in from && from.index === to.index;

export function isLegal(board: Board, from: Source, to: Target): boolean {
  const cards = pickUp(board, from);
  if (cards.length === 0 || sameSpot(from, to)) return false;
  if (to.pile === 'foundation') {
    const foundation = board.foundations[to.index];
    return !!foundation && cards.length === 1 && canPlaceOnFoundation(cards[0], foundation, to.index);
  }
  const column = board.tableau[to.index];
  return !!column && canStackOnTableau(cards[0], column);
}

/** Every legal destination for a source, foundations first. */
export function legalTargets(board: Board, from: Source): Target[] {
  const targets: Target[] = [
    ...board.foundations.map((_, index) => ({ pile: 'foundation', index }) as const),
    ...board.tableau.map((_, index) => ({ pile: 'tableau', index }) as const),
  ];
  return targets.filter((to) => isLegal(board, from, to));
}

// --- applying moves ---

function withHistory(game: Solitaire, board: Board): Solitaire {
  return {
    ...game,
    board,
    moves: game.moves + 1,
    history: [...game.history, { board: game.board, moves: game.moves }],
  };
}

/** A face-down card flips automatically when uncovered. */
function settle(column: Column): Column {
  if (column.up.length > 0 || column.down.length === 0) return column;
  return { down: column.down.slice(0, -1), up: column.down.slice(-1) };
}

/** Draws from the stock to the waste, or recycles the waste when the stock is empty. Null if both are empty. */
export function draw(game: Solitaire): Solitaire | null {
  const { stock, waste } = game.board;
  if (stock.length === 0) {
    if (waste.length === 0) return null;
    return withHistory(game, { ...game.board, stock: [...waste].reverse(), waste: [] });
  }
  const count = Math.min(game.drawCount, stock.length);
  const drawn = stock.slice(-count).reverse();
  return withHistory(game, { ...game.board, stock: stock.slice(0, -count), waste: [...waste, ...drawn] });
}

/** Moves cards if legal; returns null for an illegal move. */
export function moveCards(game: Solitaire, from: Source, to: Target): Solitaire | null {
  const { board } = game;
  if (!isLegal(board, from, to)) return null;
  const cards = pickUp(board, from);

  let waste = board.waste;
  let foundations = board.foundations;
  let tableau = board.tableau;

  if (from.pile === 'waste') waste = waste.slice(0, -1);
  if (from.pile === 'foundation') {
    foundations = foundations.map((f, i) => (i === from.index ? f.slice(0, -1) : f));
  }
  if (from.pile === 'tableau') {
    tableau = tableau.map((col, i) => (i === from.index ? settle({ down: col.down, up: col.up.slice(0, from.cardIndex) }) : col));
  }

  if (to.pile === 'foundation') {
    foundations = foundations.map((f, i) => (i === to.index ? [...f, ...cards] : f));
  } else {
    tableau = tableau.map((col, i) => (i === to.index ? { down: col.down, up: [...col.up, ...cards] } : col));
  }

  return withHistory(game, { stock: board.stock, waste, foundations, tableau });
}

export function applyMove(game: Solitaire, move: Move): Solitaire | null {
  return move.type === 'draw' ? draw(game) : moveCards(game, move.from, move.to);
}

/** Steps back one move. Null when there is nothing to undo. */
export function undo(game: Solitaire): Solitaire | null {
  const previous = top(game.history);
  if (!previous) return null;
  return { ...game, board: previous.board, moves: previous.moves, history: game.history.slice(0, -1) };
}

export function setDrawCount(game: Solitaire, drawCount: DrawCount): Solitaire {
  return { ...game, drawCount };
}

// --- helpers for tap-to-move, hints and finishing ---

/** Where a tap sends a card: a foundation first, then a tableau column (one with cards before an empty one). */
export function autoMoveTarget(board: Board, from: Source): Target | null {
  const targets = legalTargets(board, from);
  const foundation = targets.find((t) => t.pile === 'foundation');
  if (foundation) return foundation;
  const tableau = targets.filter((t) => t.pile === 'tableau');
  return tableau.find((t) => board.tableau[t.index].up.length > 0) ?? tableau[0] ?? null;
}

/** Where a double-tap sends a card: foundations only. */
export function foundationTarget(board: Board, from: Source): Target | null {
  return legalTargets(board, from).find((t) => t.pile === 'foundation') ?? null;
}

/** Every top card that could be tapped: the waste top and each column's face-up cards. */
function sources(board: Board): Source[] {
  const list: Source[] = [];
  if (board.waste.length) list.push({ pile: 'waste' });
  board.tableau.forEach((col, index) => col.up.forEach((_, cardIndex) => list.push({ pile: 'tableau', index, cardIndex })));
  return list;
}

const topSources = (board: Board): Source[] =>
  sources(board).filter((s) => s.pile !== 'tableau' || s.cardIndex === board.tableau[s.index].up.length - 1);

/** A helpful next move, or null when the game is stuck. */
export function hint(board: Board): Move | null {
  // 1. Anything up to a foundation
  for (const from of topSources(board)) {
    const to = foundationTarget(board, from);
    if (to) return { type: 'move', from, to };
  }
  // 2. A tableau run that uncovers a face-down card, most face-down cards first
  const reveals = board.tableau
    .map((col, index) => ({ col, index }))
    .filter(({ col }) => col.up.length > 0 && col.down.length > 0)
    .sort((a, b) => b.col.down.length - a.col.down.length);
  for (const { index } of reveals) {
    const from: Source = { pile: 'tableau', index, cardIndex: 0 };
    const to = legalTargets(board, from).find((t) => t.pile === 'tableau');
    if (to) return { type: 'move', from, to };
  }
  // 3. The waste card onto the tableau
  if (board.waste.length) {
    const from: Source = { pile: 'waste' };
    const to = autoMoveTarget(board, from);
    if (to) return { type: 'move', from, to };
  }
  // 4. A tableau move that frees a card for a foundation
  for (const [index, col] of board.tableau.entries()) {
    for (let cardIndex = 1; cardIndex < col.up.length; cardIndex++) {
      const exposed = col.up[cardIndex - 1];
      const freesFoundation = board.foundations.some((f, i) => canPlaceOnFoundation(exposed, f, i));
      if (!freesFoundation) continue;
      const from: Source = { pile: 'tableau', index, cardIndex };
      const to = legalTargets(board, from).find((t) => t.pile === 'tableau');
      if (to) return { type: 'move', from, to };
    }
  }
  // 5. Turn over more cards
  if (board.stock.length || board.waste.length) return { type: 'draw' };
  return null;
}

export const isWon = (board: Board): boolean => board.foundations.every((f) => f.length === 13);

/** Auto finish is offered once every tableau card is face up and the stock is empty. */
export const canAutoFinish = (board: Board): boolean =>
  !isWon(board) && board.stock.length === 0 && board.tableau.every((col) => col.down.length === 0);

/** The next move toward finishing: a card to a foundation, or a draw to reach the next waste card. */
export function nextFinishMove(board: Board): Move | null {
  if (isWon(board)) return null;
  for (const from of topSources(board)) {
    const to = foundationTarget(board, from);
    if (to) return { type: 'move', from, to };
  }
  return board.stock.length || board.waste.length ? { type: 'draw' } : null;
}

/**
 * Plays the next finishing move. Finishing always draws one card at a time: with Draw 3 the same
 * groups of three could otherwise repeat forever without ever showing the card that is needed.
 */
export function finishStep(game: Solitaire): { game: Solitaire; move: Move } | null {
  const move = nextFinishMove(game.board);
  const next = move && applyMove({ ...game, drawCount: 1 }, move);
  return move && next ? { game: { ...next, drawCount: game.drawCount }, move } : null;
}

/** Plays every finishing move. Returns the moves in order so the screen can animate them. */
export function autoFinish(game: Solitaire): { game: Solitaire; moves: Move[] } {
  const moves: Move[] = [];
  let current = game;
  // Each card needs at most one pass through the waste, so this bound is generous
  for (let guard = 0; guard < 52 * 53 && !isWon(current.board); guard++) {
    const step = finishStep(current);
    if (!step) break;
    moves.push(step.move);
    current = step.game;
  }
  return { game: current, moves };
}
