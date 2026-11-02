// Tide Swap (PLAN.md "Game 10: Tide Swap"): Solo, and Versus against the deck's racer. The rules run in rules.ts and
// the opponent in ai.ts; this screen keeps time for each side (useTankLoop), hands pebbles between them, and shows what
// happened with sounds, words and animation. Built from the shared falling-block parts in games/falling/.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { capitalize, DECKS } from '../../decks/decks';
import { useDeck } from '../../decks/useDeck';
import buttons from '../../screens/Buttons.module.css';
import { BackButton } from '../../screens/BackButton';
import { useSettings } from '../../settings/SettingsContext';
import { displayName } from '../../settings/settings';
import { play as playSound } from '../../sound/sfx';
import { useReducedMotion } from '../../theme/ThemeProvider';
import { GreeterFace, RacerFace } from '../falling/Faces';
import { Friend, FRIEND_NAMES } from '../falling/Friend';
import shared from '../falling/Falling.module.css';
import { Incoming } from '../falling/Incoming';
import { ModePicker } from '../falling/ModePicker';
import { Overlay } from '../falling/Overlay';
import { PACE_NAMES } from '../falling/speed';
import { usePauseWhenHidden } from '../falling/usePlayKeys';
import { useTankLoop } from '../falling/useTankLoop';
import { chooseSwaps } from './ai';
import { Board, boardWidth, MiniBoard, NEXT_H, NextRow, PEEK, type Effect, type Geometry } from './Board';
import {
  COLS,
  exchange,
  fall,
  HEIGHT,
  isPal,
  level,
  MATCHES_PER_LEVEL,
  newTank,
  resolve,
  soloFallMs,
  swap,
  versusFallMs,
  type Item,
  type Landing,
  type Pace,
  type Tank,
} from './rules';
import { load, save, type Mode, type SavedTideSwap } from './storage';
import styles from './TideSwap.module.css';

const END_MS = 700;
/** The opponent's thinking time when a drop comes, and the time between its taps. */
const OPPONENT: Record<Pace, { think: number; press: number }> = {
  gentle: { think: 1100, press: 450 },
  steady: { think: 650, press: 300 },
  quick: { think: 350, press: 170 },
};
const SIDE_W = 108;
const SIDE_GAP = 10;
/** Room above the columns (Score and Best, or "pebbles coming", then the Next boxes) and below them (the swap buttons). */
const LINE_H = 26;
const ABOVE = LINE_H + NEXT_H + 6;
const BELOW = 62;
const MINI_CELL = 20;
const EFFECT_MS = 800;
/** Milliseconds a slot while you hold the columns to hurry the drop down. */
const HURRY_MS = 50;
/** A finger held this long without moving sideways hurries the drop; moving this far sideways first is a drag. */
const HOLD_MS = 160;
const DRAG_START_PX = 10;

const randomSeed = () => Math.floor(Math.random() * 2 ** 31);
const commas = (n: number) => n.toLocaleString('en-US');
const pebbles = (n: number) => `${n} ${n === 1 ? 'pebble' : 'pebbles'}`;
const PEBBLE = <Friend kind="pebble" cx={0} cy={0} size={30} />;

/** Both sides of Versus share a seed, so they get the same drops. */
function makeTanks(): [Tank, Tank] {
  const seed = randomSeed();
  return [newTank({ seed }), newTank({ seed })];
}

/**
 * Slots and columns from the room there is: slots as tall as the height allows, columns as wide as the width allows,
 * but neither more than a third bigger than the other (Solo has room for wider columns; Versus for taller slots).
 */
function fitGeometry(width: number, height: number, versus: boolean): Geometry {
  const gap = versus ? 6 : 10;
  const byWidth = (width - (COLS - 1) * gap) / COLS;
  const byHeight = (height - ABOVE - BELOW - PEEK) / HEIGHT;
  const cell = Math.floor(Math.max(28, Math.min(byHeight, byWidth * 1.35, 72)));
  const colW = Math.floor(Math.max(28, Math.min(byWidth, cell * 1.3)));
  return { cell, colW, gap };
}

const itemsIn = (t: Tank) => t.stacks.reduce((n, s) => n + s.length, 0);

/** What a landing takes away, for the board to show leaving. */
function effectFor(stackBefore: readonly Item[], l: Landing, key: number): Effect | null {
  const slot = stackBefore.length;
  if (l.result === 'match') {
    return { key, col: l.col, kind: 'match', items: [{ slot: slot - 1, item: l.item }, { slot, item: l.item }], center: slot };
  }
  if (l.result === 'clam') {
    const bottom = stackBefore.lastIndexOf('bottom');
    const items = stackBefore.slice(bottom).map((item, i) => ({ slot: bottom + i, item }));
    return { key, col: l.col, kind: 'clam', items: [...items, { slot, item: 'top' }], center: (bottom + slot) / 2 };
  }
  if (l.result === 'melt') return { key, col: l.col, kind: 'melt', items: [{ slot, item: 'top' }], center: slot };
  return null;
}

export function TideSwapScreen() {
  const { settings } = useSettings();
  const reduced = useReducedMotion();
  const name = displayName(settings);
  const rival = DECKS[useDeck()].names.opponent;

  const [saved, setSaved] = useState<SavedTideSwap>(load);
  const mode = saved.mode;
  const versus = mode === 'versus';
  const pace = saved.pace;

  const [first] = useState(makeTanks);
  const [tank, setTank] = useState<Tank>(first[0]);
  const [opp, setOpp] = useState<Tank>(first[1]);
  const [ids, setIds] = useState([0, 1, 2, 3]);
  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [showEnd, setShowEnd] = useState(false);
  const [newBest, setNewBest] = useState(false);
  const [status, setStatus] = useState('');
  const [shout, setShout] = useState<{ text: string; id: number } | null>(null);
  const [effects, setEffects] = useState<Effect[]>([]);
  /** Held down (finger on the columns, or Space / Down arrow): the drop falls fast. */
  const [hurry, setHurry] = useState(false);
  const [oppBusy, setOppBusy] = useState(false);
  const [geo, setGeo] = useState<Geometry>({ cell: 48, colW: 56, gap: 10 });

  const tankRef = useRef(tank);
  tankRef.current = tank;
  const oppRef = useRef(opp);
  oppRef.current = opp;
  const effectKey = useRef(0);
  const seconds = useRef(0);
  const areaRef = useRef<HTMLDivElement>(null);

  const youLost = tank.phase === 'over';
  const oppLost = versus && opp.phase === 'over';
  const over = youLost || oppLost;
  const running = started && !paused && !menuOpen && !rulesOpen && !over;
  const dimmed = started && (paused || menuOpen || rulesOpen);
  const idleStatus = versus ? 'First to overflow a column loses' : 'Swap columns so friends land on their twins';

  const update = (next: SavedTideSwap) => {
    setSaved(next);
    save(next);
  };

  // --- fit the columns to the space they have (beside the side column in Versus) ---
  useLayoutEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const fit = () => setGeo(fitGeometry(el.clientWidth - (versus ? SIDE_W + SIDE_GAP : 0), el.clientHeight, versus));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [versus]);

  // Pause when the app goes to the background
  usePauseWhenHidden(useCallback(() => setPaused(true), []));

  // Versus speeds up with playing time (pauses don't count)
  useEffect(() => {
    if (!running || !versus) return;
    const t = setInterval(() => { seconds.current += 1; }, 1000);
    return () => clearInterval(t);
  }, [running, versus]);

  const fallMs = useCallback(
    () => (hurry ? HURRY_MS : versus ? versusFallMs(pace, seconds.current) : soloFallMs(level(tankRef.current))),
    [hurry, versus, pace],
  );

  // Letting go of everything when play stops (pause, menu, the end) so a drop never stays hurried
  useEffect(() => {
    if (!running) setHurry(false);
  }, [running]);

  /** Pebbles either side has sent go into the other's waiting row. */
  const passPebbles = useCallback(() => {
    const a = tankRef.current, b = oppRef.current;
    if (!a.outgoing && !b.outgoing) return;
    const [a2, b2] = exchange(a, b);
    tankRef.current = a2;
    oppRef.current = b2;
    setTank(a2);
    setOpp(b2);
    if (b.outgoing) {
      setStatus(`The ${rival} sent ${pebbles(b.outgoing)}`);
      playSound('whoosh');
    }
  }, [rival]);

  /** Your side moves on, with the sounds, words and animation for what just happened. */
  const apply = useCallback((next: Tank) => {
    const prev = tankRef.current;
    if (next === prev) return;
    tankRef.current = next;
    setTank(next);
    const e = next.last;
    if (!e) return;
    if (e.kind === 'swap') {
      setIds((cur) => {
        const out = [...cur];
        [out[e.at], out[e.at + 1]] = [out[e.at + 1], out[e.at]];
        return out;
      });
    } else if (e.kind === 'land') {
      const added: Effect[] = [];
      for (const l of e.landings) {
        const fx = effectFor(prev.stacks[l.col], l, ++effectKey.current);
        if (fx) added.push(fx);
      }
      if (added.length) {
        setEffects((cur) => [...cur, ...added]);
        const keys = new Set(added.map((a) => a.key));
        setTimeout(() => setEffects((cur) => cur.filter((x) => !keys.has(x.key))), EFFECT_MS);
      }
      const of = (r: Landing['result']) => e.landings.filter((l) => l.result === r);
      const clams = of('clam'), matches = of('match').filter((l) => l.item !== 'pebble');
      const pebblePairs = of('match').filter((l) => l.item === 'pebble'), melts = of('melt'), stacked = of('stack');
      const points = e.landings.reduce((n, l) => n + l.points, 0);
      if (clams.length) {
        const inside = clams.reduce((n, l) => n + l.inside, 0);
        setStatus(inside
          ? `Clam closed with ${inside} ${inside === 1 ? 'friend' : 'friends'} inside! +${commas(points)}`
          : `Clam closed! +${commas(points)}`);
        setShout({ text: 'Clam closed!', id: effectKey.current });
        playSound('foundation');
      } else if (matches.length) {
        const kind = matches[0].item;
        setStatus(matches.length > 1
          ? `Two pairs swam away! +${points}`
          : `The ${isPal(kind) ? FRIEND_NAMES[kind][1] : 'friends'} swam away. +${points}`);
        if (matches.length > 1) setShout({ text: 'Two pairs!', id: effectKey.current });
        playSound('pop', matches.length > 1 ? 2 ** (2 / 12) : 1);
      } else if (pebblePairs.length) {
        setStatus('Two pebbles crumbled away');
        playSound('pop', 0.75);
      } else if (melts.length) {
        setStatus('The top shell melted: it needs a bottom shell below it');
        playSound('invalid');
      } else if (stacked.length) {
        playSound(stacked.some((l) => l.item === 'pebble') ? 'thunk' : 'land');
      }
      if (!versus && level(next) > level(prev)) setStatus(`Level ${level(next)}! A little faster now`);
    } else if (e.kind === 'settled') {
      const words = [
        versus && e.sent ? `${capitalize(pebbles(e.sent))} for the ${rival}!` : '',
        e.cancelled ? `You cancelled ${pebbles(e.cancelled)}.` : '',
        e.pebbles ? `${capitalize(pebbles(e.pebbles))} coming down.` : '',
      ].filter(Boolean);
      if (words.length) setStatus(words.join(' '));
      if (versus && e.sent) playSound('whoosh');
      if (versus) passPebbles();
    }
  }, [versus, rival, passPebbles]);

  /** The opponent's side moves on: quietly, apart from passing pebbles. */
  const applyOpp = useCallback((next: Tank) => {
    if (next === oppRef.current) return;
    oppRef.current = next;
    setOpp(next);
    const e = next.last;
    if (e?.kind === 'land' && (e.landings.some((l) => l.result === 'clam') || e.landings.filter((l) => l.result === 'match').length > 1)) {
      setOppBusy(true);
    }
    if (e?.kind === 'settled') {
      setOppBusy(false);
      passPebbles();
    }
  }, [passPebbles]);

  useTankLoop({ tank, tankRef, apply, running, fallMs, reduced, fall, resolve, restartKey: hurry });
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

  // --- the opponent: picks an order for its stacks when a drop comes, then taps its swaps ---
  useEffect(() => {
    if (!running || !versus || opp.phase !== 'falling') return;
    const timing = OPPONENT[pace];
    const taps = chooseSwaps(oppRef.current, pace);
    let i = 0;
    let timer: ReturnType<typeof setTimeout>;
    const step = () => {
      const t = oppRef.current;
      if (t.phase === 'over' || i >= taps.length) return;
      applyOpp(swap(t, taps[i++]));
      timer = setTimeout(step, timing.press);
    };
    timer = setTimeout(step, timing.think);
    return () => clearTimeout(timer);
  }, [running, versus, opp.phase, opp.dealt, pace, applyOpp]);

  // --- the end: a moment to see the columns, then the card ---
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

  // --- your swaps ---
  const doSwap = useCallback((at: number) => {
    const t = tankRef.current;
    if (!running || t.phase === 'over') return;
    playSound('flip');
    apply(swap(t, at));
  }, [running, apply]);

  // Keyboard: 1, 2 and 3 tap the swap buttons; hold Space or the Down arrow to hurry the drop down
  useEffect(() => {
    if (!running) return;
    const isHurryKey = (e: KeyboardEvent) => e.key === ' ' || e.key === 'ArrowDown';
    const onKey = (e: KeyboardEvent) => {
      if (isHurryKey(e)) {
        e.preventDefault();
        if (!e.repeat) setHurry(true);
        return;
      }
      const at = ['1', '2', '3'].indexOf(e.key);
      if (at < 0) return;
      e.preventDefault();
      doSwap(at);
    };
    const onKeyUp = (e: KeyboardEvent) => { if (isHurryKey(e)) setHurry(false); };
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [running, doSwap]);

  /**
   * A finger (or the mouse) on the columns: dragging sideways carries the column under it over to its neighbor, a swap
   * at a time (each time the finger passes half a column); holding still hurries the drop down until it lets go.
   */
  const drag = useRef<{ id: number; x0: number; anchor: number; col: number; dragging: boolean; timer: ReturnType<typeof setTimeout> } | null>(null);
  const letGo = () => {
    if (drag.current) clearTimeout(drag.current.timer);
    drag.current = null;
    setHurry(false);
  };
  useEffect(() => letGo, []);
  // Pausing, the menu or the end lets go of a drag or a hold
  useEffect(() => { if (!running) letGo(); }, [running]);
  const hold: React.HTMLAttributes<HTMLDivElement> = {
    onPointerDown: (e) => {
      if (!running || e.button > 0) return;
      e.currentTarget.setPointerCapture?.(e.pointerId);
      const left = e.currentTarget.getBoundingClientRect().left;
      const col = Math.min(COLS - 1, Math.max(0, Math.floor((e.clientX - left + geo.gap / 2) / (geo.colW + geo.gap))));
      if (drag.current) clearTimeout(drag.current.timer);
      drag.current = {
        id: e.pointerId,
        x0: e.clientX,
        anchor: e.clientX,
        col,
        dragging: false,
        timer: setTimeout(() => { if (drag.current && !drag.current.dragging) setHurry(true); }, HOLD_MS),
      };
    },
    onPointerMove: (e) => {
      const d = drag.current;
      if (!d || d.id !== e.pointerId || !running) return;
      if (!d.dragging) {
        if (Math.abs(e.clientX - d.x0) < DRAG_START_PX) return;
        d.dragging = true;
        clearTimeout(d.timer);
        setHurry(false);
      }
      const step = geo.colW + geo.gap;
      while (e.clientX - d.anchor >= step / 2 && d.col < COLS - 1) {
        doSwap(d.col);
        d.col++;
        d.anchor += step;
      }
      while (d.anchor - e.clientX >= step / 2 && d.col > 0) {
        doSwap(d.col - 1);
        d.col--;
        d.anchor -= step;
      }
    },
    onPointerUp: letGo,
    onPointerCancel: letGo,
    onLostPointerCapture: letGo,
    onContextMenu: (e) => e.preventDefault(),
  };

  /** A fresh game in this mode; `start` skips the Start card. */
  const reset = (start: boolean) => {
    const [a, b] = makeTanks();
    tankRef.current = a;
    oppRef.current = b;
    setTank(a);
    setOpp(b);
    setIds([0, 1, 2, 3]);
    seconds.current = 0;
    setEffects([]);
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

  const width = boardWidth(geo);
  const gapCenter = (i: number) => (i + 1) * (geo.colW + geo.gap) - geo.gap / 2;
  const friends = itemsIn(tank);

  return (
    <main
      className={shared.screen}
      data-reduced={reduced}
      style={{ '--side-w': `${SIDE_W}px`, '--side-gap': `${SIDE_GAP}px` } as React.CSSProperties}
    >
      <header className={shared.topBar}>
        <BackButton />
        <h1 className={shared.title}>Tide Swap</h1>
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
          <div className={styles.boardColumn} style={{ width }}>
            {versus ? (
              <Incoming count={tank.incoming} width={width} words={pebbles} icon={PEBBLE} />
            ) : (
              <div className={styles.scoreLine} style={{ height: LINE_H - 6 }}>
                <span>Score <b>{commas(tank.score)}</b></span>
                <span>Best <b>{commas(Math.max(saved.best, tank.score))}</b></span>
              </div>
            )}
            <NextRow tank={tank} geo={geo} />
            <Board
              tank={tank}
              ids={ids}
              geo={geo}
              fallMs={fallMs()}
              smooth={!reduced}
              effects={effects}
              mode={settings.mode}
              hold={hold}
              label={`Your columns: ${friends} ${friends === 1 ? 'thing' : 'things'} stacked, tallest ${Math.max(...tank.stacks.map((s) => s.length))} of ${HEIGHT}`}
            >
              {shout && <span key={shout.id} className={shared.shout} aria-hidden="true">{shout.text}</span>}
            </Board>
            <div className={styles.swaps} style={{ width }}>
              {[0, 1, 2].map((i) => (
                <button
                  key={i}
                  type="button"
                  className={styles.swap}
                  style={{ left: gapCenter(i) }}
                  aria-label={`Swap columns ${i + 1} and ${i + 2}`}
                  data-silent
                  disabled={!running}
                  onClick={() => doSwap(i)}
                >
                  <svg width="26" height="26" viewBox="-13 -13 26 26" aria-hidden="true" fill="none" stroke="currentColor"
                    strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M-10 -5 H9 M4 -10 L9 -5 L4 0" />
                    <path d="M10 5 H-9 M-4 0 L-9 5 L-4 10" />
                  </svg>
                </button>
              ))}
            </div>
          </div>

          {versus && (
            <aside className={shared.side} aria-label={`The ${rival}`}>
              <div className={shared.sideCard}>
                <div className={shared.avatar} data-busy={oppBusy || undefined}>
                  <RacerFace eyes={oppLost ? 'sleepy' : oppBusy ? 'happy' : 'open'} size={52} />
                </div>
                <span className={shared.sideName}>The {rival}</span>
              </div>
              <div className={shared.mini}>
                <Incoming count={opp.incoming} width={COLS * MINI_CELL + 9} small words={pebbles} icon={PEBBLE} />
                <MiniBoard
                  tank={opp}
                  cell={MINI_CELL}
                  mode={settings.mode}
                  label={`The ${rival}'s columns: ${itemsIn(opp)} things stacked${opp.incoming ? `, ${pebbles(opp.incoming)} coming` : ''}`}
                />
              </div>
              <div className={shared.sideCard} role="img" aria-label={`Wins: you ${saved.tally[0]}, the ${rival} ${saved.tally[1]}`}>
                <span className={shared.sideLabel}>Wins</span>
                <span className={shared.wins} aria-hidden="true">
                  <span>You</span><b>{saved.tally[0]}</b>
                  <span>{capitalize(rival)}</span><b>{saved.tally[1]}</b>
                </span>
              </div>
            </aside>
          )}
        </div>
      </div>

      <p className={shared.status} role="status">{status || idleStatus}</p>

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
        <Overlay labelledBy="swap-rules">
          <h2 id="swap-rules" className={shared.overlayTitle}>How to play</h2>
          <ul className={shared.rules}>
            <li>Sea friends drift down into four columns, one or two at a time. You can't steer them.</li>
            <li>Instead, tap a swap button to trade the two stacks beside it, so each friend lands on its twin.</li>
            <li>The boxes over the columns show what will fall into each one next.</li>
            <li>You can also drag a column sideways onto its neighbor to swap them.</li>
            <li>Hold a finger still on the columns to hurry the drop down; let go and it slows again.</li>
            <li>A friend that lands on its twin: both swim away. Anything else stacks up.</li>
            <li>
              Clam shells come in halves. Land a top half on a column with a bottom half in it, and everything between
              closes into a pearl, with a bonus for each friend inside. A top half with nothing to close melts away.
            </li>
            <li>Solo gets a little faster every {MATCHES_PER_LEVEL} matches. It ends when something lands on a full column.</li>
            <li>
              Versus: closing a clam sends a pebble into the {rival}'s columns for each friend inside, and two matches in
              one drop send one. Pebbles fall with the next drop; two that meet crumble away. Your matches cancel pebbles
              coming your way first. The first to overflow a column loses.
            </li>
          </ul>
          <div className={shared.overlayButtons}>
            <button type="button" className={shared.primary} onClick={() => setRulesOpen(false)} autoFocus>Got it</button>
          </div>
        </Overlay>
      )}

      {!started && !rulesOpen && !menuOpen && (
        <Overlay labelledBy="swap-start">
          {versus ? <RacerFace eyes="open" size={90} wave className={shared.bob} /> : <GreeterFace eyes="open" size={90} wave className={shared.bob} />}
          <h2 id="swap-start" className={shared.overlayTitle}>{versus ? `Ready for a race, ${name}?` : `Ready to swap, ${name}?`}</h2>
          <p className={shared.overlaySub}>
            {versus
              ? `Close clams, or make two matches at once, to send pebbles to the ${rival}. First to overflow a column loses.`
              : 'Friends drift down into four columns. Swap the stacks underneath (tap a swap button, or drag a column over) so each one lands on its twin. Hold the columns to hurry them down.'}
          </p>
          {modePicker('start')}
          <div className={shared.overlayButtons}>
            <button type="button" className={shared.secondary} onClick={() => setRulesOpen(true)}>How to play</button>
            <button type="button" className={shared.primary} onClick={() => setStarted(true)} autoFocus>Start</button>
          </div>
        </Overlay>
      )}

      {started && paused && !over && !menuOpen && !rulesOpen && (
        <Overlay labelledBy="swap-paused">
          {versus ? <RacerFace eyes="sleepy" size={90} /> : <GreeterFace eyes="sleepy" size={90} />}
          <h2 id="swap-paused" className={shared.overlayTitle}>Paused</h2>
          <p className={shared.overlaySub}>{versus ? `The ${rival} is waiting for you.` : 'Your columns are waiting for you.'}</p>
          <div className={shared.overlayButtons}>
            <button type="button" className={shared.primary} onClick={() => setPaused(false)} autoFocus>Resume</button>
          </div>
        </Overlay>
      )}

      {showEnd && over && versus && !menuOpen && !rulesOpen && (
        <Overlay labelledBy="swap-end">
          <RacerFace eyes={youLost ? 'open' : 'happy'} size={90} wave className={shared.bob} />
          <h2 id="swap-end" className={shared.overlayTitle}>{youLost ? `The ${rival} won this one` : `You won, ${name}!`}</h2>
          <p className={shared.overlaySub}>
            {youLost ? 'One of your columns overflowed first.' : `The ${rival}'s column overflowed first.`} You {saved.tally[0]} · {capitalize(rival)} {saved.tally[1]}
          </p>
          <div className={shared.overlayButtons}>
            <button type="button" className={shared.primary} onClick={() => reset(true)} autoFocus>Play again</button>
            <a className={shared.secondary} href="#/">Home</a>
          </div>
        </Overlay>
      )}

      {showEnd && over && !versus && !menuOpen && !rulesOpen && (
        <Overlay labelledBy="swap-end">
          <GreeterFace eyes={newBest ? 'happy' : 'sleepy'} size={90} wave={newBest} className={newBest ? shared.bob : undefined} />
          <h2 id="swap-end" className={shared.overlayTitle}>{newBest ? `A new best, ${name}!` : 'A column is full'}</h2>
          <p className={shared.overlayScore}>{commas(tank.score)}</p>
          <p className={shared.overlaySub}>
            Level {level(tank)} · {commas(tank.matches)} {tank.matches === 1 ? 'match' : 'matches'}{newBest ? '' : ` · Best ${commas(saved.best)}`}
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
