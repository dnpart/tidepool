// A direct link between two phones on the same Wi-Fi or hotspot (WebRTC data channel), set up by swapping two QR codes:
// the host shows an offer, the guest scans it and shows an answer, the host scans that. No servers are involved, so it
// works offline; the phones find each other on the local network.
import { decodeCode, encodeCode } from './code';

/** How long to wait for the phone to list its network addresses before making a code with what it has. */
const GATHER_MS = 4000;

/** The open line between the phones. Messages that arrive before anyone listens are kept until `listen` is called. */
export interface Channel {
  send(text: string): void;
  listen(onMessage: (text: string) => void): void;
  readonly open: boolean;
  close(): void;
}

export interface Link {
  pc: RTCPeerConnection;
  /** Resolves when the two phones can talk. */
  open: Promise<Channel>;
}

/** Waits until every local network address is in the description (no trickling, since codes go by QR). */
function gathered(pc: RTCPeerConnection): Promise<void> {
  if (pc.iceGatheringState === 'complete') return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => {
      pc.removeEventListener('icegatheringstatechange', check);
      clearTimeout(timer);
      resolve();
    };
    const check = () => pc.iceGatheringState === 'complete' && done();
    const timer = setTimeout(done, GATHER_MS);
    pc.addEventListener('icegatheringstatechange', check);
  });
}

function channelOpen(channel: RTCDataChannel): Promise<Channel> {
  // Listen from the very start, so nothing the other phone says first is lost
  const early: string[] = [];
  let handler: ((text: string) => void) | null = null;
  channel.addEventListener('message', (e) => (handler ? handler(String(e.data)) : early.push(String(e.data))));
  const wrapped: Channel = {
    send: (text) => channel.readyState === 'open' && channel.send(text),
    listen: (onMessage) => {
      handler = onMessage;
      early.splice(0).forEach(onMessage);
    },
    get open() {
      return channel.readyState === 'open';
    },
    close: () => channel.close(),
  };
  if (channel.readyState === 'open') return Promise.resolve(wrapped);
  return new Promise((resolve, reject) => {
    channel.addEventListener('open', () => resolve(wrapped), { once: true });
    channel.addEventListener('close', () => reject(new Error('closed')), { once: true });
  });
}

// No STUN or TURN servers: the phones only ever talk over the network they share
const newConnection = () => new RTCPeerConnection({ iceServers: [] });

/** The first phone: makes the offer code to show. */
export async function host(): Promise<{ link: Link; code: string }> {
  const pc = newConnection();
  const channel = pc.createDataChannel('tidepool', { ordered: true });
  await pc.setLocalDescription(await pc.createOffer());
  await gathered(pc);
  const code = await encodeCode('offer', pc.localDescription!.sdp);
  return { link: { pc, open: channelOpen(channel) }, code };
}

/** The first phone again: takes the answer code it scanned. False if the code isn't an answer. */
export async function finishHost(link: Link, answerCode: string): Promise<boolean> {
  const sdp = await decodeCode(answerCode, 'answer');
  if (!sdp) return false;
  await link.pc.setRemoteDescription({ type: 'answer', sdp });
  return true;
}

/** The second phone: takes the offer code it scanned and makes the answer code to show. Null if it isn't an offer. */
export async function join(offerCode: string): Promise<{ link: Link; code: string } | null> {
  const sdp = await decodeCode(offerCode, 'offer');
  if (!sdp) return null;
  const pc = newConnection();
  const open = new Promise<Channel>((resolve) =>
    pc.addEventListener('datachannel', (e) => resolve(channelOpen(e.channel)), { once: true }),
  );
  await pc.setRemoteDescription({ type: 'offer', sdp });
  await pc.setLocalDescription(await pc.createAnswer());
  await gathered(pc);
  const code = await encodeCode('answer', pc.localDescription!.sdp);
  return { link: { pc, open }, code };
}
