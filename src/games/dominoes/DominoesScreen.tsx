import { useEffect, useMemo, useRef, useState } from 'react';
import { BACKS } from '../../cards/CardBack';
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
import { Domino, DominoBack } from './Domino';
import { layoutLine } from './layout';
import {
  draw,
  isDouble,
  legalPlays,
  mustDraw,
  mustPass,
  newGame,
  newRound,
  openEnds,
  pass,
  play,
  resetTally,
  takeTurn,
  tileId,
  type DominoesState,
  type End,
  type LastTurn,
  type Opponents,
  type Tile,
} from './rules';
import { loadSaved, save } from './storage';
import styles from './Dominoes.module.css';

/** Pause before an opponent plays, then how long its move stays in the status line. */
const THINK_MS = 700;
const NOTE_MS = 900;
const DRAW_GAP_MS = 260;

const tileName = (t: Tile) => (isDouble(t) ? `double ${t.a}` : `${t.a} and ${t.b}`);
const tileKey = (a: number, b: number) => `${Math.min(a, b)}${Math.max(a, b)}`;

/** "The black cat drew 2 and played" for the status line. */
function noteFor(last: LastTurn, who: string): string {
  const drew = last.drew ? ` drew ${last.drew} and` : '';
  return `${capitalize(who)}${drew} ${last.played ? `played ${tileName(last.played)}` : 'passed'}`;
}

export function DominoesScreen() {
  const { settings } = useSettings();
  const names = DECKS[useDeck()].names;
  const backColor = BACKS[useCardBack()].bg;
  const reduced = useReducedMotion();
  const saved = useMemo(() => loadSaved(), []);

  const [game, setGame] = useState<DominoesState>(() => saved?.game ?? newGame(2));
  const [opponents, setOpponents] = useState<Opponents>(() => saved?.opponents ?? 2);
  const [showTally, setShowTally] = useState(() => saved?.showTally ?? false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [confirmNew, setConfirmNew] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [drawing, setDrawing] = useState(false);
  /** What the last opponent did, shown for a moment before the next turn. */
  const [note, setNote] = useState<string | null>(null);
  const [shaking, setShaking] = useState<number | null>(null);
  const [showEnd, setShowEnd] = useState(() => game.phase === 'done');
  const [box, setBox] = useState({ width: 320, height: 300 });

  const gameRef = useRef(game);
  gameRef.current = game;
  const lineRef = useRef<HTMLDivElement>(null);
  // Tiles already on the table don't replay their landing
  const seen = useRef(new Set(game.line.map((p) => tileKey(p.left, p.right))));
  useEffect(() => {
    for (const p of game.line) seen.current.add(tileKey(p.left, p.right));
  }, [game.line]);

  const name = displayName(settings);
  const seats = game.hands.length;
  const who = (seat: number) => seatWho(names, seat);
  const label = (seat: number) => seatLabel(names, seat);
  const held = menuOpen || rulesOpen;

  useEffect(() => {
    const el = lineRef.current;
    if (!el) return;
    const update = () => setBox({ width: el.clientWidth, height: el.clientHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // --- autosave ---
  useEffect(() => save({ game, opponents, showTally }), [game, opponents, showTally]);

  // --- the opponents' turns: think, play, then leave their move in the status line for a moment ---
  useEffect(() => {
    if (game.phase !== 'play' || held) return;
    if (note !== null) {
      const t = setTimeout(() => setNote(null), reduced ? NOTE_MS / 2 : game.turn === 0 ? NOTE_MS * 1.5 : NOTE_MS);
      return () => clearTimeout(t);
    }
    if (game.turn === 0) return;
    const t = setTimeout(() => {
      const before = gameRef.current;
      const next = takeTurn(before);
      const last = next.last!;
      for (let i = 0; i < last.drew; i++) setTimeout(() => playSound('flip'), reduced ? 0 : i * 120);
      if (last.played) setTimeout(() => playSound('land'), reduced ? 0 : last.drew * 120);
      setGame(next);
      if (next.phase === 'play') setNote(noteFor(last, who(last.seat)));
    }, reduced ? THINK_MS / 2 : THINK_MS);
    return () => clearTimeout(t);
    // `who` only changes with the deck
  }, [game, note, held, reduced]);

  // --- your draws: one tile at a time until one fits ---
  useEffect(() => {
    if (!drawing) return;
    if (!mustDraw(game)) return setDrawing(false);
    const t = setTimeout(() => {
      const next = draw(gameRef.current);
      if (next) {
        playSound('flip');
        setGame(next);
      }
    }, reduced ? 60 : DRAW_GAP_MS);
    return () => clearTimeout(t);
  }, [drawing, game, reduced]);

  // --- the end of a round: a sound, then the end card once the last tile has landed ---
  const lastResult = useRef(game.result);
  useEffect(() => {
    if (!game.result || game.result === lastResult.current) return;
    lastResult.current = game.result;
    setNote(null);
    setSelected(null);
    const youWon = game.result.winner === 0;
    const t = setTimeout(() => {
      if (youWon) playSound(game.result!.blocked ? 'foundation' : 'win');
      setShowEnd(true);
    }, reduced ? 300 : 900);
    return () => clearTimeout(t);
  }, [game.result, reduced]);

  // --- your moves ---
  const myTurn = game.phase === 'play' && game.turn === 0 && !drawing;
  const plays = myTurn ? legalPlays(game) : [];
  const fitting = new Set(plays.map((p) => p.index));
  const endsFor = (index: number): End[] => [...new Set(plays.filter((p) => p.index === index).map((p) => p.end))];

  const playTile = (index: number, end: End) => {
    const next = play(gameRef.current, index, end);
    if (!next) return;
    playSound('land');
    setSelected(null);
    setNote(null);
    setGame(next);
  };

  const onTile = (index: number) => {
    if (!myTurn) return;
    if (!fitting.has(index)) {
      playSound('invalid');
      setShaking(index);
      setTimeout(() => setShaking(null), 400);
      return;
    }
    const ends = endsFor(index);
    if (ends.length === 1 || game.line.length === 0) return playTile(index, ends[0]);
    setSelected((s) => (s === index ? null : index));
  };

  const onDraw = () => {
    if (mustPass(game)) {
      setGame(pass(game)!);
      return;
    }
    if (mustDraw(game)) setDrawing(true);
  };

  // --- the menu ---
  const startRound = (count: Opponents) => {
    setGame(newRound(count, gameRef.current.tally));
    seen.current.clear();
    setSelected(null);
    setNote(null);
    setDrawing(false);
    setShowEnd(false);
    lastResult.current = null;
  };

  const changeOpponents = (value: string) => {
    const count: Opponents = value === '1' ? 1 : 2;
    setOpponents(count);
    // Before the first tile, the new table is dealt at once; mid-round it waits for the next round
    if (game.line.length === 0 && game.phase === 'play') startRound(count);
  };

  const onNewRound = () => {
    if (game.phase === 'play' && game.line.length > 0 && !confirmNew) return setConfirmNew(true);
    startRound(opponents);
    setConfirmNew(false);
    setMenuOpen(false);
    playSound('whoosh');
  };

  // --- what the status line says ---
  const ends = openEnds(game);
  let status: string;
  if (game.phase === 'done') status = 'Round over';
  else if (note) status = note;
  else if (game.turn !== 0) status = `${capitalize(who(game.turn))} is thinking…`;
  else if (drawing) status = 'Drawing…';
  else if (mustPass(game)) status = 'No tile fits and the boneyard is empty. Tap Pass';
  else if (mustDraw(game)) status = 'No tile fits. Tap Draw';
  else if (!ends) status = `You start: play your ${tileName(game.hands[0][plays[0].index])}`;
  else if (selected !== null) status = `Tap the ${ends.left === ends.right ? 'end' : `${ends.left} or the ${ends.right}`} to play it on`;
  else if (game.drawn > 0) status = `You drew ${game.drawn}. Tap the glowing tile to play it`;
  else status = 'Your turn: tap a glowing tile, then the end to play it on';

  const layout = layoutLine(game.line, box.width, box.height);
  const choosable = selected !== null ? endsFor(selected) : [];
  const handSize = game.hands[0].length > 7 ? 30 : 36;
  const pending = game.phase === 'play' && game.line.length > 0 && opponents !== seats - 1;

  return (
    <main className={styles.screen} data-reduced={reduced}>
      <header className={styles.topBar}>
        <BackButton />
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>Dominoes</h1>
          {showTally && (
            <span className={styles.tally}>
              {game.hands.map((_, seat) => `${label(seat)} ${game.tally[seat]}`).join(' · ')}
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
            <span id="dom-opponents" className={styles.menuLabel}>Opponents</span>
            <Segmented
              options={[{ value: '1', label: 'One' }, { value: '2', label: 'Two' }]}
              value={String(opponents)}
              onChange={changeOpponents}
              labelledBy="dom-opponents"
            />
            {pending && <span className={styles.menuNote}>Starts with the next round</span>}
            <button type="button" className={styles.primary} onClick={onNewRound}>
              {confirmNew ? 'Tap again to end this round' : 'New round'}
            </button>
            <div className={styles.menuRow}>
              <span id="dom-tally" className={styles.menuLabel}>Show tally</span>
              <Switch checked={showTally} onChange={setShowTally} labelledBy="dom-tally" />
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
        {game.hands.slice(1).map((hand, i) => {
          const seat = i + 1;
          const turn = game.phase === 'play' && game.turn === seat;
          return (
            <div key={seat} className={styles.opponent} data-turn={turn || undefined}>
              <div className={styles.avatar}>
                <SeatCharacter seat={seat} eyes={turn ? 'open' : 'happy'} size={44} />
              </div>
              <div className={styles.oppText}>
                <span className={styles.oppName}>{label(seat)}</span>
                <span className={styles.oppCount}>
                  <span className={styles.backs} aria-hidden="true">
                    {hand.slice(0, 7).map((_, k) => <DominoBack key={k} size={9} color={backColor} />)}
                  </span>
                  {hand.length} {hand.length === 1 ? 'tile' : 'tiles'}
                </span>
              </div>
            </div>
          );
        })}
      </section>

      <p className={styles.status} role="status">{status}</p>

      <div className={styles.table} data-mode={settings.mode}>
        <div
          ref={lineRef}
          className={styles.line}
          role="img"
          aria-label={
            ends
              ? `Line of play, ${game.line.length} ${game.line.length === 1 ? 'tile' : 'tiles'}. Open ends: ${ends.left} and ${ends.right}`
              : 'The table is empty'
          }
        >
          {layout.items.map((item) => {
            if (item.kind === 'end') {
              const can = choosable.includes(item.end);
              return (
                <button
                  key={item.end}
                  type="button"
                  className={styles.target}
                  data-choosable={can || undefined}
                  disabled={!can}
                  aria-label={`Play on the ${item.end} end, ${item.value}`}
                  style={{ width: layout.target, height: layout.target, transform: `translate(${item.x}px, ${item.y}px)` }}
                  onClick={() => selected !== null && playTile(selected, item.end)}
                >
                  {item.value}
                </button>
              );
            }
            const key = tileKey(item.a, item.b);
            return (
              <div
                key={key}
                className={styles.placed}
                data-fresh={!seen.current.has(key) || undefined}
                style={{ transform: `translate(${item.x - 2}px, ${item.y - 2}px)` }}
              >
                <Domino a={item.a} b={item.b} size={layout.size} vertical={item.vertical} />
              </div>
            );
          })}
        </div>
        <div className={styles.boneyard} role="img" aria-label={`Boneyard, ${game.boneyard.length} left`}>
          {game.boneyard.length > 0 && <DominoBack size={14} color={backColor} />}
          {game.boneyard.length > 1 && <DominoBack size={14} color={backColor} />}
          <span>Boneyard<br />{game.boneyard.length} left</span>
        </div>
      </div>

      <section className={styles.hand} aria-label="Your tiles">
        {game.hands[0].map((t, index) => {
          const fits = fitting.has(index);
          return (
            <button
              key={tileId(t)}
              type="button"
              className={styles.handTile}
              data-fits={(myTurn && fits) || undefined}
              data-dim={(myTurn && !fits) || undefined}
              data-selected={selected === index || undefined}
              data-shaking={shaking === index || undefined}
              data-silent
              aria-label={`${tileName(t)}${myTurn ? (fits ? ', fits' : ", doesn't fit") : ''}`}
              aria-pressed={selected === index}
              onClick={() => onTile(index)}
            >
              <Domino a={t.a} b={t.b} size={handSize} vertical glow={myTurn && fits} />
            </button>
          );
        })}
      </section>

      <footer className={styles.bottomBar}>
        <button
          type="button"
          className={styles.primary}
          disabled={!myTurn || (!mustDraw(game) && !mustPass(game))}
          onClick={onDraw}
        >
          {mustPass(game) && myTurn ? 'Pass' : 'Draw'}
        </button>
        <button type="button" className={styles.secondary} onClick={() => setMenuOpen(true)}>Menu</button>
      </footer>

      {rulesOpen && (
        <Overlay labelledBy="dom-rules">
          <h2 id="dom-rules" className={styles.overlayTitle}>How to play</h2>
          <ul className={styles.rules}>
            <li>28 tiles, 0 to 6. With two opponents everyone draws 5; with one, 7. The rest are the boneyard.</li>
            <li>Whoever holds the highest double plays it first, then turns go around.</li>
            <li>On your turn, play a tile whose number matches one of the two open ends. Doubles go crosswise.</li>
            <li>If nothing fits, tap Draw: you take tiles from the boneyard until one fits. If the boneyard is empty, you pass.</li>
            <li>The first to play their last tile wins the round. If nobody can move, the lowest total of pips wins.</li>
          </ul>
          <div className={styles.overlayButtons}>
            <button type="button" className={styles.primary} onClick={() => setRulesOpen(false)} autoFocus>Got it</button>
          </div>
        </Overlay>
      )}

      {showEnd && game.result && (
        <Overlay labelledBy="dom-end">
          {game.result.winner === 0 ? (
            <div className={styles.cheer}><SeatCharacter seat={0} eyes="happy" wave size={96} /></div>
          ) : game.result.winner === null ? (
            <SeatCharacter seat={0} eyes="sleepy" size={90} />
          ) : (
            <div className={styles.bob}><SeatCharacter seat={game.result.winner} eyes="happy" size={90} /></div>
          )}
          <h2 id="dom-end" className={styles.overlayTitle}>{endTitle(game, name, who)}</h2>
          <p className={styles.overlaySub}>{pipsLine(game, who)}</p>
          {showTally && (
            <div className={styles.chips}>
              {game.hands.map((_, seat) => (
                <span key={seat} className={styles.chip}>{label(seat)} {game.tally[seat]}</span>
              ))}
            </div>
          )}
          <div className={styles.overlayButtons}>
            <button type="button" className={styles.primary} onClick={() => startRound(opponents)} autoFocus>Next round</button>
            <a className={styles.secondary} href="#/">Home</a>
          </div>
        </Overlay>
      )}
    </main>
  );
}

function endTitle(game: DominoesState, name: string, who: (seat: number) => string): string {
  const { winner, blocked } = game.result!;
  if (winner === null) return "Nobody can play, and it's a tie";
  if (blocked) return winner === 0 ? `Nobody can play. You win, ${name}!` : `Nobody can play. ${capitalize(who(winner))} wins`;
  return winner === 0 ? `You went out first, ${name}!` : `${capitalize(who(winner))} went out first`;
}

/** "The black cat had 9 left, the orange cat 14." Everyone but the winner; on a blocked round, everyone. */
function pipsLine(game: DominoesState, who: (seat: number) => string): string {
  const { winner, blocked, pips } = game.result!;
  const seats = game.hands.map((_, seat) => seat).filter((seat) => blocked || seat !== winner);
  const parts = seats.map((seat, i) => {
    const name = seat === 0 ? (i === 0 ? 'You' : 'you') : i === 0 ? capitalize(who(seat)) : who(seat);
    return i === 0 ? `${name} had ${pips[seat]} left` : `${name} ${pips[seat]}`;
  });
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
