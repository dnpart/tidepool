import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Card } from '../../cards/Card';
import { CardBack } from '../../cards/CardBack';
import { cardName, teamOf } from '../../cards/deck';
import { DECKS } from '../../decks/decks';
import { DeckCreature } from '../../decks/DeckCreature';
import { useDeck } from '../../decks/useDeck';
import buttons from '../../screens/Buttons.module.css';
import { BackButton } from '../../screens/BackButton';
import { Segmented, Switch } from '../../settings/controls';
import { useSettings } from '../../settings/SettingsContext';
import { displayName } from '../../settings/settings';
import { play } from '../../sound/sfx';
import { useReducedMotion, useTheme } from '../../theme/ThemeProvider';
import { BOARD_SIZES, closeMiss, COLUMNS, deal, flip, isFaceUp, isWon, type BoardSize, type PairsState } from './rules';
import { loadSaved, save } from './storage';
import styles from './Pairs.module.css';

const GAP = 10;
const MISS_SHOW_MS = 1000;

function formatTime(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  return `${m}:${String(total % 60).padStart(2, '0')}`;
}

/** Moves and time, re-rendering itself each second so the grid doesn't have to. */
function Stats({ moves, elapsed }: { moves: number; elapsed: () => number }) {
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);
  return <span className={styles.stats}>{moves} moves · {formatTime(elapsed())}</span>;
}

export function PairsScreen() {
  const { settings } = useSettings();
  const { octo } = useTheme();
  const suitColors = DECKS[useDeck()].suits;
  const reduced = useReducedMotion();
  const saved = useMemo(() => loadSaved(), []);

  const [game, setGame] = useState<PairsState>(() => saved?.game ?? deal(saved?.nextSize ?? 16));
  const [nextSize, setNextSize] = useState<BoardSize>(() => saved?.nextSize ?? 16);
  const [showStats, setShowStats] = useState(() => saved?.showStats ?? false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmNew, setConfirmNew] = useState(false);
  const [hopping, setHopping] = useState<number[]>([]);
  const [showWin, setShowWin] = useState(() => !!saved && isWon(saved.game));
  const [area, setArea] = useState({ w: 0, h: 0 });

  const gameRef = useRef(game);
  gameRef.current = game;
  const elapsedRef = useRef(saved?.elapsedMs ?? 0);
  const gridRef = useRef<HTMLDivElement>(null);

  const won = isWon(game);
  const started = game.moves > 0 || game.open.length > 0;

  // --- sizing: four columns that fit the screen without scrolling ---
  useLayoutEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const update = () => setArea({ w: el.clientWidth, h: el.clientHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const rows = game.size / COLUMNS;
  const cardW = Math.max(
    40,
    Math.floor(Math.min((area.w - GAP * (COLUMNS - 1)) / COLUMNS, (area.h - GAP * (rows - 1)) / rows / 1.4)),
  );

  // --- time, counted only while a game is under way and the app is open ---
  useEffect(() => {
    if (won || !started) return;
    let last = Date.now();
    const id = setInterval(() => {
      const now = Date.now();
      if (document.visibilityState === 'visible') elapsedRef.current += now - last;
      last = now;
    }, 1000);
    return () => clearInterval(id);
  }, [won, started]);

  // --- autosave ---
  const persist = useCallback(
    () => save({ game: gameRef.current, nextSize, elapsedMs: elapsedRef.current, showStats }),
    [nextSize, showStats],
  );
  useEffect(() => persist(), [game, persist]);
  useEffect(() => {
    const onHide = () => document.visibilityState === 'hidden' && persist();
    document.addEventListener('visibilitychange', onHide);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      persist();
    };
  }, [persist]);

  // --- a miss flips back after a moment ---
  useEffect(() => {
    if (game.open.length !== 2) return;
    const shown = game.open;
    const t = setTimeout(() => setGame((g) => (g.open === shown ? closeMiss(g) : g)), MISS_SHOW_MS);
    return () => clearTimeout(t);
  }, [game.open]);

  // --- the win ---
  const wasWon = useRef(won);
  useEffect(() => {
    if (won && !wasWon.current) {
      const t = setTimeout(() => {
        setShowWin(true);
        play('win');
      }, reduced ? 150 : 650);
      wasWon.current = won;
      return () => clearTimeout(t);
    }
    wasWon.current = won;
  }, [won, reduced]);

  const tap = (index: number) => {
    const r = flip(gameRef.current, index);
    if (!r) return;
    setGame(r.state);
    play('flip');
    if (r.result === 'match') {
      const pair = r.state.tiles.flatMap((t, i) => (t.matched && !gameRef.current.tiles[i].matched ? [i] : []));
      setHopping(pair);
      setTimeout(() => setHopping([]), 600);
      setTimeout(() => play('foundation'), 140);
    }
  };

  const newGame = (size: BoardSize = nextSize) => {
    elapsedRef.current = 0;
    wasWon.current = false;
    setShowWin(false);
    setMenuOpen(false);
    setConfirmNew(false);
    setGame(deal(size));
  };

  const requestNewGame = () => {
    if (!started || won || confirmNew) newGame();
    else setConfirmNew(true);
  };

  const chooseSize = (size: BoardSize) => {
    setNextSize(size);
    setConfirmNew(false);
    // Nothing flipped yet, so there's nothing to lose: switch boards right away
    if (!started) newGame(size);
  };

  const name = displayName(settings);
  const found = useMemo(() => {
    // One creature per found pair, for the win screen
    const seen = new Set<string>();
    return game.tiles
      .filter((t) => t.matched)
      .filter((t) => {
        const key = `${t.card.rank}-${teamOf(t.card.suit)}`;
        return !seen.has(key) && seen.add(key);
      })
      .map((t) => t.card);
  }, [game.tiles]);

  return (
    <main className={styles.screen} data-reduced={reduced}>
      <header className={styles.topBar}>
        <BackButton />
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>Tide Pairs</h1>
          {showStats && <Stats moves={game.moves} elapsed={() => elapsedRef.current} />}
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
            <button type="button" className={styles.primary} onClick={requestNewGame}>
              {confirmNew ? 'Tap again to start over' : 'New game'}
            </button>
            <span id="pairs-size" className={styles.menuLabel}>
              Board size{started && !won && nextSize !== game.size ? ' (next game)' : ''}
            </span>
            <Segmented<`${BoardSize}`>
              labelledBy="pairs-size"
              value={`${nextSize}`}
              onChange={(v) => chooseSize(Number(v) as BoardSize)}
              options={BOARD_SIZES.map((size) => ({ value: `${size}`, label: `${size} cards` }))}
            />
            <div className={styles.menuRow}>
              <span id="pairs-stats" className={styles.menuLabel}>Show moves and time</span>
              <Switch checked={showStats} onChange={setShowStats} labelledBy="pairs-stats" />
            </div>
          </div>
        </>
      )}

      <div className={styles.table} data-mode={settings.mode}>
        <div ref={gridRef} className={styles.gridArea}>
          {area.w > 0 && (
            <div
              className={styles.grid}
              style={{ gridTemplateColumns: `repeat(${COLUMNS}, ${cardW}px)`, gap: GAP }}
              role="grid"
              aria-label={`${game.size} cards, ${found.length} of ${game.size / 2} pairs found`}
            >
              {Array.from({ length: rows }, (_, r) => (
                <div key={r} role="row" className={styles.row}>
                  {game.tiles.slice(r * COLUMNS, (r + 1) * COLUMNS).map((tile, c) => {
                    const index = r * COLUMNS + c;
                    const up = isFaceUp(game, index);
                    const label = up
                      ? `${cardName(tile.card)}${tile.matched ? ', matched' : ''}`
                      : `Face-down card, row ${r + 1}, column ${c + 1}`;
                    return (
                      <div key={index} role="gridcell">
                        <button
                          type="button"
                          data-silent
                          className={styles.tile}
                          style={{ width: cardW, height: cardW * 1.4 }}
                          aria-label={label}
                          aria-disabled={tile.matched || undefined}
                          data-matched={tile.matched || undefined}
                          data-hop={hopping.includes(index) || undefined}
                          onClick={() => tap(index)}
                        >
                          <span className={styles.flipper} data-face-up={up}>
                            <span className={styles.front}>
                              <Card card={tile.card} width={cardW} compact eyes={tile.matched ? 'happy' : undefined} />
                            </span>
                            <span className={styles.back}>
                              <CardBack back={settings.cardBack} width={cardW} />
                            </span>
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showWin && won && (
        <div className={styles.winScrim}>
          <div className={styles.winCard} role="dialog" aria-modal="true" aria-labelledby="pairs-win-title">
            <DeckCreature
              sea={{ kind: 'octopus', color: octo, eyes: 'sleepy' }}
              arctic={{ kind: 'fox', suit: 'hearts', eyes: 'sleepy' }}
              size={96}
              className={styles.winOcto}
            />
            <h2 id="pairs-win-title" className={styles.winTitle}>All pairs found, {name}</h2>
            {showStats && <p className={styles.winSub}>{game.moves} moves · {formatTime(elapsedRef.current)}</p>}
            <div className={styles.winButtons}>
              <button type="button" className={styles.primary} onClick={() => newGame()} autoFocus>New game</button>
              <a className={styles.secondary} href="#/">Home</a>
            </div>
          </div>
          <div className={styles.peekers} aria-hidden="true">
            {found.map((card, i) => {
              const hat = card.rank === 13 ? 'king' : card.rank === 12 ? 'queen' : undefined;
              const bowtie = card.rank === 11 ? suitColors[card.suit].symbol : undefined;
              const team = teamOf(card.suit);
              return (
                <DeckCreature
                  key={i}
                  sea={{ kind: team, color: suitColors[card.suit].creature, eyes: 'happy', hat, bowtie }}
                  arctic={{ kind: team === 'octopus' ? 'fox' : 'owl', suit: card.suit, eyes: 'happy', hat, bowtie }}
                  size={50}
                  className={styles.peeker}
                  style={{ animationDelay: `${i * 60}ms` }}
                />
              );
            })}
          </div>
        </div>
      )}
    </main>
  );
}
