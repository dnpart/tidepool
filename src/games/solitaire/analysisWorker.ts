// Works out the hint and whether the game is lost (rules.ts `analyze`) off the main thread: in a hard position the
// search can take a second or two on a phone, and the cards must never freeze while it thinks.
import { analyze, type Board, type DrawCount } from './rules';

export interface AnalysisRequest {
  id: number;
  board: Board;
  drawCount: DrawCount;
  best: number;
}

self.onmessage = (e: MessageEvent<AnalysisRequest>) => {
  const { id, board, drawCount, best } = e.data;
  self.postMessage({ id, result: analyze({ board, drawCount }, best) });
};
