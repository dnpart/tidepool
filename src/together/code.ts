// The handshake codes two phones swap by QR to connect straight to each other (no server, no internet). A code is a
// WebRTC session description, squeezed with deflate and written in URL-safe base64 behind a short tag:
// "TP1O…" is the first phone's offer, "TP1A…" the second phone's answer.

export type CodeKind = 'offer' | 'answer';

const TAG = 'TP1';
const KIND_LETTER: Record<CodeKind, string> = { offer: 'O', answer: 'A' };

async function squeeze(text: string, mode: 'deflate' | 'inflate'): Promise<Uint8Array> {
  const bytes = mode === 'deflate' ? new TextEncoder().encode(text) : Uint8Array.from(atob(text), (c) => c.charCodeAt(0));
  const stream = new Blob([bytes]).stream().pipeThrough(
    mode === 'deflate' ? new CompressionStream('deflate-raw') : new DecompressionStream('deflate-raw'),
  );
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

const toBase64Url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const fromBase64Url = (text: string) => {
  const b64 = text.replace(/-/g, '+').replace(/_/g, '/');
  return b64 + '='.repeat((4 - (b64.length % 4)) % 4);
};

/** Packs a session description into a code for a QR. */
export async function encodeCode(kind: CodeKind, sdp: string): Promise<string> {
  return TAG + KIND_LETTER[kind] + toBase64Url(await squeeze(sdp, 'deflate'));
}

/** Unpacks a scanned code, or null if it isn't one of ours or isn't the kind expected. */
export async function decodeCode(code: string, expected: CodeKind): Promise<string | null> {
  if (!code.startsWith(TAG + KIND_LETTER[expected])) return null;
  try {
    return new TextDecoder().decode(await squeeze(fromBase64Url(code.slice(TAG.length + 1)), 'inflate'));
  } catch {
    return null;
  }
}

/** Which kind a scanned code is, so a phone can say "that's the wrong code" helpfully. */
export function kindOf(code: string): CodeKind | null {
  if (code.startsWith(TAG + 'O')) return 'offer';
  if (code.startsWith(TAG + 'A')) return 'answer';
  return null;
}
