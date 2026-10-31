import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { SUIT_PATHS } from '../../art/Suit';
import { Card } from '../../cards/Card';
import { CardBack } from '../../cards/CardBack';
import { cardId, cardName } from '../../cards/deck';
import { DeckCreature } from '../../decks/DeckCreature';
import { BackButton } from '../../screens/BackButton';
import { Segmented, Switch } from '../../settings/controls';
import { useSettings } from '../../settings/SettingsContext';
import { displayName } from '../../settings/settings';
import { play, type SoundName } from '../../sound/sfx';
import { useReducedMotion } from '../../theme/ThemeProvider';
import buttons from '../../screens/Buttons.module.css';
import { dropTarget, layout, measure, stockRect, type Metrics, type Placed } from './layout';
import {
  canAutoFinish,
  deal,
  draw,
  finishStep,
  FOUNDATION_SUITS,
  hint,
  isWon,
  legalTargets,
  moveCards,
  pickUp,
  setDrawCount,
  tapOnCard,
  tapOnPile,
  undo,
  type DrawCount,
  type Solitaire,
  type Source,
  type Tap,
  type Target,
} from './rules';
import { loadSaved, save } from './storage';
import styles from './Solitaire.module.css';

interface Drag {
  ids: string[];
  source: Source;
  startX: number;
  startY: number;
  dx: number;
  dy: number;
  active: boolean;
}

const DRAG_THRESHOLD = 6;

const faceDownCount = (g: Solitaire) => g.board.tableau.reduce((n, c) => n + c.down.length, 0);

function formatTime(ms: number): string {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = String(total % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
}

/** Moves and time, re-rendering itself each second so the table doesn't have to. */
function Stats({ moves, elapsed }: { moves: number; elapsed: () => number }) {
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);
  return <span className={styles.stats}>{moves} moves · {formatTime(elapsed())}</span>;
}

export function SolitaireScreen() {
  const { settings } = useSettings();
  const reduced = useReducedMotion();
  const saved = useMemo(() => loadSaved(), []);

  const [game, setGame] = useState<Solitaire>(() => saved?.game ?? deal());
  const [showStats, setShowStats] = useState(() => saved?.showStats ?? false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmNew, setConfirmNew] = useState(false);
  const [drag, setDrag] = useState<Drag | null>(null);
  /** Cards picked up with a tap, waiting for a tap on where they go. */
  const [selected, setSelected] = useState<Source | null>(null);
  const [hinted, setHinted] = useState<Set<string>>(new Set());
  const [hintStock, setHintStock] = useState(false);
  const [shaking, setShaking] = useState<Set<string>>(new Set());
  const [flying, setFlying] = useState<Set<string>>(new Set());
  const [finishing, setFinishing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);

  const tableRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef(game);
  gameRef.current = game;
  const elapsedRef = useRef(saved?.elapsedMs ?? 0);
  const dragRef = useRef<Drag | null>(null);
  const selectedRef = useRef(selected);
  selectedRef.current = selected;

  const won = isWon(game.board);

  // --- measuring the table ---
  useLayoutEffect(() => {
    const el = tableRef.current;
    if (!el) return;
    const update = () => setMetrics(measure(el.clientWidth, el.clientHeight));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // --- time, counted only while the app is open and a game is under way ---
  useEffect(() => {
    if (won || game.moves === 0) return;
    let last = Date.now();
    const id = setInterval(() => {
      const now = Date.now();
      if (document.visibilityState === 'visible') elapsedRef.current += now - last;
      last = now;
    }, 1000);
    return () => clearInterval(id);
  }, [won, game.moves === 0]);

  // --- autosave after every move, and when the app goes to the background ---
  const persist = useCallback(
    () => save({ game: gameRef.current, elapsedMs: elapsedRef.current, showStats }),
    [showStats],
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

  // --- layout and which cards just moved (they fly above the rest) ---
  const placed = useMemo(() => (metrics ? layout(game.board, metrics, game.drawCount) : new Map<string, Placed>()), [game, metrics]);
  const previous = useRef(placed);
  useLayoutEffect(() => {
    const moved = new Set<string>();
    for (const [id, p] of placed) {
      const before = previous.current.get(id);
      if (before && (before.x !== p.x || before.y !== p.y)) moved.add(id);
    }
    previous.current = placed;
    if (moved.size === 0) return;
    setFlying(moved);
    const t = setTimeout(() => setFlying(new Set()), 240);
    return () => clearTimeout(t);
  }, [placed]);

  // --- win: chime once when the last card lands ---
  const wasWon = useRef(won);
  useEffect(() => {
    if (won && !wasWon.current) setTimeout(() => play('win'), reduced ? 0 : 200);
    wasWon.current = won;
  }, [won, reduced]);

  // --- auto finish: one card at a time so they cascade up to the foundations ---
  useEffect(() => {
    if (!finishing) return;
    const t = setTimeout(() => {
      const step = finishStep(gameRef.current);
      if (!step) return setFinishing(false);
      setGame(step.game);
      play(step.move.type === 'draw' ? 'flip' : 'foundation');
      if (isWon(step.game.board)) setFinishing(false);
    }, reduced ? 60 : 130);
    return () => clearTimeout(t);
  }, [finishing, game, reduced]);

  // --- applying moves ---
  const commit = useCallback((next: Solitaire | null, sound: SoundName): boolean => {
    if (!next) return false;
    const flipped = faceDownCount(next) < faceDownCount(gameRef.current);
    setGame(next);
    setHinted(new Set());
    setHintStock(false);
    play(sound);
    if (flipped) setTimeout(() => play('flip'), 140);
    return true;
  }, []);

  const shake = useCallback((ids: string[]) => {
    play('invalid');
    setShaking(new Set(ids));
    setTimeout(() => setShaking(new Set()), 320);
  }, []);

  const moveTo = useCallback(
    (from: Source, to: Target) => commit(moveCards(gameRef.current, from, to), to.pile === 'foundation' ? 'foundation' : 'land'),
    [commit],
  );

  // Anything that changes the game puts picked-up cards back down
  useEffect(() => setSelected(null), [game]);

  /** Pick up, then tap where it goes: nothing moves until you choose the spot. */
  const onTap = useCallback(
    (tap: Tap) => {
      const board = gameRef.current.board;
      if (tap.type === 'select') {
        play('flip');
        setSelected(tap.source);
      } else if (tap.type === 'deselect') {
        setSelected(null);
      } else if (tap.type === 'move') {
        if (!moveTo(tap.from, tap.to)) shake(pickUp(board, tap.from).map(cardId));
      } else if (tap.type === 'invalid' && selectedRef.current) {
        shake(pickUp(board, selectedRef.current).map(cardId));
      }
    },
    [moveTo, shake],
  );

  const tapCard = (source: Source) => {
    if (finishing || won) return;
    onTap(tapOnCard(gameRef.current.board, selectedRef.current, source));
  };

  const tapPile = (to: Target) => {
    if (finishing || won) return;
    onTap(tapOnPile(gameRef.current.board, selectedRef.current, to));
  };

  const tapStock = () => {
    if (finishing || won) return;
    setSelected(null);
    commit(draw(gameRef.current), 'flip');
  };

  // --- dragging with Pointer Events ---
  const onPointerDown = (e: ReactPointerEvent, p: Placed) => {
    if (!p.source || finishing || won || e.button > 0) return;
    const ids = pickUp(gameRef.current.board, p.source).map(cardId);
    const d: Drag = { ids, source: p.source, startX: e.clientX, startY: e.clientY, dx: 0, dy: 0, active: false };
    dragRef.current = d;

    const onMove = (ev: PointerEvent) => {
      const cur = dragRef.current;
      if (!cur) return;
      const dx = ev.clientX - cur.startX;
      const dy = ev.clientY - cur.startY;
      if (!cur.active && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      const next = { ...cur, dx, dy, active: true };
      dragRef.current = next;
      setDrag(next);
      setSelected(null);
    };
    const onUp = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      const cur = dragRef.current;
      dragRef.current = null;
      setDrag(null);
      if (!cur || ev.type === 'pointercancel') return;
      if (!cur.active) return tapCard(cur.source);
      const m = metrics;
      const lead = previous.current.get(cur.ids[0]);
      if (!m || !lead) return;
      const board = gameRef.current.board;
      const rect = { x: lead.x + cur.dx, y: lead.y + cur.dy, w: m.cardW, h: m.cardH };
      const to = dropTarget(m, board, rect, legalTargets(board, cur.source));
      if (!to || !moveTo(cur.source, to)) shake(cur.ids);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  };

  // --- bottom bar ---
  const onUndo = () => {
    if (finishing) return;
    const prev = undo(gameRef.current);
    if (prev) {
      setGame(prev);
      setHinted(new Set());
    }
  };

  const onHint = () => {
    if (finishing || won) return;
    const h = hint(gameRef.current.board);
    if (!h) {
      setMessage('No moves left. Try Undo, or start a new game.');
      setTimeout(() => setMessage(null), 2800);
      return;
    }
    if (h.type === 'draw') {
      setHintStock(true);
      setTimeout(() => setHintStock(false), 1300);
    } else {
      setHinted(new Set(pickUp(gameRef.current.board, h.from).map(cardId)));
      setTimeout(() => setHinted(new Set()), 1300);
    }
  };

  const newGame = () => {
    elapsedRef.current = 0;
    setFinishing(false);
    setMenuOpen(false);
    setConfirmNew(false);
    setGame(deal(Math.random, gameRef.current.drawCount));
    play('flip');
  };

  const requestNewGame = () => {
    if (game.moves === 0 || won || confirmNew) newGame();
    else setConfirmNew(true);
  };

  const showAutoFinish = canAutoFinish(game.board) && !finishing;
  const selectedIds = new Set(selected ? pickUp(game.board, selected).map(cardId) : []);
  const name = displayName(settings);

  return (
    <main className={styles.screen} data-reduced={reduced}>
      <header className={styles.topBar}>
        <BackButton />
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>Solitaire</h1>
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
            <button type="button" className={styles.menuButton} onClick={requestNewGame}>
              {confirmNew ? 'Tap again to start over' : 'New game'}
            </button>
            <span id="sol-draw" className={styles.menuLabel}>Draw</span>
            <Segmented<`${DrawCount}`>
              labelledBy="sol-draw"
              value={`${game.drawCount}`}
              onChange={(v) => setGame((g) => setDrawCount(g, Number(v) as DrawCount))}
              options={[
                { value: '1', label: 'Draw 1' },
                { value: '3', label: 'Draw 3' },
              ]}
            />
            <div className={styles.menuRow}>
              <span id="sol-stats" className={styles.menuLabel}>Show moves and time</span>
              <Switch checked={showStats} onChange={setShowStats} labelledBy="sol-stats" />
            </div>
          </div>
        </>
      )}

      <div ref={tableRef} className={styles.table} data-mode={settings.mode}>
        {metrics && (
          <>
            <Slots
              metrics={metrics}
              game={game}
              hintStock={hintStock}
              onStock={tapStock}
              onPile={selected ? tapPile : null}
            />
            {[...placed.entries()].map(([id, p]) => {
              const dragging = drag?.active && drag.ids.includes(id);
              const x = p.x + (dragging ? drag!.dx : 0);
              const y = p.y + (dragging ? drag!.dy : 0);
              const z = dragging ? 2000 + drag!.ids.indexOf(id) : flying.has(id) ? 1000 + p.z : p.z;
              const picked = selectedIds.has(id);
              return (
                <div
                  key={id}
                  className={styles.card}
                  data-dragging={dragging || undefined}
                  data-moved={flying.has(id) || undefined}
                  style={{ transform: `translate3d(${x}px, ${y}px, 0)`, zIndex: z, width: metrics.cardW, height: metrics.cardH }}
                  role={p.source ? 'button' : undefined}
                  tabIndex={p.source ? 0 : undefined}
                  aria-label={p.faceUp ? `${cardName(p.card)}${picked ? ', picked up' : ''}` : undefined}
                  aria-hidden={p.faceUp ? undefined : true}
                  onPointerDown={(e) => onPointerDown(e, p)}
                  onKeyDown={(e) => p.source && (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), tapCard(p.source))}
                >
                  <div
                    className={styles.lift}
                    data-hinted={hinted.has(id) || undefined}
                    data-picked={picked || undefined}
                    data-shaking={shaking.has(id) || undefined}
                  >
                    <div className={styles.flipper} data-face-up={p.faceUp}>
                      <div className={styles.front}><Card card={p.card} width={metrics.cardW} /></div>
                      <div className={styles.back}><CardBack width={metrics.cardW} /></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
        {message && <p className={styles.toast} role="status">{message}</p>}
      </div>

      <footer className={styles.bottomBar}>
        <button type="button" className={styles.undo} onClick={onUndo} disabled={game.history.length === 0 || finishing}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 14L4 9l5-5" /><path d="M4 9h10a6 6 0 0 1 0 12h-3" />
          </svg>
          Undo
        </button>
        {showAutoFinish ? (
          <button type="button" className={styles.finish} onClick={() => setFinishing(true)}>Auto finish</button>
        ) : (
          <button type="button" className={styles.hint} onClick={onHint} disabled={finishing || won}>Hint</button>
        )}
      </footer>

      {won && !finishing && <WinCard name={name} moves={showStats ? game.moves : null} time={showStats ? formatTime(elapsedRef.current) : null} onNew={newGame} />}
    </main>
  );
}

/** Empty-pile outlines under the cards: stock, foundations with a faint suit, and tableau columns. */
function Slots({
  metrics: m, game, hintStock, onStock, onPile,
}: {
  metrics: Metrics; game: Solitaire; hintStock: boolean; onStock: () => void;
  /** Set while cards are picked up: a tap on a pile tries to put them there. */
  onPile: ((to: Target) => void) | null;
}) {
  const stock = stockRect(m);
  const canRecycle = game.board.stock.length === 0 && game.board.waste.length > 0;
  const box = (x: number, y: number) => ({ transform: `translate(${x}px, ${y}px)`, width: m.cardW, height: m.cardH });
  // While cards are picked up, an empty pile is a button for putting them there
  const pile = (to: Target, label: string) =>
    onPile
      ? { role: 'button', tabIndex: 0, 'aria-label': label, onClick: () => onPile(to),
          onKeyDown: (e: React.KeyboardEvent) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onPile(to)) }
      : { 'aria-hidden': true };
  return (
    <>
      <button
        type="button"
        data-silent
        className={styles.stockSlot}
        data-hinted={hintStock || undefined}
        style={box(stock.x, stock.y)}
        aria-label={game.board.stock.length ? 'Draw from the stock' : canRecycle ? 'Turn the waste back over' : 'Stock is empty'}
        onClick={onStock}
      >
        {canRecycle && (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 12a8 8 0 1 1-2.3-5.6" /><path d="M20 4v5h-5" />
          </svg>
        )}
      </button>
      {FOUNDATION_SUITS.map((suit, i) => (
        <div
          key={suit}
          className={styles.slot}
          style={box(m.pad + (3 + i) * (m.cardW + m.gap), m.top)}
          {...pile({ pile: 'foundation', index: i }, `${suit[0].toUpperCase()}${suit.slice(1)} foundation`)}
        >
          <svg width={m.cardW * 0.46} height={m.cardW * 0.46} viewBox="0 0 24 24">
            <path d={SUIT_PATHS[suit]} fill="none" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        </div>
      ))}
      {game.board.tableau.map((_, i) => (
        <div
          key={i}
          className={styles.slot}
          style={box(m.pad + i * (m.cardW + m.gap), m.row2)}
          {...pile({ pile: 'tableau', index: i }, `Column ${i + 1}`)}
        />
      ))}
    </>
  );
}

function WinCard({ name, moves, time, onNew }: { name: string; moves: number | null; time: string | null; onNew: () => void }) {
  const newRef = useRef<HTMLButtonElement>(null);
  useEffect(() => newRef.current?.focus(), []);
  return (
    <div className={styles.winScrim}>
      <div className={styles.winCard} role="dialog" aria-modal="true" aria-labelledby="sol-win-title">
        <div className={styles.cheer}>
          <DeckCreature
            sea={{ kind: 'octopus', color: '#EE8C9E', eyes: 'happy', hat: 'queen', wave: true }}
            arctic={{ kind: 'fox', suit: 'hearts', eyes: 'happy', hat: 'queen' }}
            garden={{ team: 'cheer', eyes: 'happy', hat: 'queen' }}
            size={92}
            className={styles.cheerLeft}
          />
          <DeckCreature
            sea={{ kind: 'manta', color: '#7A9EB0', eyes: 'happy', hat: 'king' }}
            arctic={{ kind: 'owl', suit: 'spades', eyes: 'happy', hat: 'king' }}
            garden={{ team: 'dealer', eyes: 'happy', hat: 'king' }}
            size={100}
            className={styles.cheerRight}
          />
        </div>
        <h2 id="sol-win-title" className={styles.winTitle}>You did it, {name}</h2>
        {moves !== null && <p className={styles.winSub}>{moves} moves · {time}</p>}
        <div className={styles.winButtons}>
          <button ref={newRef} type="button" className={styles.finish} onClick={onNew}>New game</button>
          <a className={styles.homeButton} href="#/">Home</a>
        </div>
      </div>
    </div>
  );
}
