import { useEffect, useMemo, useRef, useState } from 'react';
import { capitalize, DECKS } from '../../decks/decks';
import { DeckCreature } from '../../decks/DeckCreature';
import { useDeck } from '../../decks/useDeck';
import buttons from '../../screens/Buttons.module.css';
import { BackButton } from '../../screens/BackButton';
import { Segmented, Switch } from '../../settings/controls';
import { useSettings } from '../../settings/SettingsContext';
import { displayName } from '../../settings/settings';
import { play as playSound } from '../../sound/sfx';
import { useReducedMotion } from '../../theme/ThemeProvider';
import { SeatCharacter, seatLabel, seatWho } from '../seats';
import { MARBLE_COLORS, MARBLE_NAMES, marbleAt } from './board';
import { Board, Die, Marble, type Target } from './Board';
import {
  chooseMove,
  CORNER,
  holeOf,
  homeCount,
  isHome,
  isPad,
  legalMoves,
  move as makeMove,
  newGame,
  pass,
  resetTally,
  roll,
  rollDie,
  type LastTurn,
  type Move,
  type Opponents,
  type PondHopState,
} from './rules';
import { loadSaved, save } from './storage';
import styles from './PondHop.module.css';

const TUMBLE_MS = 400;
/** Pause before a roll is used, and how long an opponent's move stays in the status line. */
const THINK_MS = 550;
const NOTE_MS = 1000;
const NO_MOVE_MS = 1200;

type Names = (typeof DECKS)[keyof typeof DECKS]['names'];

/** "The bee rolled a 5 and hopped across the pond, sending your marble home" for the status line. */
function noteFor(last: LastTurn, names: Names): string {
  const who = seatWho(names, last.seat);
  const m = last.move;
  let what: string;
  if (!m) what = "can't move";
  else if (m.out) what = 'brought a marble out';
  else if (m.hop) what = 'hopped across the pond';
  else if (isHome(m.to) && !isHome(m.from)) what = 'moved into the home lane';
  else what = `moved ${m.to - m.from}`;
  const sent =
    m && m.captures.length
      ? m.captures.length > 1
        ? ', sending two marbles home'
        : `, sending ${m.captures[0].seat === 0 ? 'your' : `${seatWho(names, m.captures[0].seat)}'s`} marble home`
      : '';
  const again = last.roll === 6 ? '. A 6, so another roll' : '';
  return `${capitalize(who)} rolled a ${last.roll} and ${what}${sent}${again}`;
}

/** "Move 4 into your home lane, sending the bee's marble home" for a target's button label. */
function moveLabel(m: Move, names: Names): string {
  const steps = m.hop ? m.to - m.from - 20 : m.to - m.from;
  let text: string;
  if (m.out) text = 'Bring a marble out onto your start';
  else if (m.hop) text = `Move ${steps} to the lily pad and hop across the pond`;
  else if (isHome(m.to) && !isHome(m.from)) text = `Move ${steps} into your home lane`;
  else if (isHome(m.to)) text = `Move ${steps} along your home lane`;
  else if (isPad(holeOf(0, m.to)!)) text = `Move ${steps} and stay on the lily pad`;
  else text = `Move ${steps}`;
  if (m.captures.length) {
    text += `, sending ${m.captures.map((c) => `${seatWho(names, c.seat)}'s marble`).join(' and ')} home`;
  }
  return text;
}

export function PondHopScreen() {
  const { settings } = useSettings();
  const names = DECKS[useDeck()].names;
  const reduced = useReducedMotion();
  const saved = useMemo(() => loadSaved(), []);

  const [game, setGame] = useState<PondHopState>(() => saved?.game ?? newGame(2));
  const [opponents, setOpponents] = useState<Opponents>(() => saved?.opponents ?? 2);
  const [showTally, setShowTally] = useState(() => saved?.showTally ?? false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [confirmNew, setConfirmNew] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [face, setFace] = useState(() => game.rolled ?? game.last?.roll ?? 6);
  const [selected, setSelected] = useState<number | null>(null);
  /** What the last opponent did, shown for a moment before the next roll. */
  const [note, setNote] = useState<string | null>(null);
  const [showEnd, setShowEnd] = useState(() => game.phase === 'done');
  const [size, setSize] = useState(320);

  const gameRef = useRef(game);
  gameRef.current = game;
  const middleRef = useRef<HTMLDivElement>(null);
  const belowRef = useRef<HTMLDivElement>(null);

  const name = displayName(settings);
  const seats = game.marbles.length;
  const held = menuOpen || rulesOpen;

  useEffect(() => {
    const el = middleRef.current;
    const below = belowRef.current;
    if (!el || !below) return;
    // The board takes what's left once the status line and die have their room, up to 460px
    const update = () =>
      setSize(Math.max(200, Math.floor(Math.min(el.clientWidth - 24, el.clientHeight - below.offsetHeight - 10, 460))));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    observer.observe(below);
    return () => observer.disconnect();
  }, []);

  // --- autosave ---
  useEffect(() => save({ game, opponents, showTally }), [game, opponents, showTally]);

  /** The die tumbles, then lands on a roll for the seat whose turn it is. */
  const tumble = () => {
    setRolling(true);
    setNote(null);
    const timer = setInterval(() => setFace(1 + Math.floor(Math.random() * 6)), 70);
    setTimeout(() => {
      clearInterval(timer);
      const value = rollDie();
      setFace(value);
      setRolling(false);
      const next = roll(gameRef.current, value);
      if (next) setGame(next);
    }, reduced ? 120 : TUMBLE_MS);
    playSound('flip');
  };

  /** Plays a move with its sounds: a clack, a splash for a hop, a boop for each marble sent home. */
  const apply = (m: Move | null) => {
    const g = gameRef.current;
    const next = m ? makeMove(g, m) : pass(g);
    if (!next) return;
    if (m) {
      playSound(m.hop ? 'splash' : 'land');
      if (m.captures.length) setTimeout(() => playSound('boop'), reduced ? 0 : 220);
    }
    setSelected(null);
    setGame(next);
    if (g.turn !== 0 && next.phase === 'play') setNote(noteFor(next.last!, names));
  };

  // --- the opponents: roll, think, move, then leave their move in the status line for a moment ---
  useEffect(() => {
    if (game.phase !== 'play' || held || rolling) return;
    if (note !== null) {
      const t = setTimeout(() => setNote(null), reduced ? NOTE_MS / 2 : game.turn === 0 ? NOTE_MS * 1.4 : NOTE_MS);
      return () => clearTimeout(t);
    }
    if (game.turn === 0) return;
    if (game.rolled === null) {
      const t = setTimeout(tumble, reduced ? 150 : 300);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => apply(chooseMove(gameRef.current)), reduced ? THINK_MS / 2 : THINK_MS);
    return () => clearTimeout(t);
    // tumble and apply only read refs and the deck's names
  }, [game, note, held, rolling, reduced]);

  // --- your roll: with no move it passes, with one move it plays itself ---
  const myMoves = game.phase === 'play' && game.turn === 0 && !rolling ? legalMoves(game) : [];
  useEffect(() => {
    if (game.phase !== 'play' || game.turn !== 0 || game.rolled === null || held || rolling) return;
    const moves = legalMoves(game);
    if (moves.length > 1) return;
    const t = setTimeout(() => apply(moves[0] ?? null), moves.length ? (reduced ? 200 : 500) : NO_MOVE_MS);
    return () => clearTimeout(t);
  }, [game, held, rolling, reduced]);

  // --- the end of a game: a sound, then the end card once the last marble has landed ---
  const lastWinner = useRef(game.winner);
  useEffect(() => {
    if (game.winner === null || game.winner === lastWinner.current) return;
    lastWinner.current = game.winner;
    setNote(null);
    const won = game.winner === 0;
    const t = setTimeout(() => {
      if (won) playSound('win');
      setShowEnd(true);
    }, reduced ? 300 : 900);
    return () => clearTimeout(t);
  }, [game.winner, reduced]);

  // --- choosing a move: tap a glowing marble or the glowing hole it would reach ---
  const choosing = myMoves.length > 1;
  const targets: Target[] = [];
  if (choosing) {
    const movable = [...new Set(myMoves.map((m) => m.marble))];
    const shown = selected !== null && movable.includes(selected) ? myMoves.filter((m) => m.marble === selected) : myMoves;
    for (const marble of movable) {
      const own = myMoves.filter((m) => m.marble === marble);
      const [x, y] = marbleAt(0, marble, game.marbles[0][marble]);
      targets.push({
        key: `m${marble}`,
        x,
        y,
        marble: true,
        selected: selected === marble,
        label: own.length === 1 ? moveLabel(own[0], names) : 'Choose this marble, then stay on the lily pad or hop across',
        onSelect: () => (own.length === 1 ? apply(own[0]) : setSelected((s) => (s === marble ? null : marble))),
      });
    }
    for (const m of shown) {
      const [x, y] = marbleAt(0, m.marble, m.to);
      targets.push({ key: `t${m.marble}-${m.to}-${m.hop}`, x, y, label: moveLabel(m, names), onSelect: () => apply(m) });
    }
  }

  // --- the menu ---
  const startGame = (count: Opponents) => {
    setGame(newGame(count, gameRef.current.tally));
    setSelected(null);
    setNote(null);
    setShowEnd(false);
    lastWinner.current = null;
  };

  const changeOpponents = (value: string) => {
    const count: Opponents = value === '1' ? 1 : value === '3' ? 3 : 2;
    setOpponents(count);
    // Before anyone has rolled, the new table is set at once; mid-game it waits for the next game
    if (game.last === null && game.rolled === null && game.phase === 'play') startGame(count);
  };

  const onNewGame = () => {
    if (game.phase === 'play' && game.last !== null && !confirmNew) return setConfirmNew(true);
    startGame(opponents);
    setConfirmNew(false);
    setMenuOpen(false);
    playSound('whoosh');
  };

  // --- what the status line says ---
  const n = game.rolled;
  let status: string;
  if (game.phase === 'done') status = 'Game over';
  else if (note) status = note;
  else if (game.turn !== 0) status = `${capitalize(seatWho(names, game.turn))} is rolling…`;
  else if (rolling) status = 'Rolling…';
  else if (n === null) {
    status = game.last?.seat === 0 && game.last.roll === 6 ? 'You rolled a 6, so roll again' : 'Your turn: tap Roll';
  } else if (myMoves.length === 0) status = `You rolled a ${n}. No marble can move${n === 6 ? ', but you roll again' : ''}.`;
  else if (myMoves.length === 1) status = `You rolled a ${n}.`;
  else {
    const options: string[] = [];
    if (myMoves.some((m) => m.out)) options.push('bring a marble out');
    if (myMoves.some((m) => !m.out && !m.hop)) options.push(`move one ${n}`);
    if (myMoves.some((m) => m.hop)) options.push('hop across the pond');
    const text = options.join(', or ');
    status = `You rolled a ${n}${n === 6 ? '!' : '.'} ${text.charAt(0).toUpperCase()}${text.slice(1)}.${n === 6 ? ' Then roll again.' : ''}`;
  }

  const canRoll = game.phase === 'play' && game.turn === 0 && game.rolled === null && !rolling;
  const pending = game.phase === 'play' && game.last !== null && opponents !== seats - 1;
  const mine = game.marbles[0];
  const boardLabel = `Pond Hop board. Your marbles: ${mine.filter((p) => p === CORNER).length} in your corner, ${
    mine.filter((p) => p >= 0 && !isHome(p)).length
  } on the track, ${homeCount(mine)} home.`;

  return (
    <main className={styles.screen} data-reduced={reduced}>
      <header className={styles.topBar}>
        <BackButton />
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>Pond Hop</h1>
          {showTally && (
            <span className={styles.tally}>
              {game.marbles.map((_, seat) => `${seatLabel(names, seat)} ${game.tally[seat]}`).join(' · ')}
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
            <span id="ph-opponents" className={styles.menuLabel}>Opponents</span>
            <Segmented
              options={[{ value: '1', label: 'One' }, { value: '2', label: 'Two' }, { value: '3', label: 'Three' }]}
              value={String(opponents)}
              onChange={changeOpponents}
              labelledBy="ph-opponents"
            />
            {pending && <span className={styles.menuNote}>Starts with the next game</span>}
            <button type="button" className={styles.primary} onClick={onNewGame}>
              {confirmNew ? 'Tap again to end this game' : 'New game'}
            </button>
            <div className={styles.menuRow}>
              <span id="ph-tally" className={styles.menuLabel}>Show tally</span>
              <Switch checked={showTally} onChange={setShowTally} labelledBy="ph-tally" />
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
        {game.marbles.slice(1).map((own, i) => {
          const seat = i + 1;
          const turn = game.phase === 'play' && game.turn === seat;
          const home = homeCount(own);
          return (
            <div key={seat} className={styles.opponent} data-turn={turn || undefined}>
              <div className={styles.avatar} style={{ background: `color-mix(in srgb, ${MARBLE_COLORS[seat][1]} 40%, var(--surface))` }}>
                <SeatCharacter seat={seat} eyes={turn ? 'open' : 'happy'} size={44} />
              </div>
              <div className={styles.oppText}>
                <span className={styles.hidden}>{seatLabel(names, seat)} ({MARBLE_NAMES[seat]})</span>
                <span className={styles.oppCount} aria-label={`${home} of 4 marbles home`}>
                  <svg width={60} height={14} aria-hidden="true">
                    {[0, 1, 2, 3].map((k) => (
                      <Marble key={k} x={7 + k * 15} y={7} r={6} seat={seat} opacity={k < home ? 1 : 0.25} />
                    ))}
                  </svg>
                  <span className={styles.hidden}>home</span>
                </span>
              </div>
            </div>
          );
        })}
      </section>

      <div ref={middleRef} className={styles.middle}>
        <div className={styles.boardArea}>
          <Board marbles={game.marbles} size={size} targets={targets} label={boardLabel} />
        </div>
        <div ref={belowRef}>
          <p className={styles.status} role="status">{status}</p>

          <div className={styles.dieRow}>
            <button
              type="button"
              className={styles.die}
              data-rolling={rolling || undefined}
              data-silent
              disabled={!canRoll}
              aria-label={canRoll ? 'Roll the die' : `Die showing ${face}`}
              onClick={tumble}
            >
              <Die value={face} size={64} />
            </button>
            <span className={styles.dieHint}>{choosing ? 'Tap a glowing spot' : ''}</span>
          </div>
        </div>
      </div>

      <footer className={styles.bottomBar}>
        <button type="button" className={styles.primary} disabled={!canRoll} onClick={tumble} data-silent>Roll</button>
        <button type="button" className={styles.secondary} onClick={() => setMenuOpen(true)}>Menu</button>
      </footer>

      {rulesOpen && (
        <Overlay labelledBy="ph-rules">
          <h2 id="ph-rules" className={styles.overlayTitle}>How to play</h2>
          <ul className={styles.rules}>
            <li>Everyone has four marbles waiting in their corner. Roll the die on your turn.</li>
            <li>Roll a 1 or a 6 to bring a marble out onto your start spot. A 6 also gives you another roll.</li>
            <li>Marbles go clockwise round the pond, one hole per pip. The marbles you can move and the spots they can reach glow.</li>
            <li>Land exactly on another player's marble and it goes back to its corner. You can't land on your own.</li>
            <li>Lily pads: land exactly on one and you may hop straight across the pond to the opposite pad.</li>
            <li>After one lap, a marble turns into your home lane, the four holes pointing at the pond. It needs an exact roll to fit.</li>
            <li>Get all four marbles into your home lane to win. If you can't move, your turn passes.</li>
          </ul>
          <div className={styles.overlayButtons}>
            <button type="button" className={styles.primary} onClick={() => setRulesOpen(false)} autoFocus>Got it</button>
          </div>
        </Overlay>
      )}

      {showEnd && game.winner !== null && (
        <Overlay labelledBy="ph-end">
          {game.winner === 0 ? (
            <div className={styles.cheer}>
              <DeckCreature
                sea={{ kind: 'octopus', color: '#EE8C9E', eyes: 'happy', hat: 'queen', wave: true }}
                arctic={{ kind: 'fox', suit: 'hearts', eyes: 'happy', hat: 'queen' }}
                garden={{ team: 'cheer', eyes: 'happy', hat: 'queen' }}
                size={84}
                className={styles.cheerLeft}
              />
              <DeckCreature
                sea={{ kind: 'manta', color: '#7A9EB0', eyes: 'happy', hat: 'king' }}
                arctic={{ kind: 'owl', suit: 'spades', eyes: 'happy', hat: 'king' }}
                garden={{ team: 'dealer', eyes: 'happy', hat: 'king' }}
                size={92}
                className={styles.cheerRight}
              />
            </div>
          ) : (
            <div className={styles.bob}><SeatCharacter seat={game.winner} eyes="happy" size={90} /></div>
          )}
          <h2 id="ph-end" className={styles.overlayTitle}>
            {game.winner === 0
              ? `All four home, ${name}!`
              : `${capitalize(seatWho(names, game.winner))} got all four home first`}
          </h2>
          <p className={styles.overlaySub}>
            {endLine(game, names)}
          </p>
          {showTally && (
            <div className={styles.chips}>
              {game.marbles.map((_, seat) => (
                <span key={seat} className={styles.chip}>{seatLabel(names, seat)} {game.tally[seat]}</span>
              ))}
            </div>
          )}
          <div className={styles.overlayButtons}>
            <button type="button" className={styles.primary} onClick={() => startGame(opponents)} autoFocus>Play again</button>
            <a className={styles.secondary} href="#/">Home</a>
          </div>
        </Overlay>
      )}
    </main>
  );
}

/** "You had 2 home, the orange cat 3." Everyone but the winner. */
function endLine(game: PondHopState, names: Names): string {
  const others = game.marbles.map((own, seat) => ({ seat, home: homeCount(own) })).filter(({ seat }) => seat !== game.winner);
  const parts = others.map(({ seat, home }, i) => (i === 0 ? `${capitalize(seatWho(names, seat))} had ${home} home` : `${seatWho(names, seat)} ${home}`));
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
