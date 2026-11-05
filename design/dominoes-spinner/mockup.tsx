// Mockup (Nov 5): All Fives with a spinner, laid out by the app's own rules and layout code, played a tile at a time
// so the owner can watch the cross grow and the table zoom out only once it needs the room.
// Built into spinner.html by `node design/dominoes-spinner/build.mjs`.
import { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Domino } from '../../src/games/dominoes/Domino';
import { layoutCross, layoutLine } from '../../src/games/dominoes/layout';
import { endsTotal, newGame, openList, takeTurn, type DominoesState } from '../../src/games/dominoes/rules';
import { seededRandom } from '../../src/util/random';

const TABLE = { width: Math.max(260, Math.min(330, window.innerWidth - 64)), height: 390 };
const C = { bg: 'var(--bg)', surface: 'var(--surface)', ink: 'var(--ink)', sub: 'var(--sub)', accent: 'var(--accent)', soft: 'var(--soft)', line: 'var(--line)', onAccent: 'var(--on-accent)', felt: 'var(--felt)', target: 'var(--target)' };

/** One round of All Fives between three computers, kept tile by tile. A long one with the spinner's arms in use. */
function playRound(seed: number): DominoesState[] {
  const random = seededRandom(seed);
  let s = newGame(2, random, 'fives');
  const shots: DominoesState[] = [];
  while (s.phase === 'play') {
    const before = s.line.length + s.up.length + s.down.length;
    s = takeTurn(s);
    if (s.line.length + s.up.length + s.down.length > before) shots.push(s);
  }
  return shots;
}

function goodSeeds(): number[] {
  const out: number[] = [];
  for (let seed = 1; out.length < 12 && seed < 3000; seed++) {
    const shots = playRound(seed);
    const last = shots[shots.length - 1];
    if (last.spinner !== null && last.up.length >= 2 && last.down.length >= 2 && shots.length >= 18) out.push(seed);
  }
  return out;
}

function Table({ state }: { state: DominoesState }) {
  const ends = openList(state);
  const spun = state.spinner !== null;
  const layout = spun
    ? layoutCross({ line: state.line, spinner: state.spinner!, up: state.up, down: state.down }, ends, TABLE.width, TABLE.height)
    : { ...layoutLine(state.line, TABLE.width, TABLE.height), scale: 1 };
  return (
    <div style={{ position: 'relative', width: TABLE.width, height: TABLE.height, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, transformOrigin: '50% 50%', transform: `scale(${layout.scale})`, transition: 'transform 450ms ease' }}>
        <div style={{ position: 'absolute', left: (TABLE.width - TABLE.width / layout.scale) / 2, top: (TABLE.height - TABLE.height / layout.scale) / 2, width: TABLE.width / layout.scale, height: TABLE.height / layout.scale }}>
          {layout.items.map((item) =>
            item.kind === 'end' ? (
              <div key={item.end} style={{
                position: 'absolute', left: item.x, top: item.y, width: layout.target, height: layout.target, display: 'grid', placeItems: 'center',
                borderRadius: 10, border: `2px dashed ${C.accent}`, background: C.target, color: C.accent, fontWeight: 700, fontSize: 14,
                boxSizing: 'border-box', transition: 'left 300ms ease, top 300ms ease',
              }}>{item.value}</div>
            ) : (
              <div key={`${Math.min(item.a, item.b)}${Math.max(item.a, item.b)}`} style={{ position: 'absolute', left: item.x - 2, top: item.y - 2, lineHeight: 0, transition: 'left 300ms ease, top 300ms ease' }}>
                <Domino a={item.a} b={item.b} size={layout.size} vertical={item.vertical} />
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  );
}

function App() {
  const seeds = useMemo(goodSeeds, []);
  const [round, setRound] = useState(0);
  const shots = useMemo(() => playRound(seeds[round % seeds.length]), [seeds, round]);
  const [step, setStep] = useState(0);
  const [auto, setAuto] = useState(false);
  const state = shots[Math.min(step, shots.length - 1)];
  const atEnd = step >= shots.length - 1;

  useEffect(() => {
    if (!auto) return;
    if (atEnd) return setAuto(false);
    const t = setTimeout(() => setStep((n) => n + 1), 900);
    return () => clearTimeout(t);
  }, [auto, step, atEnd]);

  const ends = openList(state);
  const total = endsTotal(state.line, state.up, state.down);
  const scored = state.last?.scored ?? 0;
  const tiles = state.line.length + state.up.length + state.down.length;
  const spun = state.spinner !== null;
  const scale = spun
    ? layoutCross({ line: state.line, spinner: state.spinner!, up: state.up, down: state.down }, ends, TABLE.width, TABLE.height).scale
    : 1;
  const button = (primary: boolean): React.CSSProperties => ({
    flex: 1, minHeight: 48, borderRadius: 16, border: primary ? 'none' : `2px solid ${C.line}`, background: primary ? C.accent : C.surface,
    color: primary ? C.onAccent : C.ink, font: 'inherit', fontWeight: 700, fontSize: 16,
  });

  return (
    <main style={{ maxWidth: 390, margin: '0 auto', paddingBlock: 16 }}>
      <h1 style={{ fontSize: 24, margin: '4px 0 6px', fontFamily: 'var(--display)', fontWeight: 600, textWrap: 'balance' }}>All Fives with a spinner</h1>
      <p style={{ margin: '0 0 12px', color: C.sub, fontSize: 15, lineHeight: 1.45 }}>
        The opening double is the spinner. Once both its sides have a tile, its top and bottom open too. Tiles stay full size
        until the table runs out of room, then everything zooms out a step. An arm that reaches the edge turns the corner.
      </p>
      <div style={{ padding: '9px 12px', borderRadius: 14, background: C.soft, fontWeight: 700, fontSize: 15, textAlign: 'center', marginBottom: 10 }}>
        Tile {tiles} · {ends.length} open ends make {total}
        {scored ? ` · scored ${scored}!` : ''}
      </div>
      <div style={{ padding: 14, borderRadius: 22, background: C.felt, border: `2px solid ${C.line}` }}>
        <Table state={state} />
      </div>
      <p style={{ margin: '8px 0 12px', color: C.sub, fontSize: 14, textAlign: 'center' }}>
        Zoom {Math.round(scale * 100)}%{spun ? '' : ' · no spinner this round'}
      </p>
      <div style={{ display: 'flex', gap: 10 }}>
        <button type="button" style={button(false)} disabled={step === 0} onClick={() => { setAuto(false); setStep((n) => Math.max(0, n - 1)); }}>Back</button>
        <button type="button" style={button(true)} disabled={atEnd} onClick={() => { setAuto(false); setStep((n) => n + 1); }}>Next tile</button>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
        <button type="button" style={button(false)} onClick={() => { if (atEnd) setStep(0); setAuto((a) => !a); }}>{auto ? 'Pause' : 'Play it out'}</button>
        <button type="button" style={button(false)} onClick={() => { setAuto(false); setStep(0); setRound((r) => r + 1); }}>Another round</button>
      </div>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
