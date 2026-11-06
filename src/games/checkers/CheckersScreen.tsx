// Checkers (PLAN.md "Games 8 and 9: Checkers and Chess", phase 41): you at the bottom in cream against the deck's
// character in ink at three levels, or a friend passing the phone. Tap a glowing piece, then a dot; a run of jumps that
// can go only one way finishes by itself, and one that branches waits for the next tap.
import { useEffect, useMemo, useRef, useState } from 'react';
import { capitalize, DECKS } from '../../decks/decks';
import { useDeck } from '../../decks/useDeck';
import buttons from '../../screens/Buttons.module.css';
import { BackButton } from '../../screens/BackButton';
import { Segmented, Switch } from '../../settings/controls';
import { useSettings } from '../../settings/SettingsContext';
import { displayName } from '../../settings/settings';
import { play as playSound } from '../../sound/sfx';
import { useReducedMotion } from '../../theme/ThemeProvider';
import { SeatCharacter } from '../seats';
import { chooseMove, type Level } from './ai';
import { Board, squareName, type ShownPiece, type Target } from './Board';
import { PieceArt } from './Piece';
import {
  legalMoves,
  movablePieces,
  movesThrough,
  newGame,
  nextGame,
  nextLandings,
  piecesLeft,
  play,
  resetTally,
  type Board as Squares,
  type CheckersState,
  type Move,
  type Seat,
} from './rules';
import { loadSaved, save, type Opponent } from './storage';
import styles from './Checkers.module.css';

/** How long the computer thinks, and how long a piece takes to slide one hop. */
const THINK_MS = 650;
const HOP_MS = 230;
const LEVEL_NAME: Record<Level, string> = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };

/** Gives every piece on the board its own number, so the screen can slide it from square to square. */
const assignIds = (board: Squares): (number | null)[] => {
  let n = 0;
  return board.map((p) => (p ? ++n : null));
};

/** A move being shown: the piece sliding along its squares one hop at a time, the pieces it jumps fading as it passes. */
interface Motion {
  id: number;
  seat: Seat;
  /** Its start, then every landing. */
  squares: number[];
  /** Before the move (a man crowned on the far row shows its crown once it lands). */
  king: boolean;
  taken: { id: number; sq: number; seat: Seat; king: boolean }[];
  step: number;
}

export function CheckersScreen() {
  const { settings } = useSettings();
  const names = DECKS[useDeck()].names;
  const reduced = useReducedMotion();
  const saved = useMemo(() => loadSaved(), []);

  const [game, setGame] = useState<CheckersState>(() => saved?.game ?? newGame());
  const [ids, setIds] = useState(() => assignIds(game.board));
  const [level, setLevel] = useState<Level>(() => saved?.level ?? 'medium');
  const [opponent, setOpponent] = useState<Opponent>(() => saved?.opponent ?? 'computer');
  const [showTally, setShowTally] = useState(() => saved?.showTally ?? false);
  /** The jump rule for the next game (it applies at once before the first move). */
  const [jumpRule, setJumpRule] = useState(() => game.mustJump);
  const [menuOpen, setMenuOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [confirmNew, setConfirmNew] = useState(false);
  /** The piece picked up, and the landings tapped so far in a run of jumps that branches. */
  const [picked, setPicked] = useState<{ from: number; steps: number[] } | null>(null);
  const [motion, setMotion] = useState<Motion | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [shaking, setShaking] = useState<number | null>(null);
  const [showEnd, setShowEnd] = useState(() => game.phase === 'done');
  const [size, setSize] = useState(320);

  const gameRef = useRef(game);
  gameRef.current = game;
  const idsRef = useRef(ids);
  idsRef.current = ids;
  const middleRef = useRef<HTMLDivElement>(null);
  const belowRef = useRef<HTMLDivElement>(null);

  const name = displayName(settings);
  const friend = opponent === 'friend';
  const held = menuOpen || rulesOpen;
  const hopMs = reduced ? 0 : HOP_MS;
  /** Who plays the top: the deck's Speed opponent, or a friend (shown as the deck's other character). */
  const topSeat = friend ? 2 : 1;
  const topName = friend ? 'your friend' : `the ${names.opponent}`;
  const topLabel = friend ? 'Friend' : capitalize(names.opponent);

  useEffect(() => {
    const el = middleRef.current;
    const below = belowRef.current;
    if (!el || !below) return;
    // The board takes what's left once the status line has its room, up to 460px
    const update = () =>
      setSize(Math.max(200, Math.floor(Math.min(el.clientWidth - 20, el.clientHeight - below.offsetHeight - 10, 460))));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    observer.observe(below);
    return () => observer.disconnect();
  }, []);

  // --- autosave ---
  useEffect(() => save({ game, level, opponent, showTally }), [game, level, opponent, showTally]);

  /** Plays a move for whoever's turn it is, and starts it sliding. */
  const commit = (move: Move) => {
    const before = gameRef.current;
    const next = play(before, move);
    if (!next) return;
    const was = idsRef.current;
    const piece = before.board[move.from]!;
    const id = was[move.from]!;
    const after = was.slice();
    after[move.from] = null;
    for (const sq of move.captures) after[sq] = null;
    after[move.path[move.path.length - 1]] = id;
    setIds(after);
    setMotion({
      id,
      seat: piece.seat,
      squares: [move.from, ...move.path],
      king: piece.king,
      taken: move.captures.map((sq) => ({ id: was[sq]!, sq, seat: before.board[sq]!.seat, king: before.board[sq]!.king })),
      step: 0,
    });
    setPicked(null);
    setGame(next);
  };

  // --- a move sliding along, a hop at a time, with a sound for each hop ---
  useEffect(() => {
    if (!motion) return;
    const last = motion.squares.length - 1;
    if (motion.step >= last) {
      const t = setTimeout(() => {
        setMotion(null);
        if (gameRef.current.last?.crowned) playSound('foundation');
      }, hopMs);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      playSound(motion.taken[motion.step] ? 'pop' : 'land', motion.taken[motion.step] ? motion.step : undefined);
      setMotion((m) => m && { ...m, step: m.step + 1 });
    }, motion.step === 0 ? 0 : hopMs);
    return () => clearTimeout(t);
  }, [motion, hopMs]);

  // --- the computer's turn: think, then play ---
  const computerTurn = !friend && game.phase === 'play' && game.turn === 1;
  useEffect(() => {
    if (!computerTurn || held || motion) return;
    const t = setTimeout(() => {
      const move = chooseMove(gameRef.current, level);
      if (!move) return;
      const jumped = move.captures.length;
      setNote(jumped ? `${capitalize(topName)} jumped ${jumped === 1 ? 'a piece' : `${jumped} pieces`}` : null);
      commit(move);
    }, reduced ? THINK_MS / 2 : THINK_MS);
    return () => clearTimeout(t);
    // commit and topName only change with the game or the deck
  }, [computerTurn, held, motion, level, reduced, game]);

  // --- the end: a sound, then the end card once the last piece has landed ---
  const lastResult = useRef(game.result);
  useEffect(() => {
    if (!game.result || game.result === lastResult.current || motion) return;
    lastResult.current = game.result;
    setNote(null);
    const t = setTimeout(() => {
      if (game.result!.winner === 0 || (friend && game.result!.winner === 1)) playSound('win');
      setShowEnd(true);
    }, reduced ? 200 : 500);
    return () => clearTimeout(t);
  }, [game.result, motion, reduced, friend]);

  // --- your moves (and your friend's, passing the phone) ---
  const myTurn = game.phase === 'play' && !motion && !computerTurn;
  const moves = myTurn ? legalMoves(game) : [];
  const canMove = myTurn ? movablePieces(game) : [];
  const jumping = game.mustJump && moves.some((m) => m.captures.length > 0);

  const refuse = (sq: number) => {
    playSound('invalid');
    setShaking(sq);
    setTimeout(() => setShaking(null), 400);
  };

  const onPiece = (sq: number) => {
    if (!myTurn) return;
    setNote(null);
    if (picked && picked.steps.length) return;
    if (!canMove.includes(sq)) return refuse(sq);
    if (picked?.from === sq) return setPicked(null);
    playSound('flip');
    setPicked({ from: sq, steps: [] });
  };

  const onLanding = (sq: number) => {
    if (!picked) return;
    const steps = [...picked.steps, sq];
    const options = movesThrough(game, picked.from, steps);
    // One way left to go: the run finishes by itself
    if (options.length === 1) return commit(options[0]);
    playSound('land');
    setPicked({ from: picked.from, steps });
  };

  // Tapping a piece of yours that can't move, or the other side's
  const onBoardTap = (sq: number) => {
    if (!myTurn || picked?.steps.length) return;
    const p = game.board[sq];
    if (p && p.seat === game.turn && !canMove.includes(sq)) refuse(sq);
  };

  // --- what's drawn: every piece where it stands, the moving one where it is in its slide ---
  const shown: ShownPiece[] = [];
  const lastSq = motion ? motion.squares[motion.squares.length - 1] : -1;
  game.board.forEach((p, sq) => {
    if (!p || ids[sq] === null) return;
    if (motion && ids[sq] === motion.id) {
      const at = motion.squares[motion.step];
      shown.push({ id: motion.id, sq: at, seat: p.seat, king: at === lastSq && motion.step === motion.squares.length - 1 ? p.king : motion.king });
    } else shown.push({ id: ids[sq]!, sq, seat: p.seat, king: p.king });
  });
  if (motion) motion.taken.forEach((t, i) => shown.push({ ...t, taken: i < motion.step }));
  // Partway through a run you're building: the piece stands on its last landing, the pieces it jumped fading
  if (picked?.steps.length) {
    const piece = shown.find((s) => s.sq === picked.from);
    if (piece) piece.sq = picked.steps[picked.steps.length - 1];
    const jumped = movesThrough(game, picked.from, picked.steps)[0].captures.slice(0, picked.steps.length);
    for (const s of shown) if (jumped.includes(s.sq) && s !== piece) s.taken = true;
  }

  const here = picked ? (picked.steps.length ? picked.steps[picked.steps.length - 1] : picked.from) : null;
  const targets: Target[] = picked
    ? nextLandings(game, picked.from, picked.steps).map((sq) => {
        const jump = Math.abs(Math.floor(sq / 8) - Math.floor(here! / 8)) === 2;
        return { sq, jump, label: `${jump ? 'Jump' : 'Move'} to ${squareName(sq)}`, onSelect: () => onLanding(sq) };
      })
    : [];
  const movable = picked?.steps.length ? [] : canMove.map((sq) => ({
    sq, label: `${game.board[sq]!.king ? 'King' : 'Piece'} on ${squareName(sq)}${picked?.from === sq ? ', picked up' : ''}`,
  }));
  const marked = game.last && !motion ? [game.last.from, game.last.path[game.last.path.length - 1]] : [];

  // --- the menu ---
  const startGame = (fresh: CheckersState) => {
    setGame(fresh);
    setIds(assignIds(fresh.board));
    setMotion(null);
    setPicked(null);
    setNote(null);
    setShowEnd(false);
    lastResult.current = null;
  };

  const onJumpRule = (on: boolean) => {
    setJumpRule(on);
    if (game.moves === 0 && game.phase === 'play') startGame({ ...game, mustJump: on });
  };

  const onNewGame = () => {
    if (game.phase === 'play' && game.moves > 0 && !confirmNew) return setConfirmNew(true);
    startGame(nextGame(game, jumpRule));
    setConfirmNew(false);
    setMenuOpen(false);
    playSound('whoosh');
  };

  // --- what the status line says ---
  const [mine, theirs] = piecesLeft(game.board);
  const whose = friend ? (game.turn === 0 ? 'Cream' : 'Ink') : null;
  let status: string;
  if (game.phase === 'done') status = 'Game over';
  else if (note) status = note;
  else if (computerTurn) status = `${capitalize(topName)} is thinking…`;
  else if (motion) status = ' ';
  else if (picked?.steps.length) status = 'Keep jumping: tap the next dot';
  else if (picked) status = targets.some((t) => t.jump) ? 'Tap a dot to jump there' : 'Tap a dot to move there, or another piece';
  else if (jumping) status = `${whose ? `${whose}'s turn. ` : ''}A jump is on, and jumps are required: tap a glowing piece`;
  else status = whose ? `${whose}'s turn: tap a piece, then where it goes` : 'Your turn: tap a piece, then where it goes';

  const pending = game.phase === 'play' && game.moves > 0 && jumpRule !== game.mustJump;
  const boardLabel = `Checkers board. You have ${mine} ${mine === 1 ? 'piece' : 'pieces'}, ${topName} ${theirs}.`;
  const tallyText = `You ${game.tally[0]} · ${topLabel} ${game.tally[1]} · Draws ${game.tally[2]}`;

  return (
    <main className={styles.screen} data-reduced={reduced} data-mode={settings.mode}>
      <header className={styles.topBar}>
        <BackButton />
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>Checkers</h1>
          {showTally && <span className={styles.tally}>{tallyText}</span>}
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
            <span id="ck-opponent" className={styles.menuLabel}>Play against</span>
            <Segmented
              options={[{ value: 'computer', label: capitalize(names.opponent) }, { value: 'friend', label: 'A friend' }]}
              value={opponent}
              onChange={(v) => setOpponent(v === 'friend' ? 'friend' : 'computer')}
              labelledBy="ck-opponent"
            />
            {friend ? (
              <span className={styles.menuNote}>Pass the phone: your friend plays the dark pieces at the top.</span>
            ) : (
              <>
                <span id="ck-level" className={styles.menuLabel}>How hard</span>
                <Segmented
                  options={(['easy', 'medium', 'hard'] as const).map((l) => ({ value: l, label: LEVEL_NAME[l] }))}
                  value={level}
                  onChange={(v) => setLevel(v as Level)}
                  labelledBy="ck-level"
                />
              </>
            )}
            <div className={styles.menuRow}>
              <span id="ck-jumps" className={styles.menuLabel}>Jumps are required</span>
              <Switch checked={jumpRule} onChange={onJumpRule} labelledBy="ck-jumps" />
            </div>
            {pending && <span className={styles.menuNote}>Starts with the next game</span>}
            <button type="button" className={styles.primary} onClick={onNewGame}>
              {confirmNew ? 'Tap again to end this game' : 'New game'}
            </button>
            <div className={styles.menuRow}>
              <span id="ck-tally" className={styles.menuLabel}>Show tally</span>
              <Switch checked={showTally} onChange={setShowTally} labelledBy="ck-tally" />
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

      <section className={styles.players} aria-label="Players">
        <Player seat={0} label={friend ? 'You (cream)' : 'You'} count={mine} turn={game.phase === 'play' && game.turn === 0} />
        <Player seat={1} character={topSeat} label={friend ? 'Friend (ink)' : topLabel} count={theirs}
          turn={game.phase === 'play' && game.turn === 1} />
      </section>

      <div ref={middleRef} className={styles.middle}>
        <div className={styles.boardArea} onClickCapture={(e) => {
          // Taps on a piece that can't move (the board's own buttons handle the rest)
          const svg = (e.currentTarget.querySelector('svg') as SVGSVGElement | null);
          if (!svg || (e.target as Element).closest('[role="button"]')) return;
          const box = svg.getBoundingClientRect();
          const col = Math.floor(((e.clientX - box.left) / box.width) * 8);
          const row = Math.floor(((e.clientY - box.top) / box.height) * 8);
          if (col >= 0 && col < 8 && row >= 0 && row < 8) onBoardTap(row * 8 + col);
        }}>
          <Board
            pieces={shown} size={size} hopMs={hopMs} marked={marked} movable={myTurn ? movable : []}
            selected={picked && !picked.steps.length ? picked.from : null} shaking={shaking} targets={targets}
            onPiece={onPiece} label={boardLabel}
          />
        </div>
        <div ref={belowRef}>
          <p className={styles.status} role="status">{status}</p>
        </div>
      </div>

      {rulesOpen && (
        <Overlay labelledBy="ck-rules">
          <h2 id="ck-rules" className={styles.overlayTitle}>How to play</h2>
          <ul className={styles.rules}>
            <li>You play the cream pieces from the bottom; {topName} plays the dark ones from the top. Pieces stay on the dark squares.</li>
            <li>A piece steps one square diagonally forward. Tap a glowing piece, then a dot.</li>
            <li>Jump over a piece next to you onto the empty square beyond to take it. If you can jump again, keep going: it’s all one move.</li>
            <li>Reach the far row and your piece is crowned king. Kings step and jump backward too.</li>
            <li>{jumpRule ? 'Jumps are required: when you can jump, you must.' : 'Jumps are optional right now; the menu can make them required.'}</li>
            <li>Take all the other side’s pieces, or leave them no move, to win. Forty moves each with no jump and no piece crowned or stepping forward is a draw.</li>
          </ul>
          <div className={styles.overlayButtons}>
            <button type="button" className={styles.primary} onClick={() => setRulesOpen(false)} autoFocus>Got it</button>
          </div>
        </Overlay>
      )}

      {showEnd && game.result && (
        <Overlay labelledBy="ck-end">
          {game.result.winner === null ? (
            <SeatCharacter seat={0} eyes="sleepy" size={90} />
          ) : game.result.winner === 0 ? (
            <div className={styles.cheer}><SeatCharacter seat={0} eyes="happy" wave size={96} /></div>
          ) : (
            <div className={styles.bob}><SeatCharacter seat={topSeat} eyes="happy" size={90} /></div>
          )}
          <h2 id="ck-end" className={styles.overlayTitle}>
            {game.result.winner === null ? 'A draw' : game.result.winner === 0 ? `You won, ${name}!` : friend ? 'Your friend won' : `${capitalize(topName)} won`}
          </h2>
          <p className={styles.overlaySub}>
            {game.result.winner === null
              ? 'Forty moves each went by with no jump and no piece moving forward.'
              : game.result.winner === 0
                ? theirs ? `${capitalize(topName)} has no move left.` : `You took all of ${friend ? 'your friend’s' : `the ${names.opponent}’s`} pieces.`
                : mine ? 'You have no move left.' : 'All your pieces were taken.'}
          </p>
          {showTally && (
            <div className={styles.chips}>
              <span className={styles.chip}>You {game.tally[0]}</span>
              <span className={styles.chip}>{topLabel} {game.tally[1]}</span>
              <span className={styles.chip}>Draws {game.tally[2]}</span>
            </div>
          )}
          <div className={styles.overlayButtons}>
            <button type="button" className={styles.primary} onClick={() => startGame(nextGame(game, jumpRule))} autoFocus>Play again</button>
            <a className={styles.secondary} href="#/">Home</a>
          </div>
        </Overlay>
      )}
    </main>
  );
}

/** A side's card: its character, who it is, and how many pieces it has left. */
function Player({ seat, character, label, count, turn }: {
  seat: Seat; character?: number; label: string; count: number; turn: boolean;
}) {
  return (
    <div className={styles.player} data-turn={turn || undefined}>
      <div className={styles.avatar} data-piece={character === undefined || undefined}>
        {character === undefined
          ? <svg width={34} height={34} viewBox="0 0 40 40" aria-hidden="true"><PieceArt seat={seat} king={false} /></svg>
          : <SeatCharacter seat={character} eyes={turn ? 'open' : 'happy'} size={40} />}
      </div>
      <div className={styles.playerText}>
        <span className={styles.playerName}>{label}</span>
        <span className={styles.playerCount}>
          <svg width={14} height={14} viewBox="0 0 40 40" aria-hidden="true"><PieceArt seat={seat} king={false} /></svg>
          {count} {count === 1 ? 'piece' : 'pieces'}
        </span>
      </div>
    </div>
  );
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
