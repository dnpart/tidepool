// Bubble Pals (PLAN.md "Game 8: Bubble Pals"): Solo, and Versus against the deck's racer. The rules run in rules.ts
// and the opponent in ai.ts; this screen keeps time for each tank (useTankLoop), hands clams between them, and shows
// what happened with sounds, words and animation.
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
import { fallDistances } from '../falling/fallDistances';
import { Friend, FriendDefs, FRIEND_NAMES } from '../falling/Friend';
import shared from '../falling/Falling.module.css';
import { Incoming } from '../falling/Incoming';
import { ModePicker } from '../falling/ModePicker';
import { Overlay } from '../falling/Overlay';
import { PACE_NAMES } from '../falling/speed';
import { usePauseWhenHidden, usePlayKeys } from '../falling/usePlayKeys';
import { useTankGestures } from '../falling/useTankGestures';
import { useTankLoop } from '../falling/useTankLoop';
import { choosePlacement, nextPress } from './ai';
import {
  COLS,
  drop,
  exchange,
  fall,
  landing,
  level,
  move,
  newTank,
  PEARL_EVERY,
  pieceCells,
  preview,
  resolve,
  soloFallMs,
  turn,
  versusFallMs,
  type Pace,
  type Tank,
} from './rules';
import { load, save, type Mode, type SavedBubblePals } from './storage';
import { PalsTank, TANK_ROWS, type PalsAnimation } from './Tank';

const END_MS = 700;
const JELLY_LEVEL = 5;
/** The opponent's thinking time when a piece comes out, and the time between its presses. */
const OPPONENT: Record<Pace, { think: number; press: number }> = {
  gentle: { think: 900, press: 280 },
  steady: { think: 550, press: 180 },
  quick: { think: 300, press: 110 },
};
const SIDE_W: Record<Mode, number> = { solo: 86, versus: 108 };
const SIDE_GAP = 10;
/** Height of the "clams coming" row over your tank in Versus. */
const INCOMING_H = 26;
const MINI_CELL = 15;

const randomSeed = () => Math.floor(Math.random() * 2 ** 31);
const commas = (n: number) => n.toLocaleString('en-US');
const clams = (n: number) => `${n} ${n === 1 ? 'clam' : 'clams'}`;
const CLAM = <Friend kind="clam" cx={0} cy={0} size={30} />;

/** Both sides of Versus share a seed, so they get the same pairs. */
function makeTanks(m: Mode): [Tank, Tank] {
  const seed = randomSeed();
  return m === 'versus'
    ? [newTank({ seed }), newTank({ seed })]
    : [newTank({ seed, fifthAt: JELLY_LEVEL }), newTank({ seed })];
}

export function BubblePalsScreen() {
  const { settings } = useSettings();
  const reduced = useReducedMotion();
  const name = displayName(settings);
  const rival = DECKS[useDeck()].names.opponent;

  const [saved, setSaved] = useState<SavedBubblePals>(load);
  const mode = saved.mode;
  const versus = mode === 'versus';
  const pace = saved.pace;

  const [first] = useState(() => makeTanks(mode));
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
  const [anim, setAnim] = useState<PalsAnimation | null>(null);
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
  const idleStatus = versus ? 'First tank to fill up loses' : 'Pop four of a kind';

  const update = (next: SavedBubblePals) => {
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
      setCell(Math.max(16, Math.floor(Math.min(w, h))));
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

  /** Clams either side has sent go into the other's waiting row. */
  const passClams = useCallback(() => {
    const a = tankRef.current, b = oppRef.current;
    if (!a.outgoing && !b.outgoing) return;
    const [a2, b2] = exchange(a, b);
    tankRef.current = a2;
    oppRef.current = b2;
    setTank(a2);
    setOpp(b2);
    if (b.outgoing) {
      setStatus(`The ${rival} sent ${clams(b.outgoing)}`);
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
        setStatus(kind ? `The pearl popped every ${FRIEND_NAMES[kind][0]}! +${commas(link.points)}` : 'The pearl melted away');
      } else {
        playSound('pop', 2 ** (((link.chain - 1) * 2) / 12));
        setStatus(link.chain > 1 ? `Chain ×${link.chain}! +${commas(link.points)}` : `Pop! +${commas(link.points)}`);
      }
      if (link.chain > 1) setShout({ text: `Chain ×${link.chain}!`, id: key });
      if (!versus && level(next) > level(prev)) {
        setStatus(level(next) === JELLY_LEVEL ? `Level ${JELLY_LEVEL}! The jellyfish joins in` : `Level ${level(next)}!`);
      }
    } else if (e.kind === 'settled') {
      if (e.clams.length) {
        setAnim({ key, drops: fallDistances(prev.board, next.board, new Set(), []), pops: [], dropDelay: 0 });
        playSound('thunk');
      } else setAnim(null);
      const words = [
        versus && e.sent ? `${capitalize(clams(e.sent))} for the ${rival}!` : '',
        e.cancelled ? `You cancelled ${clams(e.cancelled)}.` : '',
        e.clams.length ? `${capitalize(clams(e.clams.length))} dropped in.` : '',
      ].filter(Boolean);
      if (words.length) setStatus(words.join(' '));
      else if (next.piece?.type === 'pearl') setStatus('A pearl! Drop it on the friends you want gone');
      if (versus && e.sent) playSound('whoosh');
      if (versus) passClams();
    }
  }, [versus, rival, passClams]);

  /** The opponent's tank moves on: quietly, apart from passing clams. */
  const applyOpp = useCallback((next: Tank) => {
    if (next === oppRef.current) return;
    oppRef.current = next;
    setOpp(next);
    const e = next.last;
    if (e?.kind === 'pop' && e.link.chain > 1) setOppBusy(true);
    if (e?.kind === 'settled') {
      setOppBusy(false);
      passClams();
    }
  }, [passClams]);

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
  const reset = (m: Mode, start: boolean) => {
    const [a, b] = makeTanks(m);
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
    reset(m, false);
  };

  const next = preview(tank);
  const pearlDots = Math.min(5, Math.floor((PEARL_EVERY - Math.max(0, tank.toPearl)) / 5));
  const friendsIn = (t: Tank) => t.board.slice(1).flat().filter(Boolean).length;
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
        <h1 className={shared.title}>Bubble Pals</h1>
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
            {versus && <Incoming count={tank.incoming} width={cell * COLS} words={clams} icon={CLAM} />}
            <div
              className={shared.tank}
              data-mode={settings.mode}
              style={{ width: cell * COLS, height: Math.round(cell * TANK_ROWS) }}
              role="img"
              aria-label={`Your tank: ${friendsIn(tank)} ${friendsIn(tank) === 1 ? 'friend' : 'friends'}`}
              {...gestures}
            >
              <PalsTank board={tank.board} piece={tank.piece} landing={landing(tank)} anim={anim} smooth={!reduced} />
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
                <Incoming count={opp.incoming} width={MINI_CELL * COLS} small words={clams} icon={CLAM} />
                <div
                  className={shared.tank}
                  data-mode={settings.mode}
                  style={{ width: MINI_CELL * COLS, height: Math.round(MINI_CELL * TANK_ROWS), borderRadius: 9 }}
                  role="img"
                  aria-label={`The ${rival}'s tank: ${friendsIn(opp)} friends${opp.incoming ? `, ${clams(opp.incoming)} coming` : ''}`}
                >
                  <PalsTank board={opp.board} piece={opp.piece} landing={null} anim={null} smooth={false} />
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
                <NextPiece next={next} />
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
            <button type="button" className={shared.menuItem} onClick={() => reset(mode, true)}>New game</button>
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
            <li>Solo gets a little faster each level. It ends when the tank fills up where new pairs come in.</li>
            <li>
              Versus: chains send sleepy clams into the {rival}'s tank (two links send 3, three send 6, four send 12).
              Clams never match; they leave when friends pop next to them. Your chains cancel clams coming your way
              first. The first tank to fill up loses.
            </li>
          </ul>
          <div className={shared.overlayButtons}>
            <button type="button" className={shared.primary} onClick={() => setRulesOpen(false)} autoFocus>Got it</button>
          </div>
        </Overlay>
      )}

      {!started && !rulesOpen && !menuOpen && (
        <Overlay labelledBy="pals-start">
          {versus ? <RacerFace eyes="open" size={90} wave className={shared.bob} /> : <GreeterFace eyes="open" size={90} wave className={shared.bob} />}
          <h2 id="pals-start" className={shared.overlayTitle}>{versus ? `Ready for a race, ${name}?` : `Ready to pop, ${name}?`}</h2>
          <p className={shared.overlaySub}>
            {versus
              ? `Chains send clams into the ${rival}'s tank. First tank to fill up loses.`
              : 'Drop pairs of sea friends. Four of a kind touching pop, and what drops after can pop again.'}
          </p>
          {modePicker('start')}
          <div className={shared.overlayButtons}>
            <button type="button" className={shared.secondary} onClick={() => setRulesOpen(true)}>How to play</button>
            <button type="button" className={shared.primary} onClick={() => setStarted(true)} autoFocus>Start</button>
          </div>
        </Overlay>
      )}

      {started && paused && !over && !menuOpen && !rulesOpen && (
        <Overlay labelledBy="pals-paused">
          {versus ? <RacerFace eyes="sleepy" size={90} /> : <GreeterFace eyes="sleepy" size={90} />}
          <h2 id="pals-paused" className={shared.overlayTitle}>Paused</h2>
          <p className={shared.overlaySub}>{versus ? `The ${rival} is waiting for you.` : 'Your tank is waiting for you.'}</p>
          <div className={shared.overlayButtons}>
            <button type="button" className={shared.primary} onClick={() => setPaused(false)} autoFocus>Resume</button>
          </div>
        </Overlay>
      )}

      {showEnd && over && versus && (
        <Overlay labelledBy="pals-end">
          <RacerFace eyes={youLost ? 'open' : 'happy'} size={90} wave className={shared.bob} />
          <h2 id="pals-end" className={shared.overlayTitle}>{youLost ? `The ${rival} won this one` : `You won, ${name}!`}</h2>
          <p className={shared.overlaySub}>
            {youLost ? 'Your tank filled up first.' : `The ${rival}'s tank filled up first.`} You {saved.tally[0]} · {capitalize(rival)} {saved.tally[1]}
          </p>
          <div className={shared.overlayButtons}>
            <button type="button" className={shared.primary} onClick={() => reset(mode, true)} autoFocus>Play again</button>
            <a className={shared.secondary} href="#/">Home</a>
          </div>
        </Overlay>
      )}

      {showEnd && over && !versus && (
        <Overlay labelledBy="pals-end">
          <GreeterFace eyes={newBest ? 'happy' : 'sleepy'} size={90} wave={newBest} className={newBest ? shared.bob : undefined} />
          <h2 id="pals-end" className={shared.overlayTitle}>{newBest ? `A new best, ${name}!` : 'The tank is full'}</h2>
          <p className={shared.overlayScore}>{commas(tank.score)}</p>
          <p className={shared.overlaySub}>
            Level {level(tank)} · {commas(tank.popped)} friends popped{newBest ? '' : ` · Best ${commas(saved.best)}`}
          </p>
          <div className={shared.overlayButtons}>
            <button type="button" className={shared.primary} onClick={() => reset(mode, true)} autoFocus>Play again</button>
            <a className={shared.secondary} href="#/">Home</a>
          </div>
        </Overlay>
      )}
    </main>
  );
}

function NextPiece({ next }: { next: ReturnType<typeof preview> }) {
  return (
    <svg width="40" height="76" viewBox="0 0 32 64" role="img"
      aria-label={next.type === 'pearl' ? 'Next: a pearl' : `Next: ${FRIEND_NAMES[next.other][0]} on ${FRIEND_NAMES[next.pivot][0]}`}>
      <FriendDefs />
      {next.type === 'pearl'
        ? <Friend kind="pearl" cx={16} cy={32} size={30} />
        : <><Friend kind={next.other} cx={16} cy={16} size={29} /><Friend kind={next.pivot} cx={16} cy={48} size={29} /></>}
    </svg>
  );
}
