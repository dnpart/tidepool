// Mockup (Nov 5): chess sets of little statues, one per deck, from src/art/ChessStatue.tsx. Built into statues.html by
// `node design/chess-statues/build.mjs`.
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { CHESS_CAST, CHESS_ROLES, ChessStatueArt, SPECIES_NAME, type ChessRole, type ChessSide } from '../../src/art/ChessStatue';
import type { DeckId } from '../../src/decks/decks';
import { BASE_TOKENS, PALETTES, type Mode, type Palette } from '../../src/theme/tokens';

const PALETTE_NAME: Record<Palette, string> = { lagoon: 'Lagoon', coral: 'Coral Reef', winter: 'Winter', honeycomb: 'Honeycomb', forest: 'Forest', koi: 'Koi Garden' };
const DECKS: DeckId[] = ['sea', 'arctic', 'honey', 'woodland', 'cats'];
const DECK_NAME: Record<DeckId, string> = { sea: 'Octo + Manta', arctic: 'Fox + Owl', honey: 'Bee + Sloth', woodland: 'Mushroom + Moth', cats: 'Cats' };
const ROLE_NAME: Record<ChessRole, string> = { pawn: 'Pawn', rook: 'Rook', knight: 'Knight', bishop: 'Bishop', queen: 'Queen', king: 'King' };
const BACK: ChessRole[] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];

function mix(a: string, b: string, k: number): string {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return `#${x.map((v, i) => Math.round(v * k + y[i] * (1 - k)).toString(16).padStart(2, '0')).join('')}`;
}

function Board({ deck, palette, mode }: { deck: DeckId; palette: Palette; mode: Mode }) {
  const t = BASE_TOKENS[palette][mode];
  const light = mode === 'light' ? t.surface : mix(t.accent, t.surface, 0.18);
  const dark = mode === 'light' ? mix(t.accent, t.surface, 0.42) : mix(t.accent, t.bg, 0.45);
  const at = (row: number): { side: ChessSide; roles: ChessRole[] } | null =>
    row === 0 ? { side: 'dark', roles: BACK } : row === 1 ? { side: 'dark', roles: Array(8).fill('pawn') }
      : row === 6 ? { side: 'light', roles: Array(8).fill('pawn') } : row === 7 ? { side: 'light', roles: BACK } : null;
  return (
    <svg viewBox="0 -6 320 326" style={{ width: '100%', display: 'block' }} role="img" aria-label={`Chess board, ${DECK_NAME[deck]} pieces`}>
      {Array.from({ length: 64 }, (_, i) => {
        const row = Math.floor(i / 8), col = i % 8;
        return <rect key={i} x={col * 40} y={row * 40} width={40} height={40} fill={(row + col) % 2 ? dark : light} />;
      })}
      {Array.from({ length: 8 }, (_, row) => {
        const line = at(row);
        return line && line.roles.map((role, col) => (
          <svg key={`${row}${col}`} x={col * 40} y={row * 40} width={40} height={40} viewBox="0 0 40 40" overflow="visible">
            <ChessStatueArt deck={deck} side={line.side} role={role} />
          </svg>
        ));
      })}
    </svg>
  );
}

function Chips<T extends string>({ label, value, options, names, onChange }: {
  label: string; value: T; options: readonly T[]; names: Record<T, string>; onChange: (v: T) => void;
}) {
  return (
    <div className="row">
      <span className="label">{label}</span>
      <div className="chips" role="radiogroup" aria-label={label}>
        {options.map((o) => <button key={o} type="button" role="radio" aria-checked={o === value} className="chip" onClick={() => onChange(o)}>{names[o]}</button>)}
      </div>
    </div>
  );
}

function App() {
  const [deck, setDeck] = useState<DeckId>('sea');
  const [palette, setPalette] = useState<Palette>('lagoon');
  const [mode, setMode] = useState<Mode>(() => (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  const t = BASE_TOKENS[palette][mode];
  const style = { '--bg': t.bg, '--surface': t.surface, '--ink': t.ink, '--sub': t.sub, '--accent': t.accent, '--on-accent': t.onAccent,
    '--soft': t.accentSoft, '--line': t.line, colorScheme: mode } as React.CSSProperties;
  const cast = CHESS_CAST[deck];
  return (
    <div className="app" style={style}>
      <main>
        <h1>Chess statues</h1>
        <p className="intro">A first version of a chess set for each deck: the characters as little statues on the classic bases,
          cream for you and ink for the other side. The rook stands behind its tower, the knight wears a plumed helmet, the bishop
          a mitre, and the queen and king your crowns.</p>
        <Chips label="Deck" value={deck} options={DECKS} names={DECK_NAME} onChange={setDeck} />
        <div className="sets">
          {(['light', 'dark'] as ChessSide[]).map((side) => (
            <section key={side} className="set">
              <h2>{SPECIES_NAME[cast[side]]} {side === 'light' ? '(you)' : '(the other side)'}</h2>
              <div className="pieces">
                {CHESS_ROLES.map((role) => (
                  <figure key={role}>
                    <svg viewBox="0 -4 40 44" width="100%" role="img" aria-label={`${SPECIES_NAME[cast[side]]} ${ROLE_NAME[role]}`}>
                      <ChessStatueArt deck={deck} side={side} role={role} />
                    </svg>
                    <figcaption>{ROLE_NAME[role]}</figcaption>
                  </figure>
                ))}
              </div>
            </section>
          ))}
        </div>
        <div className="table"><Board deck={deck} palette={palette} mode={mode} /></div>
        <Chips label="Palette" value={palette} options={PALETTES} names={PALETTE_NAME} onChange={setPalette} />
        <Chips label="Light or dark" value={mode} options={['light', 'dark'] as const} names={{ light: 'Light', dark: 'Dark' }} onChange={setMode} />
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
