import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Creature } from '../../art/Creature';
import { Card } from '../../cards/Card';
import { CardBack } from '../../cards/CardBack';
import { cardId, cardName, type Card as CardData } from '../../cards/deck';
import { BackButton } from '../../screens/BackButton';
import { Segmented } from '../../settings/controls';
import { useSettings } from '../../settings/SettingsContext';
import { displayName } from '../../settings/settings';
import { play as playSound } from '../../sound/sfx';
import { useReducedMotion, useTheme } from '../../theme/ThemeProvider';
import { chooseMove, nextDelay, PACE_NAMES, type Pace } from './ai';
import { canPlay, deal, isStalemate, pilesFor, play, stalemateFlip, type SpeedMove, type SpeedState, type Who } from './rules';
import styles from './Speed.module.css';

const PACE_KEY = 'tidepool.speed';
const STALEMATE_PAUSE_MS = 1500;
const CENTER_W = 80;
const HAND_W = 64;
const OCTO_CARD_W = 34;
const SIDE_W = 44;
const FAN_TILT = [-7, -3.5, 0, 3.5, 7];
const FAN_DROP = [8, 2, 0, 2, 8];

function loadPace(): Pace {
  try {
    const pace = JSON.parse(localStorage.getItem(PACE_KEY) ?? '{}').pace;
    return pace === 'normal' || pace === 'quick' ? pace : 'gentle';
  } catch {
    return 'gentle';
  }
}

function savePace(pace: Pace) {
  try {
    localStorage.setItem(PACE_KEY, JSON.stringify({ pace }));
  } catch {
    // not saved; the game still works
  }
}

/** How the newest card on a center pile arrived, for its entrance animation. */
type Arrival = Who | 'side';

interface Held {
  slot: number;
  startX: number;
  startY: number;
  dx: number;
  dy: number;
  moved: boolean;
}

export function SpeedScreen() {
  const { settings } = useSettings();
  const { octo: octoColor } = useTheme();
  const reduced = useReducedMotion();

  const [game, setGame] = useState<SpeedState>(() => deal());
  const [pace, setPace] = useState<Pace>(loadPace);
  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [arrivals, setArrivals] = useState<[Arrival, Arrival]>(['side', 'side']);
  const [held, setHeld] = useState<Held | null>(null);
  const [shakeSlot, setShakeSlot] = useState<number | null>(null);
  const [octoPlaying, setOctoPlaying] = useState(false);
  const [flipping, setFlipping] = useState(false);
  const [showEnd, setShowEnd] = useState(false);

  const gameRef = useRef(game);
  gameRef.current = game;
  const plannedRef = useRef<SpeedMove | null>(null);
  const heldRef = useRef<Held | null>(null);
  const pileRefs = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)];

  const running = started && !paused && !menuOpen && !game.winner;

  // Pause when the app goes to the background
  useEffect(() => {
    const onHide = () => document.visibilityState === 'hidden' && setPaused(true);
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, []);

  // --- the octopus: plays a random legal card on each paced tick ---
  useEffect(() => {
    if (!running) return;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      plannedRef.current = chooseMove(gameRef.current);
      timer = setTimeout(() => {
        const current = gameRef.current;
        const planned = plannedRef.current;
        const move = planned && canPlay(current, 'octo', planned) ? planned : chooseMove(current);
        plannedRef.current = null;
        const next = move && play(current, 'octo', move);
        if (move && next) {
          setGame(next);
          setArrivals((a) => (move.pile === 0 ? ['octo', a[1]] : [a[0], 'octo']));
          setOctoPlaying(true);
          setTimeout(() => setOctoPlaying(false), 600);
          playSound('flip');
        }
        schedule();
      }, nextDelay(pace));
    };
    schedule();
    return () => {
      clearTimeout(timer);
      plannedRef.current = null;
    };
  }, [running, pace]);

  // --- stalemate: after a short pause, both side piles flip onto the center ---
  const stuck = running && isStalemate(game);
  useEffect(() => {
    if (!stuck) return;
    setFlipping(true);
    const t = setTimeout(() => {
      setFlipping(false);
      const { state } = stalemateFlip(gameRef.current);
      setGame(state);
      setArrivals(['side', 'side']);
      playSound('whoosh');
    }, STALEMATE_PAUSE_MS);
    return () => {
      clearTimeout(t);
      setFlipping(false);
    };
  }, [stuck, game]);

  // --- the end ---
  useEffect(() => {
    if (!game.winner) return;
    const t = setTimeout(() => {
      setShowEnd(true);
      playSound(game.winner === 'you' ? 'win' : 'foundation');
    }, reduced ? 100 : 500);
    return () => clearTimeout(t);
  }, [game.winner, reduced]);

  // --- your plays ---
  const playYours = useCallback((move: SpeedMove): boolean => {
    const current = gameRef.current;
    const next = play(current, 'you', move);
    if (!next) return false;
    // You beat the octopus if your card took the pile it was about to play on
    const planned = plannedRef.current;
    const beatOcto = !!planned && planned.pile === move.pile && !canPlay(next, 'octo', planned);
    setGame(next);
    setArrivals((a) => (move.pile === 0 ? ['you', a[1]] : [a[0], 'you']));
    playSound(beatOcto ? 'speedFast' : 'land');
    return true;
  }, []);

  const reject = (slot: number) => {
    playSound('invalid');
    setShakeSlot(slot);
    setTimeout(() => setShakeSlot(null), 320);
  };

  const tapSlot = (slot: number) => {
    const piles = pilesFor(gameRef.current, 'you', slot);
    if (!piles.length || !playYours({ slot, pile: piles[0] })) reject(slot);
  };

  const pileUnder = (x: number, y: number): 0 | 1 | null => {
    for (const pile of [0, 1] as const) {
      const r = pileRefs[pile].current?.getBoundingClientRect();
      // a little forgiving around each pile
      if (r && x > r.left - 24 && x < r.right + 24 && y > r.top - 30 && y < r.bottom + 30) return pile;
    }
    return null;
  };

  const onPointerDown = (e: ReactPointerEvent, slot: number) => {
    if (!running || e.button > 0 || !gameRef.current.you.hand[slot]) return;
    const h: Held = { slot, startX: e.clientX, startY: e.clientY, dx: 0, dy: 0, moved: false };
    heldRef.current = h;
    setHeld(h);

    const onMove = (ev: PointerEvent) => {
      const cur = heldRef.current;
      if (!cur) return;
      const dx = ev.clientX - cur.startX;
      const dy = ev.clientY - cur.startY;
      const next = { ...cur, dx, dy, moved: cur.moved || Math.hypot(dx, dy) > 6 };
      heldRef.current = next;
      setHeld(next);
    };
    const onUp = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      const cur = heldRef.current;
      heldRef.current = null;
      setHeld(null);
      if (!cur || ev.type === 'pointercancel') return;
      if (!cur.moved) return tapSlot(cur.slot);
      const pile = pileUnder(ev.clientX, ev.clientY);
      if (pile === null || !playYours({ slot: cur.slot, pile })) reject(cur.slot);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  };

  const glowing = useMemo(
    () => (held && running ? pilesFor(game, 'you', held.slot) : []),
    [held, running, game],
  );

  const newGame = () => {
    setGame(deal());
    setArrivals(['side', 'side']);
    setShowEnd(false);
    setPaused(false);
    setMenuOpen(false);
    setStarted(true);
    playSound('whoosh');
  };

  const changePace = (p: Pace) => {
    setPace(p);
    savePace(p);
  };

  const name = displayName(settings);
  const octoHand = game.octo.hand.filter(Boolean).length;

  return (
    <div className={styles.screen} data-reduced={reduced}>
      <header className={styles.topBar}>
        <BackButton />
        <h1 className={styles.title}>Speed</h1>
        <span className={styles.paceTag}>{PACE_NAMES[pace]}</span>
      </header>

      <div className={styles.table} data-mode={settings.mode} data-dim={(started && (paused || menuOpen)) || undefined}>
        <section className={styles.opponent} aria-label="The octopus">
          <div className={styles.avatar} data-playing={octoPlaying || undefined}>
            <Creature kind="octopus" color={octoColor} eyes={octoPlaying ? 'open' : 'happy'} size={56} />
          </div>
          <div className={styles.octoFan} aria-label={`The octopus holds ${octoHand} cards`} role="img">
            {game.octo.hand.map((card, i) =>
              card ? (
                <CardBack key={i} back={settings.cardBack} width={OCTO_CARD_W} className={styles.octoCard} style={{ rotate: `${FAN_TILT[i] * 1.4}deg` }} />
              ) : (
                <span key={i} className={styles.octoGap} />
              ),
            )}
          </div>
          <span className={styles.count}>{game.octo.draw.length} to draw</span>
        </section>

        <section className={styles.middle} aria-label="Center piles">
          <SidePile cards={game.side[0]} back={settings.cardBack} />
          {([0, 1] as const).map((pile) => (
            <div
              key={pile}
              ref={pileRefs[pile]}
              className={styles.center}
              data-glow={glowing.includes(pile) || undefined}
              style={{ width: CENTER_W, height: CENTER_W * 1.4 }}
            >
              <CenterPile cards={game.center[pile]} arrival={arrivals[pile]} pile={pile} />
            </div>
          ))}
          <SidePile cards={game.side[1]} back={settings.cardBack} />
          {flipping && <p className={styles.flipNote} role="status">No moves. Flipping new cards…</p>}
        </section>

        <section className={styles.yours} aria-label="Your hand">
          <div className={styles.hand}>
            {game.you.hand.map((card, slot) => {
              const isHeld = held?.slot === slot && held.moved;
              if (!card) return <div key={`empty-${slot}`} className={styles.emptySlot} style={{ width: HAND_W, height: HAND_W * 1.4 }} />;
              return (
                <div
                  key={cardId(card)}
                  className={styles.handCard}
                  role="button"
                  tabIndex={0}
                  aria-label={cardName(card)}
                  data-held={isHeld || undefined}
                  data-shaking={shakeSlot === slot || undefined}
                  style={{
                    transform: isHeld
                      ? `translate(${held!.dx}px, ${held!.dy}px) scale(1.06)`
                      : `translateY(${FAN_DROP[slot]}px) rotate(${FAN_TILT[slot]}deg)`,
                  }}
                  onPointerDown={(e) => onPointerDown(e, slot)}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && running && (e.preventDefault(), tapSlot(slot))}
                >
                  <Card card={card} width={HAND_W} />
                </div>
              );
            })}
          </div>
          <span className={styles.count}>{game.you.draw.length} to draw</span>
        </section>
      </div>

      <footer className={styles.bottomBar}>
        <button type="button" className={styles.pause} onClick={() => setPaused((p) => !p)} disabled={!started || !!game.winner}>
          {paused ? 'Resume' : 'Pause'}
        </button>
        <button type="button" className={styles.menuButton} aria-expanded={menuOpen} onClick={() => setMenuOpen((o) => !o)}>
          Menu
        </button>
      </footer>

      {menuOpen && (
        <>
          <div className={styles.scrim} onClick={() => setMenuOpen(false)} />
          <div className={`panel ${styles.menu}`} role="dialog" aria-label="Speed menu">
            <span id="speed-pace" className={styles.menuLabel}>Octopus pace</span>
            <Segmented<Pace>
              labelledBy="speed-pace"
              value={pace}
              onChange={changePace}
              options={(['gentle', 'normal', 'quick'] as const).map((p) => ({ value: p, label: PACE_NAMES[p] }))}
            />
            <button type="button" className={styles.primary} onClick={newGame}>New game</button>
          </div>
        </>
      )}

      {!started && (
        <Overlay>
          <Creature kind="octopus" color={octoColor} eyes="open" wave size={96} className={styles.bob} />
          <h2 className={styles.overlayTitle}>Ready for a race, {name}?</h2>
          <p className={styles.overlaySub}>
            Play cards one higher or lower than a center card. King and Ace connect. Pace: {PACE_NAMES[pace]}.
          </p>
          <div className={styles.overlayButtons}>
            <button type="button" className={styles.primary} onClick={() => setStarted(true)} autoFocus>Start</button>
          </div>
        </Overlay>
      )}

      {started && paused && !game.winner && !menuOpen && (
        <Overlay>
          <Creature kind="octopus" color={octoColor} eyes="sleepy" size={90} />
          <h2 className={styles.overlayTitle}>Paused</h2>
          <p className={styles.overlaySub}>The octopus is waiting for you.</p>
          <div className={styles.overlayButtons}>
            <button type="button" className={styles.primary} onClick={() => setPaused(false)} autoFocus>Resume</button>
          </div>
        </Overlay>
      )}

      {showEnd && game.winner && (
        <Overlay labelledBy="speed-end">
          {game.winner === 'you' ? (
            <Creature kind="octopus" color={octoColor} eyes="happy" wave size={100} className={styles.clap} />
          ) : (
            <Creature kind="octopus" color={octoColor} eyes="open" wave size={100} className={styles.bob} />
          )}
          <h2 id="speed-end" className={styles.overlayTitle}>
            {game.winner === 'you' ? `You won, ${name}` : 'The octopus won this one'}
          </h2>
          <div className={styles.overlayButtons}>
            <button type="button" className={styles.primary} onClick={newGame} autoFocus>Play again</button>
            <a className={styles.secondary} href="#/">Home</a>
          </div>
        </Overlay>
      )}
    </div>
  );
}

function Overlay({ children, labelledBy }: { children: React.ReactNode; labelledBy?: string }) {
  return (
    <div className={styles.overlay}>
      <div className={styles.overlayCard} role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
        {children}
      </div>
    </div>
  );
}

function SidePile({ cards, back }: { cards: CardData[]; back: 'starry' | 'tide' }) {
  return (
    <div className={styles.side} aria-label={`Side pile, ${cards.length} cards`} role="img">
      {cards.length > 0 ? (
        <>
          {cards.length > 1 && <CardBack back={back} width={SIDE_W} className={styles.sideUnder} />}
          <CardBack back={back} width={SIDE_W} />
        </>
      ) : (
        <div className={styles.sideEmpty} style={{ width: SIDE_W, height: SIDE_W * 1.4 }} />
      )}
      <span className={styles.sideCount}>{cards.length}</span>
    </div>
  );
}

function CenterPile({ cards, arrival, pile }: { cards: CardData[]; arrival: Arrival; pile: 0 | 1 }) {
  const topCard = cards[cards.length - 1];
  const under = cards[cards.length - 2];
  return (
    <>
      {under && <Card card={under} width={CENTER_W} className={styles.centerCard} />}
      {topCard && (
        <div
          key={cardId(topCard)}
          className={styles.centerCard}
          data-arrival={arrival}
          data-pile={pile}
          aria-label={`Center pile ${pile + 1}: ${cardName(topCard)}`}
        >
          <Card card={topCard} width={CENTER_W} />
        </div>
      )}
    </>
  );
}
