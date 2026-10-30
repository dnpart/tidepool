import { useEffect, useMemo, useRef, useState } from 'react';
import { Creature, type Eyes } from '../../art/Creature';
import { Card } from '../../cards/Card';
import { CardBack } from '../../cards/CardBack';
import { cardId, cardName, type Card as CardData } from '../../cards/deck';
import buttons from '../../screens/Buttons.module.css';
import { BackButton } from '../../screens/BackButton';
import { Switch } from '../../settings/controls';
import { useSettings } from '../../settings/SettingsContext';
import { play } from '../../sound/sfx';
import { useReducedMotion, useTheme } from '../../theme/ThemeProvider';
import {
  actions,
  deal,
  dealerStep,
  handValue,
  hit,
  isBlackjack,
  isBust,
  newGame,
  recommend,
  resetTally,
  split,
  stand,
  type Action,
  type BlackjackState,
  type Hand,
  type Result,
} from './rules';
import { loadSaved, save } from './storage';
import styles from './Blackjack.module.css';

const PLAYER_W = 72;
const DEALER_W = 64;
const DEAL_GAP_MS = 120;

/** "Soft 17", "21", "Bust" or "Blackjack". */
function totalLabel(hand: Hand): string {
  if (isBlackjack(hand.cards, hand.fromSplit)) return 'Blackjack';
  if (isBust(hand.cards)) return 'Bust';
  const { total, soft } = handValue(hand.cards);
  return soft && total < 21 ? `Soft ${total}` : `${total}`;
}

function dealerLabel(state: BlackjackState): string {
  if (state.dealer.length === 0) return '';
  if (state.holeHidden) return state.dealer[0].rank === 1 ? 'Showing an Ace' : `Showing ${handValue([state.dealer[0]]).total}`;
  if (isBlackjack(state.dealer)) return 'Blackjack';
  const { total } = handValue(state.dealer);
  return total > 21 ? `Bust (${total})` : `${total}`;
}

const RESULT_TEXT: Record<Result, string> = {
  blackjack: 'Blackjack!',
  win: 'You win!',
  push: 'Push',
  lose: 'The King manta wins this one',
};

function resultLine(state: BlackjackState): string {
  const results = state.results;
  if (!results) return '';
  if (results.length === 1) {
    const [r] = results;
    if (r === 'lose' && isBust(state.hands[0].cards)) return 'Bust. The King manta wins this one';
    if (r === 'win' && isBust(state.dealer)) return 'The King manta busts. You win!';
    return RESULT_TEXT[r];
  }
  const short: Record<Result, string> = { blackjack: 'win', win: 'win', push: 'push', lose: 'lose' };
  return results.map((r, i) => `Hand ${i + 1}: ${short[r]}`).join(' · ');
}

/** The King manta's face follows the hand: open eyes while dealing, happy when you win, sleepy when you lose. */
function dealerEyes(state: BlackjackState): Eyes {
  if (state.phase !== 'done' || !state.results) return 'open';
  const wins = state.results.filter((r) => r === 'win' || r === 'blackjack').length;
  const losses = state.results.filter((r) => r === 'lose').length;
  return wins > losses ? 'happy' : losses > wins ? 'sleepy' : 'open';
}

/** Overlap so a row of cards fits its space. */
const step = (count: number, width: number, room: number, max: number) =>
  count <= 1 ? 0 : Math.max(14, Math.min(max, (room - width) / (count - 1)));

export function BlackjackScreen() {
  const { settings } = useSettings();
  const { manta } = useTheme();
  const reduced = useReducedMotion();
  const saved = useMemo(() => loadSaved(), []);

  const [game, setGame] = useState<BlackjackState>(() => saved?.game ?? newGame());
  const [showTally, setShowTally] = useState(() => saved?.showTally ?? false);
  const [showHints, setShowHints] = useState(() => saved?.showHints ?? false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmShoe, setConfirmShoe] = useState(false);
  const [busy, setBusy] = useState(false);
  const [shuffleNote, setShuffleNote] = useState(false);
  const [width, setWidth] = useState(() => Math.min(window.innerWidth, 600));

  const gameRef = useRef(game);
  gameRef.current = game;
  // Cards already on screen don't replay their deal-in animation
  const seenCards = useRef(new Set([...game.dealer, ...game.hands.flatMap((h) => h.cards)].map(cardId)));
  useEffect(() => {
    for (const card of [...game.dealer, ...game.hands.flatMap((h) => h.cards)]) seenCards.current.add(cardId(card));
  }, [game]);
  const dealtAt = useRef(0);

  useEffect(() => {
    const onResize = () => setWidth(Math.min(window.innerWidth, 600));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // --- autosave ---
  useEffect(() => save({ game, showTally, showHints }), [game, showTally, showHints]);

  // --- the dealer's turn: hole card, then one card every 500ms ---
  useEffect(() => {
    if (game.phase !== 'dealer') return;
    const delay = reduced ? 160 : game.holeHidden ? 420 : 500;
    const t = setTimeout(() => {
      const next = dealerStep(gameRef.current);
      if (next.dealer.length > gameRef.current.dealer.length || next.holeHidden !== gameRef.current.holeHidden) play('flip');
      setGame(next);
    }, delay);
    return () => clearTimeout(t);
  }, [game, reduced]);

  // --- results: a sound once a round ends ---
  const lastResults = useRef(game.results);
  useEffect(() => {
    if (!game.results || game.results === lastResults.current) return;
    lastResults.current = game.results;
    const r = game.results;
    const sound = r.includes('blackjack')
      ? 'win'
      : r.includes('win')
        ? 'foundation'
        : game.hands.some((h) => isBust(h.cards))
          ? 'invalid'
          : null;
    if (!sound) return;
    // After a natural, wait until the four dealt cards have landed
    const wait = Math.max(120, dealtAt.current + 4 * DEAL_GAP_MS + 120 - Date.now());
    const t = setTimeout(() => play(sound), wait);
    return () => clearTimeout(t);
  }, [game.results, game.hands]);

  const ticks = (count: number) => {
    for (let i = 0; i < count; i++) setTimeout(() => play('flip'), reduced ? 0 : i * DEAL_GAP_MS);
  };

  const commit = (next: BlackjackState | null, newCards: number) => {
    if (!next) return;
    setGame(next);
    ticks(newCards);
  };

  const onDeal = () => {
    const next = deal(gameRef.current);
    if (next.shuffled) {
      setShuffleNote(true);
      play('whoosh');
      setTimeout(() => setShuffleNote(false), 1400);
    }
    // Hold the buttons while the four cards land
    setBusy(true);
    setTimeout(() => setBusy(false), reduced ? 150 : 4 * DEAL_GAP_MS + 120);
    const pause = next.shuffled && !reduced ? 350 : 0;
    dealtAt.current = Date.now() + pause;
    setTimeout(() => commit(next, 4), pause);
  };

  const onAction = (action: Action) => {
    const g = gameRef.current;
    if (action === 'hit') commit(hit(g), 1);
    if (action === 'stand') commit(stand(g), 0);
    if (action === 'split') commit(split(g), 2);
  };

  const newShoe = () => {
    if (game.phase !== 'done' && !confirmShoe) return setConfirmShoe(true);
    setGame({ ...newGame(), tally: gameRef.current.tally });
    setConfirmShoe(false);
    setMenuOpen(false);
    play('whoosh');
  };

  const available = actions(game);
  const hint = showHints && !busy ? recommend(game) : null;
  const { wins, losses, pushes } = game.tally;
  const handRoom = (width - 40) / Math.max(1, game.hands.length);

  /** A card that slides in from the shoe the first time it appears. */
  const renderCard = (card: CardData, w: number, index: number, from: 'dealer' | 'player', faceUp = true) => {
    const id = cardId(card);
    const fresh = !seenCards.current.has(id);
    return (
      <div
        key={id}
        className={styles.cardSlot}
        data-deal={fresh ? from : undefined}
        style={{ width: w, height: w * 1.4, animationDelay: fresh && !reduced ? `${index * DEAL_GAP_MS}ms` : undefined }}
        role="img"
        aria-label={faceUp ? cardName(card) : 'Face-down card'}
      >
        <div className={styles.flipper} data-face-up={faceUp}>
          <div className={styles.front} aria-hidden="true"><Card card={card} width={w} /></div>
          <div className={styles.back} aria-hidden="true"><CardBack back={settings.cardBack} width={w} /></div>
        </div>
      </div>
    );
  };

  // During the opening deal, cards arrive in order: you, dealer, you, dealer
  const dealOrder = (who: 'dealer' | 'player', i: number) => (i < 2 ? i * 2 + (who === 'dealer' ? 1 : 0) : 0);

  const dealerStepPx = step(game.dealer.length, DEALER_W, width - 60, DEALER_W - 14);

  return (
    <main className={styles.screen} data-reduced={reduced}>
      <header className={styles.topBar}>
        <BackButton />
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>Blackjack</h1>
          {showTally && <span className={styles.tally}>Wins {wins} · Losses {losses} · Pushes {pushes}</span>}
        </div>
        <button
          type="button"
          className={buttons.iconButton}
          aria-label="Game menu"
          aria-expanded={menuOpen}
          onClick={() => {
            setMenuOpen((o) => !o);
            setConfirmShoe(false);
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
            <button type="button" className={styles.primary} onClick={newShoe}>
              {confirmShoe ? 'Tap again to end this hand' : 'New shoe'}
            </button>
            <div className={styles.menuRow}>
              <span id="bj-tally" className={styles.menuLabel}>Show tally</span>
              <Switch checked={showTally} onChange={setShowTally} labelledBy="bj-tally" />
            </div>
            {showTally && (
              <button type="button" className={styles.secondary} onClick={() => setGame((g) => resetTally(g))}>
                Reset tally
              </button>
            )}
            <div className={styles.menuRow}>
              <span id="bj-hints" className={styles.menuLabel}>Show hints</span>
              <Switch checked={showHints} onChange={setShowHints} labelledBy="bj-hints" />
            </div>
          </div>
        </>
      )}

      <div className={styles.table} data-mode={settings.mode}>
        <section className={styles.dealer} aria-label={`The King manta: ${dealerLabel(game) || 'waiting'}`}>
          <div className={styles.dealerHead}>
            <div className={styles.avatar} data-mood={dealerEyes(game)}>
              <Creature kind="manta" color={manta} hat="king" eyes={dealerEyes(game)} size={56} />
            </div>
            <span className={styles.total} aria-hidden="true">{dealerLabel(game)}</span>
          </div>
          <div className={styles.row} style={{ minHeight: DEALER_W * 1.4 }}>
            {game.dealer.map((card, i) => (
              <div key={cardId(card)} className={styles.stacked} style={{ marginLeft: i ? dealerStepPx - DEALER_W : 0 }}>
                {renderCard(card, DEALER_W, dealOrder('dealer', i), 'dealer', !(i === 1 && game.holeHidden))}
              </div>
            ))}
          </div>
        </section>

        <section className={styles.middle}>
          <div className={styles.shoe} role="img" aria-label={`Shoe, ${game.shoe.length} cards left`}>
            <CardBack back={settings.cardBack} width={40} className={styles.shoeUnder} />
            <CardBack back={settings.cardBack} width={40} />
            <span className={styles.shoeCount}>{game.shoe.length}</span>
          </div>
          <p className={styles.result} role="status" data-result={game.phase === 'done' && !busy ? game.results?.[0] : undefined}>
            {shuffleNote ? 'Shuffling…' : busy ? '' : game.phase === 'done' ? resultLine(game) || 'Tap Deal to start' : ''}
          </p>
        </section>

        <section className={styles.hands} aria-label="Your hands">
          {game.hands.map((hand, h) => {
            const n = hand.cards.length;
            const px = step(n, PLAYER_W, handRoom - 12, PLAYER_W - 18);
            const active = game.phase === 'player' && game.hands.length > 1 && h === game.active;
            const dim = game.phase === 'player' && game.hands.length > 1 && h !== game.active;
            return (
              <div
                key={h}
                className={styles.hand}
                data-active={active || undefined}
                data-dim={dim || undefined}
                aria-label={`${game.hands.length > 1 ? `Hand ${h + 1}: ` : 'Your hand: '}${totalLabel(hand)}`}
                role="group"
              >
                <span className={styles.total} aria-hidden="true">{totalLabel(hand)}</span>
                <div className={styles.row} style={{ minHeight: PLAYER_W * 1.4 }}>
                  {hand.cards.map((card, i) => (
                    <div key={cardId(card)} className={styles.stacked} style={{ marginLeft: i ? px - PLAYER_W : 0 }}>
                      {renderCard(card, PLAYER_W, game.hands.length === 1 ? dealOrder('player', i) : 0, 'player')}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </section>
      </div>

      <footer className={styles.bottomBar}>
        {game.phase === 'done' ? (
          <button type="button" className={styles.primary} onClick={onDeal} disabled={busy}>
            {game.hands.length ? 'Next hand' : 'Deal'}
          </button>
        ) : (
          (['hit', 'stand', 'split'] as const)
            .filter((a) => a !== 'split' || available.includes('split'))
            .map((a) => (
              <button
                key={a}
                type="button"
                className={a === 'stand' ? styles.secondary : styles.primary}
                data-hint={hint === a || undefined}
                disabled={busy || !available.includes(a)}
                onClick={() => onAction(a)}
              >
                {a === 'hit' ? 'Hit' : a === 'stand' ? 'Stand' : 'Split'}
              </button>
            ))
        )}
      </footer>
    </main>
  );
}
