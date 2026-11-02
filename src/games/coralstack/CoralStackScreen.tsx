// Coral Stack (PLAN.md "Game 9: Coral Stack"): Solo, and Levels, where each level starts on uneven sand and is won by
// washing all of it away. The rules run in rules.ts; this screen keeps time (useTankLoop) and shows what happened with
// sounds, words and animation. Built from the shared falling-block parts in games/falling/.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import buttons from '../../screens/Buttons.module.css';
import { BackButton } from '../../screens/BackButton';
import { Segmented } from '../../settings/controls';
import { useSettings } from '../../settings/SettingsContext';
import { displayName } from '../../settings/settings';
import { play as playSound } from '../../sound/sfx';
import { useReducedMotion } from '../../theme/ThemeProvider';
import { Controls, type Control } from '../falling/Controls';
import { GreeterFace } from '../falling/Faces';
import { fallDistances, riseDistances } from '../falling/fallDistances';
import shared from '../falling/Falling.module.css';
import { Overlay } from '../falling/Overlay';
import { usePauseWhenHidden, usePlayKeys } from '../falling/usePlayKeys';
import { useTankGestures } from '../falling/useTankGestures';
import { useTankLoop } from '../falling/useTankLoop';
import { Block } from './Block';
import {
  COLS,
  drop,
  fall,
  landing,
  level,
  levelsFallMs,
  move,
  newTank,
  pieceCells,
  preview,
  resolve,
  ROWS_PER_LEVEL,
  sandLeft,
  sandRows,
  soloFallMs,
  turn,
  type Preview,
  type Tank,
} from './rules';
import { load, save, type Mode, type SavedCoralStack } from './storage';
import { CoralTank, TANK_ROWS, type CoralAnimation } from './Tank';

/** A moment to see the tank before the end or level card. */
const END_MS = 700;
const SIDE_W = 86;
const SIDE_GAP = 10;
/** The sand sinks once the wave has washed past. */
const SINK_DELAY = 260;

const randomSeed = () => Math.floor(Math.random() * 2 ** 31);
const commas = (n: number) => n.toLocaleString('en-US');
const NUMBER_WORDS = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight'];

const makeTank = (mode: Mode, stage = 1): Tank => newTank({ seed: randomSeed(), stage: mode === 'levels' ? stage : undefined });
const blocksIn = (t: Tank) => t.board.flat().filter(Boolean).length;

export function CoralStackScreen() {
  const { settings } = useSettings();
  const reduced = useReducedMotion();
  const name = displayName(settings);

  const [saved, setSaved] = useState<SavedCoralStack>(load);
  const mode = saved.mode;
  const levels = mode === 'levels';

  const [tank, setTank] = useState<Tank>(() => makeTank(mode));
  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [showEnd, setShowEnd] = useState(false);
  const [newBest, setNewBest] = useState(false);
  const [status, setStatus] = useState('');
  const [shout, setShout] = useState<{ text: string; id: number } | null>(null);
  const [anim, setAnim] = useState<CoralAnimation | null>(null);
  const [cell, setCell] = useState(28);

  const tankRef = useRef(tank);
  tankRef.current = tank;
  const animKey = useRef(0);
  /** Levels: the best level before this run, to tell whether this one beat it. */
  const bestBefore = useRef(saved.bestLevel);
  const areaRef = useRef<HTMLDivElement>(null);

  const over = tank.phase === 'over';
  const cleared = tank.phase === 'cleared';
  const running = started && !paused && !menuOpen && !rulesOpen && !over && !cleared;
  const dimmed = started && (paused || menuOpen || rulesOpen);
  const idleStatus = levels ? 'Wash away all the sand' : 'Fill a row from side to side';

  const update = (next: SavedCoralStack) => {
    setSaved(next);
    save(next);
  };

  // --- fit the tank to the space it has, beside the side column ---
  useLayoutEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const fit = () => {
      const w = (el.clientWidth - SIDE_W - SIDE_GAP) / COLS;
      const h = el.clientHeight / TANK_ROWS;
      setCell(Math.max(14, Math.floor(Math.min(w, h))));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Pause when the app goes to the background
  usePauseWhenHidden(useCallback(() => setPaused(true), []));

  /** The tank moves on, with the sounds, words and animation for what just happened. */
  const apply = useCallback((next: Tank) => {
    const prev = tankRef.current;
    if (next === prev) return;
    tankRef.current = next;
    setTank(next);
    const e = next.last;
    if (!e) return;
    const key = ++animKey.current;
    if (e.kind === 'lock') {
      const added = prev.piece ? pieceCells(prev.piece) : [];
      setAnim({ key, drops: fallDistances(prev.board, next.board, new Set(), added), pops: [], dropDelay: 0, waveRows: [] });
      playSound('land');
    } else if (e.kind === 'wave') {
      const { wave } = e;
      const gone = new Set<string>();
      const pops: CoralAnimation['pops'] = [];
      for (const row of wave.rows) {
        prev.board[row].forEach((c, col) => {
          gone.add(`${row},${col}`);
          if (c) pops.push({ row, col, cell: c });
        });
      }
      setAnim({ key, drops: fallDistances(prev.board, next.board, gone, []), pops, dropDelay: SINK_DELAY, waveRows: wave.rows });
      playSound('wave', 2 ** (((wave.chain - 1) * 2) / 12));
      const n = wave.rows.length;
      const plus = next.stage !== null ? '' : ` +${commas(wave.points)}`;
      if (wave.chain > 1) {
        setStatus(`Chain ×${wave.chain}! The sand filled ${n === 1 ? 'a row' : `${n} rows`}.${plus}`);
        setShout({ text: `Chain ×${wave.chain}!`, id: key });
      } else if (n > 1) {
        setStatus(`${NUMBER_WORDS[n] ?? n} rows at once!${plus}`);
        setShout({ text: `${NUMBER_WORDS[n] ?? n} rows!`, id: key });
      } else {
        setStatus(`Wave! One row washed away.${plus}`);
        setShout({ text: 'Wave!', id: key });
      }
      if (next.stage === null && level(next) > level(prev)) setStatus(`Level ${level(next)}! A little faster now`);
    } else if (e.kind === 'cleared') {
      setAnim(null);
      setStatus(e.sweep ? 'Clean sweep! Not a block left' : `Level ${level(next)} cleared!`);
      setShout({ text: e.sweep ? 'Clean sweep!' : 'All clear!', id: key });
      playSound('foundation');
    } else {
      setAnim(null);
    }
  }, []);

  useTankLoop({
    tank,
    tankRef,
    apply,
    running,
    fallMs: () => {
      const t = tankRef.current;
      return t.stage !== null ? levelsFallMs(t.stage) : soloFallMs(level(t));
    },
    reduced,
    fall,
    resolve,
  });

  // --- the end of a game, or of a level: a moment to see the tank, then the card ---
  useEffect(() => {
    if (!over && !cleared) return;
    let best = false;
    if (over && tank.stage === null && tank.score > saved.best) {
      best = true;
      update({ ...saved, best: tank.score });
    }
    if (over && tank.stage !== null) best = tank.stage > bestBefore.current;
    setNewBest(best);
    const t = setTimeout(() => {
      setShowEnd(true);
      playSound(cleared || best ? 'win' : 'boop');
    }, END_MS);
    return () => clearTimeout(t);
    // Only when a game or level ends
  }, [over, cleared]);

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

  usePlayKeys(running, press);

  /** A fresh tank: a new game in this mode, or the next level. `start` skips the Start card. */
  const begin = (m: Mode, stage: number, start: boolean) => {
    const t = makeTank(m, stage);
    tankRef.current = t;
    setTank(t);
    // In Levels the sand rises in from the bottom
    setAnim(m === 'levels' && start && !reduced
      ? { key: ++animKey.current, drops: riseDistances(t.board, sandRows(stage)), pops: [], dropDelay: 0, waveRows: [] }
      : null);
    setShout(null);
    setStatus(m === 'levels' && stage > 1 ? `Level ${stage}: wash away all the sand` : '');
    setShowEnd(false);
    setPaused(false);
    setMenuOpen(false);
    setStarted(start);
  };

  const newGame = (m: Mode, start: boolean) => {
    bestBefore.current = saved.bestLevel;
    begin(m, 1, start);
    if (start) playSound('whoosh');
  };

  const nextLevel = () => {
    const stage = level(tank) + 1;
    if (stage > saved.bestLevel) update({ ...saved, bestLevel: stage });
    begin('levels', stage, true);
    playSound('whoosh');
  };

  const changeMode = (m: Mode) => {
    if (m === mode) return;
    update({ ...saved, mode: m });
    newGame(m, false);
  };

  const modePicker = (id: string) => (
    <div className={shared.choice}>
      <span id={`${id}-mode`} className={shared.choiceLabel}>Play</span>
      <Segmented<Mode>
        labelledBy={`${id}-mode`}
        value={mode}
        onChange={changeMode}
        options={[{ value: 'solo', label: 'Solo' }, { value: 'levels', label: 'Levels' }]}
      />
    </div>
  );

  const stage = level(tank);
  const bestLevel = Math.max(saved.bestLevel, tank.stage ?? 1);
  const sand = sandLeft(tank.board);
  const higher = sandRows(stage + 1) > sandRows(stage);
  const sweep = tank.last?.kind === 'cleared' && tank.last.sweep;

  return (
    <main
      className={shared.screen}
      data-reduced={reduced}
      style={{ '--side-w': `${SIDE_W}px`, '--side-gap': `${SIDE_GAP}px` } as React.CSSProperties}
    >
      <header className={shared.topBar}>
        <BackButton />
        <h1 className={shared.title}>Coral Stack</h1>
        <span className={shared.tag}>Level {stage}</span>
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
            aria-label={levels
              ? `Your tank: ${sand} sand ${sand === 1 ? 'block' : 'blocks'} left, ${blocksIn(tank) - sand} coral`
              : `Your tank: ${blocksIn(tank)} ${blocksIn(tank) === 1 ? 'block' : 'blocks'}`}
            {...gestures}
          >
            <CoralTank board={tank.board} piece={tank.piece} landing={landing(tank)} anim={anim} smooth={!reduced} />
            {shout && <span key={shout.id} className={shared.shout} aria-hidden="true">{shout.text}</span>}
          </div>

          <aside className={shared.side} aria-label={levels ? 'Progress' : 'Score'}>
            <div className={shared.sideCard}>
              <span className={shared.sideLabel}>Next</span>
              <span className={shared.next}><NextPiece next={preview(tank)} /></span>
            </div>
            {levels ? (
              <>
                <div className={shared.sideCard}>
                  <span className={shared.sideLabel}>Level</span>
                  <span className={shared.sideValue}>{stage}</span>
                </div>
                <div className={shared.sideCard} role="img" aria-label={`Sand left: ${sand}`}>
                  <span className={shared.sideLabel}>Sand left</span>
                  <span className={shared.sandLeft} aria-hidden="true">
                    <svg width="18" height="18" viewBox="-16 -16 32 32">
                      <Block kind="sand" cx={0} cy={0} size={32} />
                    </svg>
                    <span className={shared.sideValue}>{sand}</span>
                  </span>
                </div>
                <div className={shared.sideCard}>
                  <span className={shared.sideLabel}>Best</span>
                  <span className={shared.sideValue}>{bestLevel}</span>
                </div>
              </>
            ) : (
              <>
                <div className={shared.sideCard}>
                  <span className={shared.sideLabel}>Rows</span>
                  <span className={shared.sideValue}>{commas(tank.rows)}</span>
                </div>
                <div className={shared.sideCard}>
                  <span className={shared.sideLabel}>Score</span>
                  <span className={shared.sideValue}>{commas(tank.score)}</span>
                </div>
                <div className={shared.sideCard}>
                  <span className={shared.sideLabel}>Best</span>
                  <span className={shared.sideValue}>{commas(Math.max(saved.best, tank.score))}</span>
                </div>
              </>
            )}
          </aside>
        </div>
      </div>

      <p className={shared.status} role="status">{status || idleStatus}</p>
      <Controls onPress={press} disabled={!running} />

      {menuOpen && (
        <>
          <div className={shared.scrim} onClick={() => setMenuOpen(false)} />
          <div className={`panel ${shared.menu}`} role="dialog" aria-label="Game menu">
            <button type="button" className={shared.menuItem} data-primary onClick={() => setMenuOpen(false)} autoFocus>
              {started && !over && !cleared ? 'Resume' : 'Close'}
            </button>
            {modePicker('menu')}
            <button type="button" className={shared.menuItem} onClick={() => newGame(mode, true)}>
              {levels ? 'Start over from level 1' : 'New game'}
            </button>
            <button type="button" className={shared.menuItem} onClick={() => { setMenuOpen(false); setRulesOpen(true); }}>
              How to play
            </button>
          </div>
        </>
      )}

      {rulesOpen && (
        <Overlay labelledBy="coral-rules">
          <h2 id="coral-rules" className={shared.overlayTitle}>How to play</h2>
          <ul className={shared.rules}>
            <li>Pieces of three coral blocks drift down, straight or bent. Slide them with Left and Right, or drag sideways on the tank.</li>
            <li>Turn spins the piece (or tap the tank). Drop sends it straight down (or flick down).</li>
            <li>Fill a row from side to side and a wave washes it away.</li>
            <li>Then every loose block sinks like sand into the holes below it. If that fills another row, it washes away too: a chain.</li>
            <li>
              Solo: play for as long as you can. One row scores 100, two at once 300, three 600, four 1,000, and each link
              of a chain doubles it. It gets a little faster every {ROWS_PER_LEVEL} rows.
            </li>
            <li>
              Levels: each level starts on uneven sand. Wash all the sand away to clear the level; your own coral can stay.
              Each level is a little faster, and every other level the sand starts a row higher. If the tank fills up, you
              start again from level 1.
            </li>
            <li>The game ends when a new piece has no room to come out.</li>
          </ul>
          <div className={shared.overlayButtons}>
            <button type="button" className={shared.primary} onClick={() => setRulesOpen(false)} autoFocus>Got it</button>
          </div>
        </Overlay>
      )}

      {!started && !rulesOpen && !menuOpen && (
        <Overlay labelledBy="coral-start">
          <GreeterFace eyes="open" size={90} wave className={shared.bob} />
          <h2 id="coral-start" className={shared.overlayTitle}>{levels ? `Ready to dig, ${name}?` : `Ready to stack, ${name}?`}</h2>
          <p className={shared.overlaySub}>
            {levels
              ? `Wash away all the sand to clear a level. Each level is a little faster, and the sand grows.${saved.bestLevel > 1 ? ` Your best: level ${saved.bestLevel}.` : ''}`
              : 'Fill rows from side to side. After a wave the sand sinks, and can fill another row.'}
          </p>
          {modePicker('start')}
          <div className={shared.overlayButtons}>
            <button type="button" className={shared.secondary} onClick={() => setRulesOpen(true)}>How to play</button>
            <button type="button" className={shared.primary} onClick={() => newGame(mode, true)} autoFocus>Start</button>
          </div>
        </Overlay>
      )}

      {started && paused && !over && !cleared && !menuOpen && !rulesOpen && (
        <Overlay labelledBy="coral-paused">
          <GreeterFace eyes="sleepy" size={90} />
          <h2 id="coral-paused" className={shared.overlayTitle}>Paused</h2>
          <p className={shared.overlaySub}>Your tank is waiting for you.</p>
          <div className={shared.overlayButtons}>
            <button type="button" className={shared.primary} onClick={() => setPaused(false)} autoFocus>Resume</button>
          </div>
        </Overlay>
      )}

      {showEnd && cleared && !menuOpen && !rulesOpen && (
        <Overlay labelledBy="coral-cleared">
          <GreeterFace eyes="happy" size={90} wave className={shared.bob} />
          <h2 id="coral-cleared" className={shared.overlayTitle}>{sweep ? 'Clean sweep!' : `Level ${stage} cleared!`}</h2>
          {sweep && <p className={shared.overlaySub}>Level {stage} cleared, and not a block left.</p>}
          <p className={shared.overlaySub}>
            Next: level {stage + 1}, a little faster{higher ? ', and the sand starts a row higher' : ''}.
          </p>
          <div className={shared.overlayButtons}>
            <button type="button" className={shared.primary} onClick={nextLevel} autoFocus>Next level</button>
          </div>
        </Overlay>
      )}

      {showEnd && over && levels && !menuOpen && !rulesOpen && (
        <Overlay labelledBy="coral-end">
          <GreeterFace eyes={newBest ? 'happy' : 'sleepy'} size={90} wave={newBest} className={newBest ? shared.bob : undefined} />
          <h2 id="coral-end" className={shared.overlayTitle}>{newBest ? `Your best yet, ${name}!` : 'The tank is full'}</h2>
          <p className={shared.overlayScore}>Level {stage}</p>
          <p className={shared.overlaySub}>
            {newBest ? 'The tank is full.' : `Your best is level ${saved.bestLevel}.`} The next game starts from level 1.
          </p>
          <div className={shared.overlayButtons}>
            <button type="button" className={shared.primary} onClick={() => newGame('levels', true)} autoFocus>Play again</button>
            <a className={shared.secondary} href="#/">Home</a>
          </div>
        </Overlay>
      )}

      {showEnd && over && !levels && !menuOpen && !rulesOpen && (
        <Overlay labelledBy="coral-end">
          <GreeterFace eyes={newBest ? 'happy' : 'sleepy'} size={90} wave={newBest} className={newBest ? shared.bob : undefined} />
          <h2 id="coral-end" className={shared.overlayTitle}>{newBest ? `A new best, ${name}!` : 'The tank is full'}</h2>
          <p className={shared.overlayScore}>{commas(tank.score)}</p>
          <p className={shared.overlaySub}>
            Level {stage} · {commas(tank.rows)} {tank.rows === 1 ? 'row' : 'rows'}{newBest ? '' : ` · Best ${commas(saved.best)}`}
          </p>
          <div className={shared.overlayButtons}>
            <button type="button" className={shared.primary} onClick={() => newGame('solo', true)} autoFocus>Play again</button>
            <a className={shared.secondary} href="#/">Home</a>
          </div>
        </Overlay>
      )}
    </main>
  );
}

/** The next piece, 16px a block. */
function NextPiece({ next }: { next: Preview }) {
  const cells = pieceCells({ ...next, row: 1, col: 1, turn: 0 });
  const rows = cells.map((c) => c.row), cols = cells.map((c) => c.col);
  const top = Math.min(...rows), left = Math.min(...cols);
  const w = Math.max(...cols) - left + 1, h = Math.max(...rows) - top + 1;
  return (
    <svg width={w * 16} height={h * 16} viewBox={`0 0 ${w * 32} ${h * 32}`} role="img"
      aria-label={`Next: a ${next.shape} piece`}>
      {cells.map(({ row, col }) => (
        <Block key={`${row},${col}`} kind={next.color} cx={(col - left) * 32 + 16} cy={(row - top) * 32 + 16} size={32} />
      ))}
    </svg>
  );
}
