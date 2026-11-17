// The hint and whether the game is lost, for the position on the table, worked out in a worker (analysisWorker.ts).
// Null until the answer for this position arrives (usually a few milliseconds); where workers aren't available it's
// worked out at once instead.
import { useEffect, useRef, useState } from 'react';
import type { AnalysisRequest } from './analysisWorker';
import { analyze, bestSoFar, type Analysis, type Solitaire } from './rules';

export function useAnalysis(game: Solitaire): Analysis | null {
  const worker = useRef<Worker | null>(null);
  const latest = useRef(0);
  const [answer, setAnswer] = useState<{ id: number; result: Analysis } | null>(null);

  useEffect(() => {
    if (typeof Worker === 'undefined') return;
    try {
      const w = new Worker(new URL('./analysisWorker.ts', import.meta.url), { type: 'module' });
      w.onmessage = (e: MessageEvent<{ id: number; result: Analysis }>) => {
        if (e.data.id === latest.current) setAnswer(e.data);
      };
      worker.current = w;
      return () => w.terminate();
    } catch {
      worker.current = null;
    }
  }, []);

  useEffect(() => {
    const id = ++latest.current;
    const best = bestSoFar(game);
    const w = worker.current;
    if (!w) {
      setAnswer({ id, result: analyze({ board: game.board, drawCount: game.drawCount }, best) });
      return;
    }
    const request: AnalysisRequest = { id, board: game.board, drawCount: game.drawCount, best };
    w.postMessage(request);
  }, [game]);

  return answer && answer.id === latest.current ? answer.result : null;
}
