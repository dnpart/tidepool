import { useEffect, useMemo, useRef, useState } from 'react';
import type { Eyes } from '../../art/Creature';
import { Card } from '../../cards/Card';
import { BACKS, CardBack } from '../../cards/CardBack';
import { cardId, cardName, type Card as CardData, type Rank } from '../../cards/deck';
import { capitalize, DECKS } from '../../decks/decks';
import { useCardBack, useDeck } from '../../decks/useDeck';
import buttons from '../../screens/Buttons.module.css';
import { BackButton } from '../../screens/BackButton';
import { Segmented, Switch } from '../../settings/controls';
import { useSettings } from '../../settings/SettingsContext';
import { displayName } from '../../settings/settings';
import { play as playSound } from '../../sound/sfx';
import { useReducedMotion } from '../../theme/ThemeProvider';
import { SeatCharacter, seatLabel, seatWho } from '../seats';
import {
  actingSeat,
  call,
  claimText,
  computerMove,
  lastPlay,
  letGo,
  MAX_PLAY,
  newGame,
  nextGame,
  pileSize,
  play,
  provenFib,
  rankPlural,
  resetTally,
  type FishyState,
  type LastEvent,
  type Opponents,
  viewFor,
} from './rules';
import { loadSaved, save } from './storage';
import styles from './Fishy.module.css';

/** How long an opponent thinks before playing, and before answering a claim. */
const THINK_MS = 900;
const ASK_MS = 650;
/** How long called cards stay turned over, and when the verdict bubbles appear. */
const REVEAL_MS = 2000;
const VERDICT_MS = 650;
const BUBBLE_MS = 1800;

const HAND_CARD = 62;
const PILE_CARD = 70;
const REVEAL_CARD = 62;

type Names = (typeof DECKS)[keyof typeof DECKS]['names'];
type CallEvent = Extract<LastEvent, { kind: 'call' }>;

const LET_GO_LINES = ['Okay…', 'I believe you', 'Hmm, fine', 'Go on then'];

const lower = (text: string) => text.charAt(0).toLowerCase() + text.slice(1);
const who = (names: Names, seat: number) => capitalize(seatWho(names, seat));

/** "The octopus was fibbing. It picks up 12 cards" for the status line while called cards are turned over. */
/** "a 7", "an Ace", "two 7s", "all four Queens": how many of a rank a caller had. */
function howMany(count: number, rank: Rank): string {
  if (count === 4) return `all four ${rankPlural(rank)}`;
  if (count > 1) return lower(claimText(count, rank));
  const one = claimText(1, rank).slice(4); // "Ace", "7"
  return `${rank === 1 || rank === 8 ? 'an' : 'a'} ${one}`;
}

function verdictText(e: CallEvent, knew: number, names: Names): string {
  const cards = `${e.size} ${e.size === 1 ? 'card' : 'cards'}`;
  const picker = e.pickedUp === 0 ? 'You pick up' : `${who(names, e.pickedUp)} picks up`;
  const lead = e.lie
    ? e.player === 0 ? 'You were fibbing!' : `${who(names, e.player)} was fibbing!`
    : e.player === 0 ? 'Your cards were true!' : 'It was true!';
  const why = knew > 0 ? ` ${who(names, e.caller)} had ${howMany(knew, e.rank)}.` : '';
  return `${lead}${why} ${picker} ${cards}.`;
}

interface Bubble {
  text: string;
  id: number;
  loud?: boolean;
}

export function FishyScreen() {
  const { settings } = useSettings();
  const names = DECKS[useDeck()].names;
  const reduced = useReducedMotion();
  const backColor = BACKS[useCardBack()].bg;
  const saved = useMemo(() => loadSaved(), []);

  const [game, setGame] = useState<FishyState>(() => saved?.game ?? newGame(2));
  const [opponents, setOpponents] = useState<Opponents>(() => saved?.opponents ?? 2);
  const [showTally, setShowTally] = useState(() => saved?.showTally ?? false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [confirmNew, setConfirmNew] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [shake, setShake] = useState<string | null>(null);
  const [bubbles, setBubbles] = useState<Record<number, Bubble>>({});
  const [moods, setMoods] = useState<Record<number, Eyes>>({});
  /** A call being shown: the cards turned over, then who was right. */
  const [reveal, setReveal] = useState<{ event: CallEvent; verdict: boolean; knew: number } | null>(null);
  const [showEnd, setShowEnd] = useState(() => game.phase === 'done');

  const gameRef = useRef(game);
  gameRef.current = game;
  const bubbleId = useRef(0);

  const name = displayName(settings);
  const seats = game.hands.length;
  const held = menuOpen || rulesOpen;
  const slow = (ms: number) => (reduced ? ms / 2 : ms);

  // --- autosave ---
  useEffect(() => save({ game, opponents, showTally }), [game, opponents, showTally]);

  const say = (seat: number, text: string, loud = false) => {
    const id = ++bubbleId.current;
    setBubbles((b) => ({ ...b, [seat]: { text, id, loud } }));
    setTimeout(() => setBubbles((b) => (b[seat]?.id === id ? (({ [seat]: _, ...rest }) => rest)(b) : b)), slow(BUBBLE_MS));
  };

  /** Moves the game on, with the speech bubbles and sounds for what just happened. */
  const apply = (next: FishyState | null) => {
    if (!next) return;
    const before = gameRef.current;
    const e = next.last;
    setSelected([]);
    setGame(next);
    if (!e) return;
    if (e.kind === 'play') {
      say(e.seat, `${claimText(e.count, e.rank)}!`);
      playSound('flip');
    } else if (e.kind === 'letGo') {
      if (e.seat !== 0) say(e.seat, LET_GO_LINES[Math.floor(Math.random() * LET_GO_LINES.length)]);
    } else {
      say(e.caller, 'Fishy!', true);
      playSound('blub');
      // A computer that held enough of the rank to know it was a fib says so at the verdict
      const knew = e.caller !== 0 && before.phase === 'call' ? provenFib(viewFor(before, e.caller)) : 0;
      setReveal({ event: e, verdict: false, knew });
    }
  };

  // --- a call: the cards turn over, then the verdict, then the pile goes to whoever picks it up ---
  useEffect(() => {
    if (!reveal) return;
    const e = reveal.event;
    if (!reveal.verdict) {
      const t = setTimeout(() => {
        setReveal({ ...reveal, verdict: true });
        if (e.lie) {
          if (e.player !== 0) say(e.player, 'Oops…');
          if (e.caller !== 0) say(e.caller, reveal.knew > 0 ? `I had ${howMany(reveal.knew, e.rank)}!` : 'Ha! Caught you', true);
          playSound('boop');
        } else {
          if (e.player !== 0) say(e.player, 'All true!', true);
          if (e.caller !== 0) say(e.caller, 'Oh no…');
        }
        setMoods({ [e.player]: e.lie ? 'sleepy' : 'happy', [e.caller]: e.lie ? 'happy' : 'sleepy' });
      }, slow(VERDICT_MS));
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setReveal(null);
      setMoods({});
      playSound('whoosh');
    }, slow(REVEAL_MS - VERDICT_MS));
    return () => clearTimeout(t);
    // say and slow only read refs and settings
  }, [reveal]);

  // --- the opponents: think, then play or answer the claim ---
  useEffect(() => {
    if (held || reveal || game.phase === 'done') return;
    const seat = actingSeat(game);
    if (seat === null || seat === 0) return;
    const t = setTimeout(() => apply(computerMove(gameRef.current)), slow(game.phase === 'play' ? THINK_MS : ASK_MS));
    return () => clearTimeout(t);
    // apply only reads refs and the deck's names
  }, [game, held, reveal, reduced]);

  // --- the end of a game: a sound, then the end card once the last play has settled ---
  const lastWinner = useRef(game.winner);
  useEffect(() => {
    if (game.winner === null || game.winner === lastWinner.current || reveal) return;
    lastWinner.current = game.winner;
    const won = game.winner === 0;
    const t = setTimeout(() => {
      if (won) playSound('win');
      setShowEnd(true);
    }, slow(700));
    return () => clearTimeout(t);
  }, [game.winner, reveal, reduced]);

  // --- your cards ---
  const myTurn = game.phase === 'play' && game.turn === 0 && !held && !reveal;
  const myCall = game.phase === 'call' && game.asking === 0 && !held && !reveal;

  const toggle = (id: string) => {
    if (!myTurn) return;
    if (selected.includes(id)) return setSelected(selected.filter((s) => s !== id));
    if (selected.length >= MAX_PLAY) {
      setShake(id);
      playSound('invalid');
      setTimeout(() => setShake((s) => (s === id ? null : s)), 400);
      return;
    }
    setSelected([...selected, id]);
  };

  // --- the menu ---
  const startGame = (count: Opponents, fresh: FishyState) => {
    setGame(fresh);
    setOpponents(count);
    setSelected([]);
    setBubbles({});
    setMoods({});
    setReveal(null);
    setShowEnd(false);
    lastWinner.current = null;
  };

  const changeOpponents = (value: string) => {
    const count: Opponents = value === '1' ? 1 : value === '3' ? 3 : 2;
    setOpponents(count);
    // Before anyone has played, the new table is dealt at once; mid-game it waits for the next game
    if (game.plays === 0 && game.phase === 'play') {
      startGame(count, newGame(count, { starter: game.starter, tally: game.tally }));
    }
  };

  const onNewGame = () => {
    if (game.phase !== 'done' && game.plays > 0 && !confirmNew) return setConfirmNew(true);
    startGame(opponents, nextGame(gameRef.current, opponents));
    setConfirmNew(false);
    setMenuOpen(false);
    playSound('whoosh');
  };

  // --- what the status line says ---
  const claim = game.phase === 'call' ? lastPlay(game) : null;
  let status: string;
  if (reveal) status = reveal.verdict ? verdictText(reveal.event, reveal.knew, names) : `${who(names, reveal.event.caller)} called it!`;
  else if (game.phase === 'done') status = 'Game over';
  else if (claim && game.asking === 0) {
    status = `${who(names, claim.seat)} says ${lower(claimText(claim.cards.length, claim.rank))}. Call it, or let it go?`;
  } else if (claim) {
    status = claim.seat === 0 ? 'Will anyone call it?' : `${who(names, game.asking!)} is deciding…`;
  } else if (game.turn === 0) {
    status = selected.length
      ? `They'll go down as ${rankPlural(game.due)}, whatever they are`
      : `Your turn: ${rankPlural(game.due)} are due. Pick 1 to 4 cards`;
  } else status = `${who(names, game.turn)} is thinking…`;

  // While called cards are turned over, the pile is still shown until it goes to whoever picks it up
  const size = reveal ? reveal.event.size : pileSize(game);
  const shownClaim = reveal
    ? { count: reveal.event.cards.length, rank: reveal.event.rank }
    : claim && { count: claim.cards.length, rank: claim.rank };
  const pending = game.phase !== 'done' && game.plays > 0 && opponents !== seats - 1;
  const hand = game.hands[0];
  const eyesFor = (seat: number): Eyes => moods[seat] ?? (actingSeat(game) === seat && !reveal ? 'open' : 'happy');

  return (
    <main className={styles.screen} data-reduced={reduced}>
      <header className={styles.topBar}>
        <BackButton />
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>Fishy</h1>
          {showTally && (
            <span className={styles.tally}>
              {game.hands.map((_, seat) => `${seatLabel(names, seat)} ${game.tally[seat]}`).join(' · ')}
            </span>
          )}
        </div>
        <button
          type="button"
          className={buttons.iconButton}
          aria-label="Game menu"
          aria-expanded={menuOpen}
          onClick={() => {
            setMenuOpen((o) => !o);
            setConfirmNew(false);
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
            <circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" />
          </svg>
        </button>
      </header>

      {menuOpen && (
        <>
          <div className={styles.scrim} onClick={() => setMenuOpen(false)} />
          <div className={`panel ${styles.menu}`} role="dialog" aria-label="Game menu">
            <span id="fishy-opponents" className={styles.menuLabel}>Opponents</span>
            <Segmented
              options={[{ value: '1', label: 'One' }, { value: '2', label: 'Two' }, { value: '3', label: 'Three' }]}
              value={String(opponents)}
              onChange={changeOpponents}
              labelledBy="fishy-opponents"
            />
            {pending && <span className={styles.menuNote}>Starts with the next game</span>}
            <button type="button" className={styles.primary} onClick={onNewGame}>
              {confirmNew ? 'Tap again to end this game' : 'New game'}
            </button>
            <div className={styles.menuRow}>
              <span id="fishy-tally" className={styles.menuLabel}>Show tally</span>
              <Switch checked={showTally} onChange={setShowTally} labelledBy="fishy-tally" />
            </div>
            {showTally && (
              <button type="button" className={styles.secondary} onClick={() => setGame((g) => resetTally(g))}>
                Reset tally
              </button>
            )}
            <button
              type="button"
              className={styles.secondary}
              onClick={() => {
                setMenuOpen(false);
                setRulesOpen(true);
              }}
            >
              Rules
            </button>
          </div>
        </>
      )}

      <section className={styles.opponents} aria-label="Opponents">
        {game.hands.slice(1).map((cards, i) => {
          const seat = i + 1;
          const bubble = bubbles[seat];
          return (
            <div key={seat} className={styles.opponent} data-turn={actingSeat(game) === seat || undefined}>
              <div className={styles.avatar}>
                <SeatCharacter seat={seat} eyes={eyesFor(seat)} size={44} />
              </div>
              <span className={styles.oppCount}>
                <span className={styles.miniFan} aria-hidden="true" style={{ ['--back' as string]: backColor }}>
                  <span /><span /><span />
                </span>
                {cards.length}
                <span className={styles.hidden}> {cards.length === 1 ? 'card' : 'cards'}, {seatLabel(names, seat)}</span>
              </span>
              {bubble && (
                <span key={bubble.id} className={styles.bubble} data-loud={bubble.loud || undefined} aria-hidden="true">
                  {bubble.text}
                </span>
              )}
            </div>
          );
        })}
      </section>

      <div className={styles.table}>
        <div className={styles.pileArea}>
          <div className={styles.pile} aria-label={size ? `Pile of ${size} ${size === 1 ? 'card' : 'cards'}` : 'Empty pile'} role="img">
            {size === 0 && <div className={styles.emptyPile} />}
            {Array.from({ length: Math.min(4, Math.ceil(size / 3)) }, (_, k) => (
              <CardBack key={k} width={PILE_CARD} className={styles.pileCard} style={{ transform: `translate(${k * 2}px, ${-k * 2}px) rotate(${(k % 2 ? 4 : -3)}deg)` }} />
            ))}
            {reveal && (
              <div className={styles.revealed} data-lie={reveal.verdict ? reveal.event.lie : undefined}>
                {reveal.event.cards.map((c, k) => (
                  <Card key={cardId(c)} card={c} width={REVEAL_CARD} className={styles.revealCard} style={{ ['--k' as string]: k - (reveal.event.cards.length - 1) / 2 }} />
                ))}
              </div>
            )}
          </div>
          <div className={styles.pileText}>
            <span className={styles.pileCount}>{size ? `${size} ${size === 1 ? 'card' : 'cards'}` : 'Empty'}</span>
            {shownClaim ? (
              <span className={styles.due}>Claimed: {lower(claimText(shownClaim.count, shownClaim.rank))}</span>
            ) : (
              <span className={styles.due}>Now: {rankPlural(game.due)}</span>
            )}
            {game.aside.length > 0 && <span className={styles.aside}>{game.aside.length} set aside</span>}
          </div>
        </div>
        {bubbles[0] && (
          <span key={bubbles[0].id} className={`${styles.bubble} ${styles.myBubble}`} data-loud={bubbles[0].loud || undefined} aria-hidden="true">
            {bubbles[0].text}
          </span>
        )}
      </div>

      <p className={styles.status} role="status">{status}</p>

      <div className={styles.handArea}>
        <div className={styles.hand} role="group" aria-label={`Your cards, ${hand.length}`}>
          {hand.map((c: CardData) => {
            const id = cardId(c);
            const lifted = selected.includes(id);
            return (
              <button
                key={id}
                type="button"
                className={styles.handCard}
                data-lifted={lifted || undefined}
                data-due={(myTurn && c.rank === game.due) || undefined}
                data-shake={shake === id || undefined}
                aria-pressed={lifted}
                aria-disabled={!myTurn}
                aria-label={cardName(c)}
                data-silent
                onClick={() => {
                  if (myTurn) playSound('tap');
                  toggle(id);
                }}
              >
                <Card card={c} width={HAND_CARD} />
              </button>
            );
          })}
        </div>
      </div>

      <footer className={styles.bottomBar}>
        {myCall ? (
          <>
            <button type="button" className={styles.primary} data-silent onClick={() => apply(call(game))}>Fishy!</button>
            <button type="button" className={styles.secondary} onClick={() => apply(letGo(game))}>Let it go</button>
          </>
        ) : (
          <>
            <button
              type="button"
              className={styles.primary}
              data-silent
              disabled={!myTurn || selected.length === 0}
              onClick={() => apply(play(game, selected))}
            >
              {myTurn && selected.length ? `Play ${lower(claimText(selected.length, game.due))}` : 'Play'}
            </button>
            <button type="button" className={styles.secondary} onClick={() => setMenuOpen(true)}>Menu</button>
          </>
        )}
      </footer>

      {rulesOpen && (
        <Overlay labelledBy="fishy-rules">
          <h2 id="fishy-rules" className={styles.overlayTitle}>How to play</h2>
          <ul className={styles.rules}>
            <li>Get rid of all your cards by putting them face down on the pile, 1 to 4 at a time.</li>
            <li>The pile goes up in order: Aces, 2s, 3s and on to Kings, then Aces again. Whatever you put down, you say it's the rank that's due: "Two 7s".</li>
            <li>You can fib! Put down any cards you like. Everyone sees how many, so the number is always true. The rank might not be.</li>
            <li>After each play, everyone else in turn can call "Fishy!" or let it go.</li>
            <li>A call turns the cards over. If they were a fib, the player picks up the whole pile. If they were true, the caller does.</li>
            <li>Get rid of your last card without being caught to win.</li>
            <li>With two players, 18 cards are set aside unseen, so nobody knows where every card is.</li>
          </ul>
          <div className={styles.overlayButtons}>
            <button type="button" className={styles.primary} onClick={() => setRulesOpen(false)} autoFocus>Got it</button>
          </div>
        </Overlay>
      )}

      {showEnd && game.winner !== null && (
        <Overlay labelledBy="fishy-end">
          <div className={styles.bob}>
            <SeatCharacter seat={game.winner} eyes="happy" wave={game.winner === 0} size={90} />
          </div>
          <h2 id="fishy-end" className={styles.overlayTitle}>
            {game.winner === 0 ? `You got rid of every card, ${name}!` : `${who(names, game.winner)} played its last card`}
          </h2>
          <p className={styles.overlaySub}>{endLine(game, names)}</p>
          {showTally && (
            <div className={styles.chips}>
              {game.hands.map((_, seat) => (
                <span key={seat} className={styles.chip}>{seatLabel(names, seat)} {game.tally[seat]}</span>
              ))}
            </div>
          )}
          <div className={styles.overlayButtons}>
            <button
              type="button"
              className={styles.primary}
              onClick={() => startGame(opponents, nextGame(gameRef.current, opponents))}
              autoFocus
            >
              Play again
            </button>
            <a className={styles.secondary} href="#/">Home</a>
          </div>
        </Overlay>
      )}
    </main>
  );
}

/** "You had 5 cards left, the octopus 3." Everyone but the winner. */
function endLine(game: FishyState, names: Names): string {
  const others = game.hands.map((h, seat) => ({ seat, left: h.length })).filter(({ seat }) => seat !== game.winner);
  const parts = others.map(({ seat, left }, i) =>
    i === 0 ? `${who(names, seat)} had ${left} ${left === 1 ? 'card' : 'cards'} left` : `${seatWho(names, seat)} ${left}`,
  );
  return `${parts.join(', ')}.`;
}

function Overlay({ children, labelledBy }: { children: React.ReactNode; labelledBy: string }) {
  return (
    <div className={styles.overlay}>
      <div className={styles.overlayCard} role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
        {children}
      </div>
    </div>
  );
}
