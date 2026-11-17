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

/** The same deal from the start (the oldest position kept), with the moves and history cleared. */
export function restart(game: Solitaire): Solitaire {
  return { ...game, board: game.history[0]?.board ?? game.board, moves: 0, history: [] };
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

// --- pick up, then tap where it goes ---

/** What a tap does: pick cards up, move the picked-up cards, put them back down, refuse (a shake), or nothing. */
export type Tap =
  | { type: 'select'; source: Source }
  | { type: 'move'; from: Source; to: Target }
  | { type: 'deselect' }
  | { type: 'invalid' }
  | { type: 'none' };

const samePlace = (a: Source, b: Source): boolean => JSON.stringify(a) === JSON.stringify(b);

/** The pile a card sits in, as a place to move to. The waste is never one. */
export function pileOf(source: Source): Target | null {
  return source.pile === 'waste' ? null : { pile: source.pile, index: source.index };
}

/**
 * A tap on a face-up card. With nothing picked up it picks the card up (with the cards on top of it); foundation cards
 * only leave by dragging, so a stray tap never pulls one back down. With cards picked up, a tap on a pile they can go
 * to moves them there; a tap on the same card puts them down; a tap on another card picks that one up instead.
 */
export function tapOnCard(board: Board, selected: Source | null, tapped: Source): Tap {
  const pickable = tapped.pile !== 'foundation' && pickUp(board, tapped).length > 0;
  if (!selected) return pickable ? { type: 'select', source: tapped } : { type: 'none' };
  if (samePlace(selected, tapped)) return { type: 'deselect' };
  const to = pileOf(tapped);
  if (to && isLegal(board, selected, to)) return { type: 'move', from: selected, to };
  return pickable ? { type: 'select', source: tapped } : { type: 'invalid' };
}

/** A tap on an empty pile (a column or a foundation slot) while cards are picked up. */
export function tapOnPile(board: Board, selected: Source | null, to: Target): Tap {
  if (!selected) return { type: 'none' };
  return isLegal(board, selected, to) ? { type: 'move', from: selected, to } : { type: 'invalid' };
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

/** A move that makes progress at once: a card up to a foundation, or a run moved off a face-down card to turn it over. */
function progressHint(board: Board): Move | null {
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
  return null;
}

/**
 * The draw pile as one line, in the order its cards come out: the waste (bottom first), then the stock (top first).
 * Drawing and turning the pile over never change it, only how far along it you are (the waste's length).
 */
const talonOf = (b: Board): Card[] => [...b.waste, ...[...b.stock].reverse()];

/**
 * Which cards of the draw pile can ever come to the top of the waste by drawing, as places in that line: the waste's
 * top, then every `drawCount`th card from here to the end (and the last), then the same from the start once the pile is
 * turned over. With Draw 1 that's every card.
 */
export function reachableInTalon(length: number, dealt: number, drawCount: DrawCount): number[] {
  const out = new Set<number>();
  if (dealt > 0) out.add(dealt - 1);
  for (let p = dealt; p < length;) { p = Math.min(length, p + drawCount); out.add(p - 1); }
  for (let p = 0; p < length;) { p = Math.min(length, p + drawCount); out.add(p - 1); }
  return [...out].sort((a, b) => a - b);
}

/**
 * The moves the search tries from a position: every card the draw pile can bring to the top, played wherever it fits
 * (its first move is a draw unless it's already on top); every face-up run to another column, less a whole column with
 * nothing under it into an empty one (that changes nothing); and, with `fromFoundations`, foundation cards back down
 * while a card of the other color one lower could still need them as a base (once both of the other color's
 * foundations have reached that rank, nothing ever goes on it again).
 */
function searchMoves(b: Board, drawCount: DrawCount, fromFoundations: boolean): { first: Move; after: Board }[] {
  const out: { first: Move; after: Board }[] = [];
  const play = (board: Board, from: Source, to: Target) => moveCards({ board, drawCount, moves: 0, history: [] }, from, to)?.board;
  const talon = talonOf(b);
  const dealt = b.waste.length;
  const waste: Source = { pile: 'waste' };
  for (const i of reachableInTalon(talon.length, dealt, drawCount)) {
    const brought: Board = { ...b, waste: talon.slice(0, i + 1), stock: talon.slice(i + 1).reverse() };
    for (const to of legalTargets(brought, waste)) {
      const after = play(brought, waste, to);
      if (after) out.push({ first: i === dealt - 1 ? { type: 'move', from: waste, to } : { type: 'draw' }, after });
    }
  }
  const from: Source[] = sources(b).filter((s) => s.pile === 'tableau');
  if (fromFoundations) {
    b.foundations.forEach((f, index) => {
      const card = top(f);
      if (!card) return;
      const otherColor = b.foundations.filter((_, k) => teamOf(FOUNDATION_SUITS[k]) !== teamOf(card.suit));
      if (Math.min(...otherColor.map((p) => p.length)) < card.rank - 1) from.push({ pile: 'foundation', index });
    });
  }
  for (const s of from) {
    const wholeColumn = s.pile === 'tableau' && s.cardIndex === 0 && b.tableau[s.index].down.length === 0;
    for (const to of legalTargets(b, s)) {
      if (wholeColumn && to.pile === 'tableau' && b.tableau[to.index].up.length === 0) continue;
      const after = play(b, s, to);
      if (after) out.push({ first: { type: 'move', from: s, to }, after });
    }
  }
  // Moves you can make right now first, so among equally short lines the hint never draws past a card it could play
  return [...out.filter((m) => m.first.type !== 'draw'), ...out.filter((m) => m.first.type === 'draw')];
}

const cardsOn = (board: Board) => board.foundations.reduce((n, f) => n + f.length, 0);
const faceDown = (board: Board) => board.tableau.reduce((n, c) => n + c.down.length, 0);
const ids = (cards: readonly Card[]) => cards.map((c) => `${c.rank}${c.suit[0]}`).join(',');
/**
 * A position, for the search. The columns are sorted, since which column holds a run doesn't change what can happen,
 * and the draw pile is one line: drawing doesn't change it. With Draw 3, how far along the pile you are still matters
 * until it's next turned over, unless you're already in step with a fresh pass.
 */
const keyOf = (b: Board, drawCount: DrawCount) => {
  const talon = talonOf(b);
  const dealt = b.waste.length;
  const where = drawCount === 1 || dealt % drawCount === 0 || dealt === talon.length ? '' : `@${dealt}`;
  return `${ids(talon)}${where}|${b.foundations.map((f) => f.length).join(',')}|${b.tableau.map((c) => `${c.down.length}:${ids(c.up)}`).sort().join('/')}`;
};

/** How many positions the search may look at before it gives up (and then never calls the game lost). */
export const SEARCH_LIMIT = 20000;

/**
 * Looks for any line of moves that ends in progress: a face-down card turned over, or more cards on the foundations
 * than `best` (the most there have been, by default now). Returns its first move; `null` when there is no such line;
 * `undefined` if it gave up first. With `fromFoundations` (the default) it also takes cards back down off the
 * foundations, so `null` proves the game can't be won from here: winning needs all 52 up, which is always more than
 * `best`. Without, cards never come back down, which is what hints try first.
 */
export function findProgress(
  board: Board,
  drawCount: DrawCount = 1,
  { limit = SEARCH_LIMIT, fromFoundations = true, best = cardsOn(board) }: {
    limit?: number;
    fromFoundations?: boolean;
    /** Progress means more cards on the foundations than this. */
    best?: number;
  } = {},
): Move | null | undefined {
  const down = faceDown(board);
  const seen = new Set([keyOf(board, drawCount)]);
  let queue: { board: Board; first: Move | null }[] = [{ board, first: null }];
  while (queue.length) {
    const next: typeof queue = [];
    for (const { board: b, first } of queue) {
      for (const step of searchMoves(b, drawCount, fromFoundations)) {
        if (cardsOn(step.after) > best || faceDown(step.after) < down) return first ?? step.first;
        const key = keyOf(step.after, drawCount);
        if (seen.has(key)) continue;
        if (seen.size >= limit) return undefined;
        seen.add(key);
        next.push({ board: step.after, first: first ?? step.first });
      }
    }
    queue = next;
  }
  return null;
}

/**
 * The hint and whether the game is lost, in one go. Progress is measured against the best the game has done since its
 * last face-down card turned over: a card taken down off a foundation and put back up again isn't progress, so the
 * hints can't go round in circles (they did, before: down, across, back, up). The hint is a move that makes progress
 * at once if there is one; otherwise the first move of the shortest line to progress that never takes a card down off
 * a foundation; failing that, of any line at all. No line means the game is lost: no hint, and it can't be won from
 * here (winning needs all 52 up, more than the best so far). If the search gives up before it knows, there's no hint
 * either, but the game isn't called lost.
 */
export function analyze(
  game: Pick<Solitaire, 'board' | 'drawCount'> & { history?: Solitaire['history'] },
  best = bestSoFar(game),
): Analysis {
  const { board, drawCount } = game;
  if (isWon(board)) return { hint: null, lost: false };
  const down = faceDown(board);
  const quick = progressHint(board);
  if (quick) {
    const after = applyMove({ board, drawCount, moves: 0, history: [] }, quick)!.board;
    if (faceDown(after) < down || cardsOn(after) > best) return { hint: quick, lost: false };
  }
  const forward = findProgress(board, drawCount, { fromFoundations: false, best });
  if (forward) return { hint: forward, lost: false };
  const any = board.foundations.some((f) => f.length) ? findProgress(board, drawCount, { best }) : forward;
  return any ? { hint: any, lost: false } : { hint: null, lost: any === null };
}

/** The most cards there have been on the foundations since the last face-down card turned over. */
export function bestSoFar(game: Pick<Solitaire, 'board'> & { history?: Solitaire['history'] }): number {
  const down = faceDown(game.board);
  let best = cardsOn(game.board);
  for (const h of game.history ?? []) if (faceDown(h.board) === down) best = Math.max(best, cardsOn(h.board));
  return best;
}

export interface Analysis {
  /** A helpful next move; null when nothing can help. */
  hint: Move | null;
  /** Nothing left can help: the game can't be won from here. */
  lost: boolean;
}

/** A helpful next move, or null when nothing can help (the game is lost). */
export function hint(board: Board, drawCount: DrawCount = 1): Move | null {
  return analyze({ board, drawCount }).hint;
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
