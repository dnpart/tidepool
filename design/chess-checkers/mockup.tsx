// Mockup (Nov 5): three looks for checkers and chess pieces, on boards in every palette, light and dark, with the
// app's own deck characters for the third look. Built into pieces.html by `node design/chess-checkers/build.mjs`.
import { useState, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { CreatureArt } from '../../src/art/Creature';
import { FoxOwlArt } from '../../src/art/FoxOwl';
import { GardenArt } from '../../src/art/Garden';
import type { Hat } from '../../src/art/Creature';
import { BASE_TOKENS, PALETTES, type Mode, type Palette } from '../../src/theme/tokens';

type Game = 'checkers' | 'chess';
type Look = 'classic' | 'tokens' | 'characters';
type Deck = 'sea' | 'arctic' | 'honey' | 'woodland' | 'cats';
type Role = 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';
type Side = 'you' | 'them';
interface Piece { side: Side; role: Role | 'man' | 'crowned' }

const PALETTE_NAME: Record<Palette, string> = { lagoon: 'Lagoon', coral: 'Coral Reef', winter: 'Winter', honeycomb: 'Honeycomb', forest: 'Forest', koi: 'Koi Garden' };
const DECK_NAME: Record<Deck, string> = { sea: 'Octo + Manta', arctic: 'Fox + Owl', honey: 'Bee + Sloth', woodland: 'Mushroom + Moth', cats: 'Cats' };
const LOOK_NAME: Record<Look, string> = { classic: 'Classic', tokens: 'Tokens', characters: 'Characters' };
const LOOK_NOTE: Record<Look, string> = {
  classic: 'Standing pieces, the shapes everyone knows, in cream and the palette’s ink. Quickest to read.',
  tokens: 'Round counters seen from above, like checkers, with the chess role drawn on top. One family for both games.',
  characters: 'Your deck’s two teams. Checkers pieces are the characters; in chess the pawns are characters and the others wear the role on a badge.',
};

// --- the boards ---

/** Checkers, mid-game: you (bottom) to move; your piece on c3 is picked up and must jump. */
function checkersBoard(): (Piece | null)[][] {
  const b: (Piece | null)[][] = Array.from({ length: 8 }, () => Array(8).fill(null));
  const put = (sq: string, side: Side, crowned = false) => {
    const col = sq.charCodeAt(0) - 97, row = 8 - Number(sq[1]);
    b[row][col] = { side, role: crowned ? 'crowned' : 'man' };
  };
  ['b8', 'd8', 'h8', 'a7', 'c7', 'g7', 'd6', 'f6', 'h6'].forEach((s) => put(s, 'them'));
  put('b4', 'them');
  put('e5', 'them', true);
  ['c3', 'e3', 'g3', 'b2', 'd2', 'f2', 'h2', 'a1', 'e1'].forEach((s) => put(s, 'you'));
  put('g5', 'you', true);
  return b;
}
const CHECKERS_PICKED = 'c3';
const CHECKERS_TARGETS = ['a5'];
const CHECKERS_LAST = ['f6', 'e5'];

/** Chess after 1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5: your knight on f3 is picked up. */
function chessBoard(): (Piece | null)[][] {
  const b: (Piece | null)[][] = Array.from({ length: 8 }, () => Array(8).fill(null));
  const put = (sq: string, side: Side, role: Role) => {
    b[8 - Number(sq[1])][sq.charCodeAt(0) - 97] = { side, role };
  };
  const back: [string, Role][] = [['a', 'rook'], ['c', 'bishop'], ['d', 'queen'], ['e', 'king'], ['h', 'rook']];
  back.forEach(([f, r]) => { put(`${f}1`, 'you', r); put(`${f}8`, 'them', r); });
  put('b1', 'you', 'knight'); put('f3', 'you', 'knight'); put('c4', 'you', 'bishop');
  put('g8', 'them', 'knight'); put('c6', 'them', 'knight'); put('c5', 'them', 'bishop');
  for (const f of 'abcdfgh') { put(`${f}2`, 'you', 'pawn'); put(`${f}7`, 'them', 'pawn'); }
  put('e4', 'you', 'pawn'); put('e5', 'them', 'pawn');
  // c1 and f8 bishops have moved; their home squares stay empty
  b[7][2] = null; put('c1', 'you', 'bishop'); b[7][2] = { side: 'you', role: 'bishop' };
  b[0][5] = null;
  return b;
}
const CHESS_PICKED = 'f3';
const CHESS_TARGETS = ['g5', 'h4', 'd4', 'g1', 'e5'];
const CHESS_LAST = ['f8', 'c5'];

const at = (sq: string): [number, number] => [8 - Number(sq[1]), sq.charCodeAt(0) - 97];
const sqName = (row: number, col: number) => `${String.fromCharCode(97 + col)}${8 - row}`;

// --- piece drawings (viewBox 0 0 40 40) ---

const SHAPES: Record<Role, string> = {
  pawn: 'M20 7a5.5 5.5 0 0 1 3.4 9.8C26 18.6 27.5 21.6 27.5 25H12.5c0-3.4 1.5-6.4 4.1-8.2A5.5 5.5 0 0 1 20 7Z M10.5 27h19l1.5 6h-22z',
  rook: 'M11 7h4v3h3V7h4v3h3V7h4v8l-3 2v9h-12v-9l-3-2z M10 28h20l1.5 5h-23z',
  knight: 'M14 33l1.5-7c-2.5-1.5-4-4-4-7.5 0-6 4.5-11.5 11-11.5l1.5-2.5 1.5 3c3 1.5 5 5.5 5 10.5V26l1.5 7z M17.5 14.5a1.6 1.6 0 1 0 0.01 0',
  bishop: 'M20 5.5a2.3 2.3 0 0 1 2 3.4c3.6 2.2 5.5 5.6 5.5 9 0 3.3-1.7 5.6-4 7H16.5c-2.3-1.4-4-3.7-4-7 0-3.4 1.9-6.8 5.5-9A2.3 2.3 0 0 1 20 5.5Z M10.5 27h19l1.5 6h-22z',
  queen: 'M8 12l4 12h16l4-12-6 6-6-11-6 11z M10.5 27h19l1.5 6h-22z M8 9.5a2 2 0 1 0 0.01 0 M32 9.5a2 2 0 1 0 0.01 0 M20 4.5a2 2 0 1 0 0.01 0',
  king: 'M18.5 3h3v3.5H25v3h-3.5V13c4.5 1 7.5 4.5 7.5 8.5 0 1.3-.3 2.5-.8 3.5H11.8c-.5-1-.8-2.2-.8-3.5 0-4 3-7.5 7.5-8.5V9.5H15v-3h3.5z M10.5 27h19l1.5 6h-22z',
};
const SLIT: Partial<Record<Role, string>> = { bishop: 'M22.5 11.5l-4 5', knight: 'M15 23c2-1 4-3.5 5-6' };

interface Colors { you: string; youEdge: string; them: string; themEdge: string; light: string; dark: string; pick: string; dot: string; last: string; coord: string }

function boardColors(palette: Palette, mode: Mode): Colors {
  const t = BASE_TOKENS[palette][mode];
  return mode === 'light'
    ? { you: '#FFFBF2', youEdge: '#B9AE98', them: t.ink, themEdge: '#0B1A20', light: t.surface, dark: mix(t.accent, t.surface, 0.42), pick: t.accent, dot: t.accent, last: mix('#F2C94C', t.surface, 0.45), coord: t.sub }
    : { you: '#F4EEE2', youEdge: '#B9AE98', them: '#2B3742', themEdge: '#10161C', light: mix(t.accent, t.surface, 0.18), dark: mix(t.accent, t.bg, 0.45), pick: t.accent, dot: t.accent, last: mix('#F2C94C', t.surface, 0.4), coord: t.sub };
}

function mix(a: string, b: string, k: number): string {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return `#${x.map((v, i) => Math.round(v * k + y[i] * (1 - k)).toString(16).padStart(2, '0')).join('')}`;
}

function Classic({ piece, c }: { piece: Piece; c: Colors }) {
  const fill = piece.side === 'you' ? c.you : c.them;
  const edge = piece.side === 'you' ? c.youEdge : c.themEdge;
  if (piece.role === 'man' || piece.role === 'crowned') return <Disc piece={piece} c={c} />;
  return (
    <g>
      <path d={SHAPES[piece.role]} fill={fill} stroke={edge} strokeWidth={1.4} strokeLinejoin="round" fillRule="nonzero" />
      {SLIT[piece.role] && <path d={SLIT[piece.role]} fill="none" stroke={edge} strokeWidth={1.3} strokeLinecap="round" />}
    </g>
  );
}

/** A checkers piece seen from above, or a round chess token with its role on top. */
function Disc({ piece, c, glyph = true }: { piece: Piece; c: Colors; glyph?: boolean }) {
  const fill = piece.side === 'you' ? c.you : c.them;
  const edge = piece.side === 'you' ? c.youEdge : c.themEdge;
  const mark = piece.side === 'you' ? c.them : c.you;
  const role = piece.role;
  return (
    <g>
      <circle cx={20} cy={21.5} r={16} fill={edge} />
      <circle cx={20} cy={20} r={16} fill={fill} stroke={edge} strokeWidth={1.2} />
      <circle cx={20} cy={20} r={11.5} fill="none" stroke={edge} strokeOpacity={0.55} strokeWidth={1.2} />
      {role === 'crowned' && <path d="M12.5 24.5l-1.5-9 5 4 4-6.5 4 6.5 5-4-1.5 9z" fill="#F2C94C" stroke="#B88A12" strokeWidth={1} strokeLinejoin="round" />}
      {glyph && role !== 'man' && role !== 'crowned' && (
        <g transform="translate(9 8.5) scale(0.55)">
          <path d={SHAPES[role]} fill={mark} />
          {SLIT[role] && <path d={SLIT[role]} fill="none" stroke={fill} strokeWidth={2} strokeLinecap="round" />}
        </g>
      )}
    </g>
  );
}

/** The deck's character for a side, in the viewBox 0 -8 64 68. */
function CharacterArt({ deck, side, hat }: { deck: Deck; side: Side; hat?: Hat }) {
  const you = side === 'you';
  if (deck === 'sea') return <CreatureArt kind={you ? 'octopus' : 'manta'} color={you ? '#EE8C9E' : '#7A9EB0'} eyes="happy" hat={hat} />;
  if (deck === 'arctic') return <FoxOwlArt kind={you ? 'fox' : 'owl'} suit={you ? 'hearts' : 'spades'} eyes="happy" hat={hat} />;
  if (deck === 'honey') return <GardenArt kind={you ? 'sloth' : 'bee'} suit={you ? 'hearts' : 'spades'} eyes="happy" hat={hat} />;
  if (deck === 'woodland') return <GardenArt kind={you ? 'mushroom' : 'moth'} suit={you ? 'hearts' : 'clubs'} eyes="happy" hat={hat} grass={false} />;
  return <GardenArt kind="cat" suit={you ? 'diamonds' : 'spades'} eyes="happy" hat={hat} />;
}

function Characters({ piece, c, deck }: { piece: Piece; c: Colors; deck: Deck }) {
  const role = piece.role;
  const hat: Hat | undefined = role === 'crowned' || role === 'king' ? 'king' : role === 'queen' ? 'queen' : undefined;
  const ring = piece.side === 'you' ? c.you : c.them;
  const edge = piece.side === 'you' ? c.youEdge : c.themEdge;
  const badge = role !== 'man' && role !== 'crowned' && role !== 'pawn' && role !== 'king' && role !== 'queen';
  return (
    <g>
      <circle cx={20} cy={21.5} r={17} fill={edge} />
      <circle cx={20} cy={20} r={17} fill={ring} stroke={edge} strokeWidth={1.2} />
      <svg x={4} y={2} width={32} height={34} viewBox="0 -8 64 68" overflow="visible">
        <CharacterArt deck={deck} side={piece.side} hat={hat} />
      </svg>
      {badge && (
        <g>
          <circle cx={31} cy={31} r={8} fill={piece.side === 'you' ? c.them : c.you} stroke={edge} strokeWidth={1} />
          <g transform="translate(25.4 25) scale(0.28)">
            <path d={SHAPES[role as Role]} fill={piece.side === 'you' ? c.you : c.them} />
          </g>
        </g>
      )}
    </g>
  );
}

function Board({ game, look, palette, mode, deck }: { game: Game; look: Look; palette: Palette; mode: Mode; deck: Deck }) {
  const c = boardColors(palette, mode);
  const board = game === 'chess' ? chessBoard() : checkersBoard();
  const picked = at(game === 'chess' ? CHESS_PICKED : CHECKERS_PICKED);
  const targets = (game === 'chess' ? CHESS_TARGETS : CHECKERS_TARGETS).map(at);
  const last = (game === 'chess' ? CHESS_LAST : CHECKERS_LAST).map(at);
  const S = 40;
  const cells: ReactNode[] = [];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const dark = (row + col) % 2 === 1;
      const isLast = last.some(([r, k]) => r === row && k === col);
      cells.push(<rect key={`s${row}${col}`} x={col * S} y={row * S} width={S} height={S} fill={isLast ? c.last : dark ? c.dark : c.light} />);
      if (game === 'chess' && col === 0) cells.push(<text key={`r${row}`} x={2.5} y={row * S + 10} fontSize={8} fill={c.coord} fontWeight={700}>{8 - row}</text>);
      if (game === 'chess' && row === 7) cells.push(<text key={`f${col}`} x={col * S + S - 7} y={8 * S - 3} fontSize={8} fill={c.coord} fontWeight={700}>{sqName(7, col)[0]}</text>);
    }
  }
  const pieces: ReactNode[] = [];
  board.forEach((line, row) => line.forEach((p, col) => {
    if (!p) return;
    const isPicked = picked[0] === row && picked[1] === col;
    pieces.push(
      <g key={`p${row}${col}`} transform={`translate(${col * S} ${row * S - (isPicked ? 3 : 0)})`}>
        {isPicked && <rect x={1.5} y={4.5} width={S - 3} height={S - 3} rx={8} fill="none" stroke={c.pick} strokeWidth={3} />}
        {look === 'classic' ? <Classic piece={p} c={c} /> : look === 'tokens' ? <Disc piece={p} c={c} /> : <Characters piece={p} c={c} deck={deck} />}
      </g>,
    );
  }));
  const dots = targets.map(([row, col]) => board[row][col]
    ? <circle key={`t${row}${col}`} cx={col * S + S / 2} cy={row * S + S / 2} r={17} fill="none" stroke={c.dot} strokeWidth={3} opacity={0.8} />
    : <circle key={`t${row}${col}`} cx={col * S + S / 2} cy={row * S + S / 2} r={6} fill={c.dot} opacity={0.75} />);
  return (
    <svg viewBox="0 0 320 320" style={{ width: '100%', display: 'block', borderRadius: 14 }} role="img"
      aria-label={`${game === 'chess' ? 'Chess' : 'Checkers'} board, ${LOOK_NAME[look]} pieces`}>
      {cells}
      {dots}
      {pieces}
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
        {options.map((o) => (
          <button key={o} type="button" role="radio" aria-checked={o === value} className="chip" onClick={() => onChange(o)}>{names[o]}</button>
        ))}
      </div>
    </div>
  );
}

function App() {
  const [game, setGame] = useState<Game>('checkers');
  const [look, setLook] = useState<Look>('tokens');
  const [palette, setPalette] = useState<Palette>('lagoon');
  const [mode, setMode] = useState<Mode>(() => (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  const [deck, setDeck] = useState<Deck>('sea');
  const t = BASE_TOKENS[palette][mode];
  const style = {
    '--bg': t.bg, '--surface': t.surface, '--ink': t.ink, '--sub': t.sub, '--accent': t.accent, '--on-accent': t.onAccent,
    '--soft': t.accentSoft, '--line': t.line, colorScheme: mode,
  } as React.CSSProperties;
  const status = game === 'chess'
    ? 'Your knight is picked up: tap a dot to move it, or the ring to take the pawn'
    : 'You must jump: tap the dot to take the black piece';
  return (
    <div className="app" style={style}>
      <main>
        <h1>Checkers and chess pieces</h1>
        <p className="intro">Three looks to choose from. Switch the game, the palette and light or dark to see each one where you’d play it.</p>
        <Chips label="Game" value={game} options={['checkers', 'chess'] as const} names={{ checkers: 'Checkers', chess: 'Chess' }} onChange={setGame} />
        <Chips label="Look" value={look} options={['classic', 'tokens', 'characters'] as const} names={LOOK_NAME} onChange={setLook} />
        <p className="note">{LOOK_NOTE[look]}</p>
        {look === 'characters' && <Chips label="Deck" value={deck} options={['sea', 'arctic', 'honey', 'woodland', 'cats'] as const} names={DECK_NAME} onChange={setDeck} />}
        <div className="status">{status}</div>
        <div className="table"><Board game={game} look={look} palette={palette} mode={mode} deck={deck} /></div>
        <Chips label="Palette" value={palette} options={PALETTES} names={PALETTE_NAME} onChange={setPalette} />
        <Chips label="Light or dark" value={mode} options={['light', 'dark'] as const} names={{ light: 'Light', dark: 'Dark' }} onChange={setMode} />
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
