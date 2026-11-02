// Coral Stack (PLAN.md "Game 9: Coral Stack"): Solo, and Versus against the deck's racer. The rules run in rules.ts
// and the opponent in ai.ts; this screen keeps time for each tank (useTankLoop), hands sandbars between them, and
// shows what happened with sounds, words and animation. Built like Bubble Pals, from the shared parts in games/falling/.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { capitalize, DECKS } from '../../decks/decks';
import { useDeck } from '../../decks/useDeck';
import buttons from '../../screens/Buttons.module.css';
import { BackButton } from '../../screens/BackButton';
import { useSettings } from '../../settings/SettingsContext';
import { displayName } from '../../settings/settings';
import { play as playSound } from '../../sound/sfx';
import { useReducedMotion } from '../../theme/ThemeProvider';
import { Controls, type Control } from '../falling/Controls';
import { GreeterFace, RacerFace } from '../falling/Faces';
import { fallDistances, riseDistances } from '../falling/fallDistances';
import shared from '../falling/Falling.module.css';
import { Incoming } from '../falling/Incoming';
import { ModePicker } from '../falling/ModePicker';
import { Overlay } from '../falling/Overlay';
import { PACE_NAMES } from '../falling/speed';
import { usePauseWhenHidden, usePlayKeys } from '../falling/usePlayKeys';
import { useTankGestures } from '../falling/useTankGestures';
import { useTankLoop } from '../falling/useTankLoop';
import { choosePlacement, nextPress } from './ai';
import { Block } from './Block';
import {
  COLS,
  drop,
  exchange,
  fall,
  landing,
  level,
  move,
  newTank,
  pieceCells,
  preview,
  resolve,
  ROWS_PER_LEVEL,
  soloFallMs,
  turn,
  versusFallMs,
  type Pace,
  type Preview,
  type Tank,
} from './rules';
import { load, save, type Mode, type SavedCoralStack } from './storage';
import { CoralTank, TANK_ROWS, type CoralAnimation } from './Tank';

const END_MS = 700;
/** The opponent's thinking time when a piece comes out, and the time between its presses. */
const OPPONENT: Record<Pace, { think: number; press: number }> = {
  gentle: { think: 900, press: 280 },
  steady: { think: 550, press: 180 },
  quick: { think: 300, press: 110 },
};
const SIDE_W: Record<Mode, number> = { solo: 86, versus: 108 };
const SIDE_GAP = 10;
/** Height of the "sandbars coming" row over your tank in Versus. */
const INCOMING_H = 26;
const MINI_CELL = 12;
/** The sand sinks once the wave has washed past. */
const SINK_DELAY = 260;

const randomSeed = () => Math.floor(Math.random() * 2 ** 31);
const commas = (n: number) => n.toLocaleString('en-US');
const sandbars = (n: number) => `${n} ${n === 1 ? 'sandbar' : 'sandbars'}`;
const NUMBER_WORDS = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight'];
const SAND = <Block kind="sand" cx={0} cy={0} size={30} />;

/** Both sides of Versus share a seed, so they get the same pieces. */
function makeTanks(): [Tank, Tank] {
  const seed = randomSeed();
  return [newTank({ seed }), newTank({ seed })];
}

const blocksIn = (t: Tank) => t.board.flat().filter(Boolean).length;

export function CoralStackScreen() {
  const { settings } = useSettings();
  const reduced = useReducedMotion();
  const name = displayName(settings);
  const rival = DECKS[useDeck()].names.opponent;

  const [saved, setSaved] = useState<SavedCoralStack>(load);
  const mode = saved.mode;
  const versus = mode === 'versus';
  const pace = saved.pace;

  const [first] = useState(makeTanks);
  const [tank, setTank] = useState<Tank>(first[0]);
  const [opp, setOpp] = useState<Tank>(first[1]);
  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [showEnd, setShowEnd] = useState(false);
  const [newBest, setNewBest] = useState(false);
  const [status, setStatus] = useState('');
  const [shout, setShout] = useState<{ text: string; id: number } | null>(null);
  const [anim, setAnim] = useState<CoralAnimation | null>(null);
  const [oppBusy, setOppBusy] = useState(false);
  const [cell, setCell] = useState(28);

  const tankRef = useRef(tank);
  tankRef.current = tank;
  const oppRef = useRef(opp);
  oppRef.current = opp;
  const animKey = useRef(0);
  const seconds = useRef(0);
  const areaRef = useRef<HTMLDivElement>(null);

  const youLost = tank.phase === 'over';
  const oppLost = versus && opp.phase === 'over';
  const over = youLost || oppLost;
  const running = started && !paused && !menuOpen && !rulesOpen && !over;
  const dimmed = started && (paused || menuOpen || rulesOpen);
  const idleStatus = versus ? 'First tank to fill up loses' : 'Fill a row from side to side';

  const update = (next: SavedCoralStack) => {
    setSaved(next);
    save(next);
  };

  // --- fit your tank to the space it has, beside the side column ---
  useLayoutEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const fit = () => {
      const w = (el.clientWidth - SIDE_W[mode] - SIDE_GAP) / COLS;
      const h = (el.clientHeight - (mode === 'versus' ? INCOMING_H : 0)) / TANK_ROWS;
      setCell(Math.max(14, Math.floor(Math.min(w, h))));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [mode]);

  // Pause when the app goes to the background
  usePauseWhenHidden(useCallback(() => setPaused(true), []));

  // Versus speeds up with playing time (pauses don't count)
  useEffect(() => {
    if (!running || !versus) return;
    const t = setInterval(() => { seconds.current += 1; }, 1000);
    return () => clearInterval(t);
  }, [running, versus]);

  /** Sandbars either side has sent go into the other's waiting row. */
  const passSandbars = useCallback(() => {
    const a = tankRef.current, b = oppRef.current;
    if (!a.outgoing && !b.outgoing) return;
    const [a2, b2] = exchange(a, b);
    tankRef.current = a2;
    oppRef.current = b2;
    setTank(a2);
    setOpp(b2);
    if (b.outgoing) {
      setStatus(`The ${rival} sent ${sandbars(b.outgoing)}`);
      playSound('whoosh');
    }
  }, [rival]);

  /** Your tank moves on, with the sounds, words and animation for what just happened. */
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
      const plus = `+${commas(wave.points)}`;
      if (wave.chain > 1) {
        setStatus(`Chain ×${wave.chain}! The sand filled ${n === 1 ? 'a row' : `${n} rows`}. ${plus}`);
        setShout({ text: `Chain ×${wave.chain}!`, id: key });
      } else if (n > 1) {
        setStatus(`${NUMBER_WORDS[n] ?? n} rows at once! ${plus}`);
        setShout({ text: `${NUMBER_WORDS[n] ?? n} rows!`, id: key });
      } else {
        setStatus(`Wave! One row washed away. ${plus}`);
        setShout({ text: 'Wave!', id: key });
      }
      if (!versus && level(next) > level(prev)) setStatus(`Level ${level(next)}! A little faster now`);
    } else if (e.kind === 'settled') {
      if (e.sandbars) {
        setAnim({ key, drops: riseDistances(next.board, e.sandbars), pops: [], dropDelay: 0, waveRows: [] });
        playSound('thunk');
      } else setAnim(null);
      const words = [
        versus && e.sent ? `${capitalize(sandbars(e.sent))} for the ${rival}!` : '',
        e.cancelled ? `You cancelled ${sandbars(e.cancelled)}.` : '',
        e.sandbars ? `${e.sandbars === 1 ? 'A sandbar' : capitalize(sandbars(e.sandbars))} pushed up: fill the gap to wash ${e.sandbars === 1 ? 'it' : 'them'} away.` : '',
      ].filter(Boolean);
      if (words.length) setStatus(words.join(' '));
      if (versus && e.sent) playSound('whoosh');
      if (versus) passSandbars();
    }
  }, [versus, rival, passSandbars]);

  /** The opponent's tank moves on: quietly, apart from passing sandbars. */
  const applyOpp = useCallback((next: Tank) => {
    if (next === oppRef.current) return;
    oppRef.current = next;
    setOpp(next);
    const e = next.last;
    if (e?.kind === 'wave' && (e.wave.chain > 1 || e.wave.rows.length > 1)) setOppBusy(true);
    if (e?.kind === 'settled') {
      setOppBusy(false);
      passSandbars();
    }
  }, [passSandbars]);

  useTankLoop({
    tank,
    tankRef,
    apply,
    running,
    fallMs: () => (versus ? versusFallMs(pace, seconds.current) : soloFallMs(level(tankRef.current))),
    reduced,
    fall,
    resolve,
  });
  useTankLoop({
    tank: opp,
    tankRef: oppRef,
    apply: applyOpp,
    running: running && versus,
    fallMs: () => versusFallMs(pace, seconds.current),
    reduced,
    fall,
    resolve,
  });

  // --- the opponent: picks a place when its piece comes out, then presses its way there and drops ---
  useEffect(() => {
    if (!running || !versus || opp.phase !== 'falling') return;
    const timing = OPPONENT[pace];
    const target = choosePlacement(oppRef.current, pace);
    let timer: ReturnType<typeof setTimeout>;
    const step = () => {
      const t = oppRef.current;
      if (t.phase !== 'falling') return;
      const p = nextPress(t, target);
      if (p === 'drop') return applyOpp(drop(t));
      applyOpp(p === 'turn' ? turn(t) : move(t, p === 'left' ? -1 : 1));
      timer = setTimeout(step, timing.press);
    };
    timer = setTimeout(step, timing.think);
    return () => clearTimeout(timer);
  }, [running, versus, opp.phase, opp.dealt, pace, applyOpp]);

  // --- the end: a moment to see the tanks, then the card ---
  useEffect(() => {
    if (!over) return;
    let best = false;
    if (versus) {
      const tally: [number, number] = youLost ? [saved.tally[0], saved.tally[1] + 1] : [saved.tally[0] + 1, saved.tally[1]];
      update({ ...saved, tally });
    } else if (tank.score > saved.best) {
      best = true;
      update({ ...saved, best: tank.score });
    }
    setNewBest(best);
    const t = setTimeout(() => {
      setShowEnd(true);
      playSound(versus ? (youLost ? 'boop' : 'win') : best ? 'win' : 'boop');
    }, END_MS);
    return () => clearTimeout(t);
    // Only when a game ends
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

  usePlayKeys(running, press);

  /** A fresh game in this mode; `start` skips the Start card. */
  const reset = (start: boolean) => {
    const [a, b] = makeTanks();
    tankRef.current = a;
    oppRef.current = b;
    setTank(a);
    setOpp(b);
    seconds.current = 0;
    setAnim(null);
    setShout(null);
    setOppBusy(false);
    setStatus('');
    setShowEnd(false);
    setPaused(false);
    setMenuOpen(false);
    setStarted(start);
    if (start) playSound('whoosh');
  };

  const changeMode = (m: Mode) => {
    if (m === mode) return;
    update({ ...saved, mode: m });
    reset(false);
  };

  const modePicker = (id: string) => (
    <ModePicker id={id} mode={mode} pace={pace} rival={rival} onMode={changeMode} onPace={(p) => update({ ...saved, pace: p })} />
  );

  return (
    <main
      className={shared.screen}
      data-reduced={reduced}
      style={{ '--side-w': `${SIDE_W[mode]}px`, '--side-gap': `${SIDE_GAP}px` } as React.CSSProperties}
    >
      <header className={shared.topBar}>
        <BackButton />
        <h1 className={shared.title}>Coral Stack</h1>
        <span className={shared.tag}>{versus ? PACE_NAMES[pace] : `Level ${level(tank)}`}</span>
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
          <div className={shared.tankColumn}>
            {versus && <Incoming count={tank.incoming} width={cell * COLS} words={sandbars} icon={SAND} />}
            <div
              className={shared.tank}
              data-mode={settings.mode}
              style={{ width: cell * COLS, height: Math.round(cell * TANK_ROWS) }}
              role="img"
              aria-label={`Your tank: ${blocksIn(tank)} ${blocksIn(tank) === 1 ? 'block' : 'blocks'}`}
              {...gestures}
            >
              <CoralTank board={tank.board} piece={tank.piece} landing={landing(tank)} anim={anim} smooth={!reduced} />
              {shout && <span key={shout.id} className={shared.shout} aria-hidden="true">{shout.text}</span>}
            </div>
          </div>

          {versus ? (
            <aside className={shared.side} aria-label={`The ${rival}`}>
              <div className={shared.sideCard}>
                <div className={shared.avatar} data-busy={oppBusy || undefined}>
                  <RacerFace eyes={oppLost ? 'sleepy' : oppBusy ? 'happy' : 'open'} size={52} />
                </div>
                <span className={shared.sideName}>The {rival}</span>
              </div>
              <div className={shared.mini}>
                <Incoming count={opp.incoming} width={MINI_CELL * COLS} small words={sandbars} icon={SAND} />
                <div
                  className={shared.tank}
                  data-mode={settings.mode}
                  style={{ width: MINI_CELL * COLS, height: Math.round(MINI_CELL * TANK_ROWS), borderRadius: 9 }}
                  role="img"
                  aria-label={`The ${rival}'s tank: ${blocksIn(opp)} blocks${opp.incoming ? `, ${sandbars(opp.incoming)} coming` : ''}`}
                >
                  <CoralTank board={opp.board} piece={opp.piece} landing={null} anim={null} smooth={false} />
                </div>
              </div>
              <div className={shared.sideCard} role="img" aria-label={`Wins: you ${saved.tally[0]}, the ${rival} ${saved.tally[1]}`}>
                <span className={shared.sideLabel}>Wins</span>
                <span className={shared.wins} aria-hidden="true">
                  <span>You</span><b>{saved.tally[0]}</b>
                  <span>{capitalize(rival)}</span><b>{saved.tally[1]}</b>
                </span>
              </div>
            </aside>
          ) : (
            <aside className={shared.side} aria-label="Score">
              <div className={shared.sideCard}>
                <span className={shared.sideLabel}>Next</span>
                <span className={shared.next}><NextPiece next={preview(tank)} /></span>
              </div>
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
            </aside>
          )}
        </div>
      </div>

      <p className={shared.status} role="status">{status || idleStatus}</p>
      <Controls onPress={press} disabled={!running} />

      {menuOpen && (
        <>
          <div className={shared.scrim} onClick={() => setMenuOpen(false)} />
          <div className={`panel ${shared.menu}`} role="dialog" aria-label="Game menu">
            <button type="button" className={shared.menuItem} data-primary onClick={() => setMenuOpen(false)} autoFocus>
              {started && !over ? 'Resume' : 'Close'}
            </button>
            {modePicker('menu')}
            <button type="button" className={shared.menuItem} onClick={() => reset(true)}>New game</button>
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
            <li>Then every loose block sinks like sand into the holes below it. If that fills another row, it washes away too: a chain, worth double.</li>
            <li>One row scores 100, two at once 300, three 600, four 1,000.</li>
            <li>Solo gets a little faster every {ROWS_PER_LEVEL} rows. It ends when a new piece has no room to come out.</li>
            <li>
              Versus: washing two or more rows at once, or a chain, sends sandbars into the {rival}'s tank. They push up
              from the bottom, each with one gap; fill the gap to wash the sandbar away. Your waves cancel sandbars coming
              your way first. The first tank to fill up loses.
            </li>
          </ul>
          <div className={shared.overlayButtons}>
            <button type="button" className={shared.primary} onClick={() => setRulesOpen(false)} autoFocus>Got it</button>
          </div>
        </Overlay>
      )}

      {!started && !rulesOpen && !menuOpen && (
        <Overlay labelledBy="coral-start">
          {versus ? <RacerFace eyes="open" size={90} wave className={shared.bob} /> : <GreeterFace eyes="open" size={90} wave className={shared.bob} />}
          <h2 id="coral-start" className={shared.overlayTitle}>{versus ? `Ready for a race, ${name}?` : `Ready to stack, ${name}?`}</h2>
          <p className={shared.overlaySub}>
            {versus
              ? `Wash two rows at once, or set off a chain, to send sandbars into the ${rival}'s tank. First tank to fill up loses.`
              : 'Fill rows from side to side. After a wave the sand sinks, and can fill another row.'}
          </p>
          {modePicker('start')}
          <div className={shared.overlayButtons}>
            <button type="button" className={shared.secondary} onClick={() => setRulesOpen(true)}>How to play</button>
            <button type="button" className={shared.primary} onClick={() => setStarted(true)} autoFocus>Start</button>
          </div>
        </Overlay>
      )}

      {started && paused && !over && !menuOpen && !rulesOpen && (
        <Overlay labelledBy="coral-paused">
          {versus ? <RacerFace eyes="sleepy" size={90} /> : <GreeterFace eyes="sleepy" size={90} />}
          <h2 id="coral-paused" className={shared.overlayTitle}>Paused</h2>
          <p className={shared.overlaySub}>{versus ? `The ${rival} is waiting for you.` : 'Your tank is waiting for you.'}</p>
          <div className={shared.overlayButtons}>
            <button type="button" className={shared.primary} onClick={() => setPaused(false)} autoFocus>Resume</button>
          </div>
        </Overlay>
      )}

      {showEnd && over && versus && (
        <Overlay labelledBy="coral-end">
          <RacerFace eyes={youLost ? 'open' : 'happy'} size={90} wave className={shared.bob} />
          <h2 id="coral-end" className={shared.overlayTitle}>{youLost ? `The ${rival} won this one` : `You won, ${name}!`}</h2>
          <p className={shared.overlaySub}>
            {youLost ? 'Your tank filled up first.' : `The ${rival}'s tank filled up first.`} You {saved.tally[0]} · {capitalize(rival)} {saved.tally[1]}
          </p>
          <div className={shared.overlayButtons}>
            <button type="button" className={shared.primary} onClick={() => reset(true)} autoFocus>Play again</button>
            <a className={shared.secondary} href="#/">Home</a>
          </div>
        </Overlay>
      )}

      {showEnd && over && !versus && (
        <Overlay labelledBy="coral-end">
          <GreeterFace eyes={newBest ? 'happy' : 'sleepy'} size={90} wave={newBest} className={newBest ? shared.bob : undefined} />
          <h2 id="coral-end" className={shared.overlayTitle}>{newBest ? `A new best, ${name}!` : 'The tank is full'}</h2>
          <p className={shared.overlayScore}>{commas(tank.score)}</p>
          <p className={shared.overlaySub}>
            Level {level(tank)} · {commas(tank.rows)} {tank.rows === 1 ? 'row' : 'rows'}{newBest ? '' : ` · Best ${commas(saved.best)}`}
          </p>
          <div className={shared.overlayButtons}>
            <button type="button" className={shared.primary} onClick={() => reset(true)} autoFocus>Play again</button>
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
