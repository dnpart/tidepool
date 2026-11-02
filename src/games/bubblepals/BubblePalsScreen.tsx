// Bubble Pals, Solo (PLAN.md "Game 8: Bubble Pals"). The rules run in rules.ts; this screen keeps time: the piece
// falls a row on each tick, and after it lands each chain link pops on its own beat so you can watch it happen.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { DeckCreature } from '../../decks/DeckCreature';
import buttons from '../../screens/Buttons.module.css';
import { BackButton } from '../../screens/BackButton';
import { useSettings } from '../../settings/SettingsContext';
import { displayName } from '../../settings/settings';
import { play as playSound } from '../../sound/sfx';
import { useReducedMotion, useTheme } from '../../theme/ThemeProvider';
import { Controls, type Control } from '../falling/Controls';
import { Friend, FriendDefs, FRIEND_NAMES } from '../falling/Friend';
import shared from '../falling/Falling.module.css';
import { Overlay } from '../falling/Overlay';
import { useTankGestures } from '../falling/useTankGestures';
import {
  COLS,
  drop,
  fall,
  landing,
  level,
  move,
  newTank,
  PEARL_EVERY,
  pieceCells,
  preview,
  resolve,
  ROWS,
  soloFallMs,
  turn,
  type Board,
  type Tank,
} from './rules';
import { load, save, type SavedBubblePals } from './storage';
import { TANK_ROWS, TankSvg, type TankAnimation } from './Tank';

/** The beat after a piece lands, and between links of a chain. */
const LAND_MS = 160;
const LINK_MS = 520;
const END_MS = 700;
const JELLY_LEVEL = 5;

const freshTank = () => newTank({ seed: Math.floor(Math.random() * 2 ** 31), fifthAt: JELLY_LEVEL });

/**
 * How far each friend in `after` fell, in rows, for the drop animation: friends keep their order in a column, so the
 * k-th from the bottom after is the k-th from the bottom of what was there before (minus what popped, plus the piece).
 */
function fallDistances(before: Board, after: Board, gone: Set<string>, added: { row: number; col: number }[]) {
  const drops = new Map<string, number>();
  for (let c = 0; c < COLS; c++) {
    const from: number[] = [];
    for (let r = 0; r < ROWS; r++) if (before[r][c] !== null && !gone.has(`${r},${c}`)) from.push(r);
    for (const a of added) if (a.col === c) from.push(a.row);
    from.sort((a, b) => b - a);
    const to: number[] = [];
    for (let r = ROWS - 1; r >= 0; r--) if (after[r][c] !== null) to.push(r);
    to.forEach((row, i) => {
      const src = i < from.length ? from[i] : -1 - (i - from.length);
      if (row > src) drops.set(`${row},${c}`, row - src);
    });
  }
  return drops;
}

const commas = (n: number) => n.toLocaleString('en-US');

export function BubblePalsScreen() {
  const { settings } = useSettings();
  const { octo: octoColor } = useTheme();
  const reduced = useReducedMotion();
  const name = displayName(settings);

  const [tank, setTank] = useState<Tank>(freshTank);
  const [saved, setSaved] = useState<SavedBubblePals>(load);
  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [showEnd, setShowEnd] = useState(false);
  const [newBest, setNewBest] = useState(false);
  const [status, setStatus] = useState('Pop four of a kind');
  const [shout, setShout] = useState<{ text: string; id: number } | null>(null);
  const [anim, setAnim] = useState<TankAnimation | null>(null);
  const [cell, setCell] = useState(28);

  const tankRef = useRef(tank);
  tankRef.current = tank;
  const animKey = useRef(0);
  const areaRef = useRef<HTMLDivElement>(null);

  const over = tank.phase === 'over';
  const running = started && !paused && !menuOpen && !rulesOpen && !over;
  const dimmed = started && (paused || menuOpen || rulesOpen);

  // --- fit the tank to the space it has: 6 × 12 square cells ---
  useLayoutEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    // Room for the side column (86px) and the gap (10px) beside the tank
    const fit = () => setCell(Math.max(16, Math.floor(Math.min((el.clientWidth - 96) / COLS, el.clientHeight / TANK_ROWS))));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Pause when the app goes to the background
  useEffect(() => {
    const onHide = () => document.visibilityState === 'hidden' && setPaused(true);
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, []);

  /** Moves the game on, with the sounds, words and animation for what just happened. */
  const apply = useCallback((next: Tank) => {
    const prev = tankRef.current;
    if (next === prev) return;
    tankRef.current = next;
    setTank(next);
    const e = next.last;
    if (!e) return;
    const key = ++animKey.current;
    if (e.kind === 'lock') {
      const added = prev.piece ? pieceCells(prev.piece).filter(({ cell: c }) => c !== 'pearl' || !e.wastedPearl) : [];
      setAnim({ key, drops: fallDistances(prev.board, next.board, new Set(), added), pops: [], dropDelay: 0 });
      playSound('land');
      if (e.wastedPearl) setStatus('The pearl melted away. Pearls need a friend to land on.');
    } else if (e.kind === 'pop') {
      const { link } = e;
      const gone = new Set(link.cells.map(([r, c]) => `${r},${c}`));
      const pops = link.cells.map(([row, col]) => ({ row, col, cell: prev.board[row][col]! }));
      setAnim({ key, drops: fallDistances(prev.board, next.board, gone, []), pops, dropDelay: 220 });
      if (link.pearl) {
        const kind = pops.find((p) => p.cell !== 'pearl' && p.cell !== 'clam')?.cell;
        playSound('foundation');
        setStatus(kind ? `The pearl popped every ${FRIEND_NAMES[kind][link.pals === 1 ? 0 : 1]}! +${commas(link.points)}` : 'The pearl melted away');
      } else {
        playSound('pop', 2 ** (((link.chain - 1) * 2) / 12));
        setStatus(link.chain > 1 ? `Chain ×${link.chain}! +${commas(link.points)}` : `Pop! +${commas(link.points)}`);
      }
      if (link.chain > 1) setShout({ text: `Chain ×${link.chain}!`, id: key });
      if (level(next) > level(prev)) {
        setStatus(level(next) === JELLY_LEVEL ? `Level ${JELLY_LEVEL}! The jellyfish joins in` : `Level ${level(next)}!`);
      }
    } else if (e.kind === 'settled') {
      setAnim(null);
      if (next.piece?.type === 'pearl') setStatus('A pearl! Drop it on the friends you want gone');
    }
  }, []);

  // --- time: the piece falls a row each tick; after a landing, each link resolves on its own beat ---
  useEffect(() => {
    if (!running) return;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const t = tankRef.current;
      if (t.phase === 'falling') {
        apply(fall(t));
        if (tankRef.current.phase === 'falling') timer = setTimeout(tick, soloFallMs(level(tankRef.current)));
      } else if (t.phase === 'resolving') {
        apply(resolve(t));
        if (tankRef.current.phase === 'resolving') timer = setTimeout(tick, reduced ? LINK_MS / 2 : LINK_MS);
      }
    };
    const first = tank.phase === 'falling' ? soloFallMs(level(tank)) : LAND_MS;
    timer = setTimeout(tick, first);
    return () => clearTimeout(timer);
    // Restarts only when play starts or stops, or the phase changes (moves don't reset the fall timer)
  }, [running, tank.phase, tank.dealt, apply, reduced]);

  // --- the end: a moment to see the full tank, then the card ---
  useEffect(() => {
    if (!over) return;
    const best = tank.score > saved.best;
    setNewBest(best);
    if (best) {
      const next = { ...saved, best: tank.score };
      setSaved(next);
      save(next);
    }
    const t = setTimeout(() => {
      setShowEnd(true);
      playSound(best ? 'win' : 'boop');
    }, END_MS);
    return () => clearTimeout(t);
    // Only when the game ends
  }, [over]);

  useEffect(() => {
    if (!shout) return;
    const t = setTimeout(() => setShout(null), 900);
    return () => clearTimeout(t);
  }, [shout]);

  // --- your moves ---
  const press = useCallback((c: Control) => {
    const t = tankRef.current;
    if (!running || t.phase !== 'falling') return;
    if (c === 'left' || c === 'right') apply(move(t, c === 'left' ? -1 : 1));
    else if (c === 'turn') {
      const next = turn(t);
      if (next !== t) playSound('flip');
      apply(next);
    } else apply(drop(t));
  }, [running, apply]);

  const gestures = useTankGestures({
    cellPx: cell,
    enabled: running,
    onSlide: (dx) => press(dx < 0 ? 'left' : 'right'),
    onTurn: () => press('turn'),
    onDrop: () => press('drop'),
  });

  // Keyboard: arrows to slide, up to turn, down or space to drop
  useEffect(() => {
    if (!running) return;
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, Control> = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'turn', ArrowDown: 'drop', ' ': 'drop' };
      const c = map[e.key];
      if (!c) return;
      e.preventDefault();
      press(c);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [running, press]);

  const newGame = () => {
    const fresh = freshTank();
    tankRef.current = fresh;
    setTank(fresh);
    setAnim(null);
    setShout(null);
    setStatus('Pop four of a kind');
    setShowEnd(false);
    setPaused(false);
    setMenuOpen(false);
    setStarted(true);
    playSound('whoosh');
  };

  const next = preview(tank);
  const pearlDots = Math.min(5, Math.floor((PEARL_EVERY - Math.max(0, tank.toPearl)) / 5));
  const friendsInTank = tank.board.slice(1).flat().filter(Boolean).length;

  return (
    <main className={shared.screen} data-reduced={reduced}>
      <header className={shared.topBar}>
        <BackButton />
        <h1 className={shared.title}>Bubble Pals</h1>
        <span className={shared.tag}>Level {level(tank)}</span>
        <button
          type="button"
          className={buttons.iconButton}
          aria-label="Game menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
            <circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" />
          </svg>
        </button>
      </header>

      <div className={shared.play} ref={areaRef} data-dim={dimmed || undefined} {...(dimmed ? { inert: '' } : {})}>
        <div className={shared.group}>
          <div
            className={shared.tank}
            data-mode={settings.mode}
            style={{ width: cell * COLS, height: Math.round(cell * TANK_ROWS) }}
            role="img"
            aria-label={`Your tank: ${friendsInTank} ${friendsInTank === 1 ? 'friend' : 'friends'}`}
            {...gestures}
          >
            <TankSvg board={tank.board} piece={tank.piece} landing={landing(tank)} anim={anim} smooth={!reduced} />
            {shout && <span key={shout.id} className={shared.shout} aria-hidden="true">{shout.text}</span>}
          </div>
        <aside className={shared.side} aria-label="Score">
          <div className={shared.sideCard}>
            <span className={shared.sideLabel}>Next</span>
            <svg width="40" height="76" viewBox="0 0 32 64" role="img"
              aria-label={next.type === 'pearl' ? 'Next: a pearl' : `Next: ${FRIEND_NAMES[next.other][0]} on ${FRIEND_NAMES[next.pivot][0]}`}>
              <FriendDefs />
              {next.type === 'pearl'
                ? <Friend kind="pearl" cx={16} cy={32} size={30} />
                : <><Friend kind={next.other} cx={16} cy={16} size={29} /><Friend kind={next.pivot} cx={16} cy={48} size={29} /></>}
            </svg>
          </div>
          <div className={shared.sideCard}>
            <span className={shared.sideLabel}>Score</span>
            <span className={shared.sideValue}>{commas(tank.score)}</span>
          </div>
          <div className={shared.sideCard}>
            <span className={shared.sideLabel}>Best</span>
            <span className={shared.sideValue}>{commas(Math.max(saved.best, tank.score))}</span>
          </div>
          <div className={shared.sideCard} role="img" aria-label={`Pearl: ${Math.max(0, tank.toPearl)} more friends to pop`}>
            <span className={shared.sideLabel}>Pearl</span>
            <svg width="30" height="30" viewBox="-16 -16 32 32" aria-hidden="true">
              <FriendDefs />
              <Friend kind="pearl" cx={0} cy={0} size={28} />
            </svg>
            <span className={shared.meter} aria-hidden="true">
              {[0, 1, 2, 3, 4].map((i) => <span key={i} data-on={i < pearlDots || undefined} />)}
            </span>
          </div>
        </aside>
        </div>
      </div>

      <p className={shared.status} role="status">{status}</p>
      <Controls onPress={press} disabled={!running} />

      {menuOpen && (
        <>
          <div className={shared.scrim} onClick={() => setMenuOpen(false)} />
          <div className={`panel ${shared.menu}`} role="dialog" aria-label="Game menu">
            <button type="button" className={shared.menuItem} data-primary onClick={() => setMenuOpen(false)} autoFocus>
              {started && !over ? 'Resume' : 'Close'}
            </button>
            <button type="button" className={shared.menuItem} onClick={newGame}>New game</button>
            <button type="button" className={shared.menuItem} onClick={() => { setMenuOpen(false); setRulesOpen(true); }}>
              How to play
            </button>
          </div>
        </>
      )}

      {rulesOpen && (
        <Overlay labelledBy="pals-rules">
          <h2 id="pals-rules" className={shared.overlayTitle}>How to play</h2>
          <ul className={shared.rules}>
            <li>Pairs of sea friends drift down. Slide them with Left and Right, or drag sideways on the tank.</li>
            <li>Turn swings the top friend round the bottom one (or tap the tank). Drop sends the pair straight down (or flick down).</li>
            <li>When a pair lands, each friend drops on its own as far as it can.</li>
            <li>Four or more of the same friend touching, side by side or stacked, pop.</li>
            <li>Whatever was resting on them drops, and can pop more: a chain. Each link is worth double.</li>
            <li>Every {PEARL_EVERY} friends popped, a pearl comes. It pops every friend of the kind it lands on.</li>
            <li>It gets a little faster each level. The game ends when the tank fills up where new pairs come in.</li>
          </ul>
          <div className={shared.overlayButtons}>
            <button type="button" className={shared.primary} onClick={() => setRulesOpen(false)} autoFocus>Got it</button>
          </div>
        </Overlay>
      )}

      {!started && !rulesOpen && (
        <Overlay labelledBy="pals-start">
          <DeckCreature
            sea={{ kind: 'octopus', color: octoColor, eyes: 'open', wave: true }}
            arctic={{ kind: 'fox', suit: 'diamonds', wave: true }}
            garden={{ team: 'greeter', eyes: 'open', wave: true }}
            size={96}
            className={shared.bob}
          />
          <h2 id="pals-start" className={shared.overlayTitle}>Ready to pop, {name}?</h2>
          <p className={shared.overlaySub}>Drop pairs of sea friends. Four of a kind touching pop, and what drops after can pop again.</p>
          <div className={shared.overlayButtons}>
            <button type="button" className={shared.secondary} onClick={() => setRulesOpen(true)}>How to play</button>
            <button type="button" className={shared.primary} onClick={() => setStarted(true)} autoFocus>Start</button>
          </div>
        </Overlay>
      )}

      {started && paused && !over && !menuOpen && !rulesOpen && (
        <Overlay labelledBy="pals-paused">
          <DeckCreature
            sea={{ kind: 'octopus', color: octoColor, eyes: 'sleepy' }}
            arctic={{ kind: 'fox', suit: 'diamonds', eyes: 'sleepy' }}
            garden={{ team: 'greeter', eyes: 'sleepy' }}
            size={90}
          />
          <h2 id="pals-paused" className={shared.overlayTitle}>Paused</h2>
          <p className={shared.overlaySub}>Your tank is waiting for you.</p>
          <div className={shared.overlayButtons}>
            <button type="button" className={shared.primary} onClick={() => setPaused(false)} autoFocus>Resume</button>
          </div>
        </Overlay>
      )}

      {showEnd && over && (
        <Overlay labelledBy="pals-end">
          <DeckCreature
            sea={{ kind: 'octopus', color: octoColor, eyes: newBest ? 'happy' : 'sleepy', wave: newBest }}
            arctic={{ kind: 'fox', suit: 'diamonds', eyes: newBest ? 'happy' : 'sleepy', wave: newBest }}
            garden={{ team: 'greeter', eyes: newBest ? 'happy' : 'sleepy', wave: newBest }}
            size={90}
            className={newBest ? shared.bob : undefined}
          />
          <h2 id="pals-end" className={shared.overlayTitle}>{newBest ? `A new best, ${name}!` : 'The tank is full'}</h2>
          <p className={shared.overlayScore}>{commas(tank.score)}</p>
          <p className={shared.overlaySub}>
            Level {level(tank)} · {commas(tank.popped)} friends popped{newBest ? '' : ` · Best ${commas(saved.best)}`}
          </p>
          <div className={shared.overlayButtons}>
            <button type="button" className={shared.primary} onClick={newGame} autoFocus>Play again</button>
            <a className={shared.secondary} href="#/">Home</a>
          </div>
        </Overlay>
      )}
    </main>
  );
}
