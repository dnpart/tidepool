import { describe, expect, it } from 'vitest';
import { decodeCode, encodeCode, kindOf } from './code';

// A typical offer from Chrome on a phone: two local addresses and the usual lines
const SDP = [
  'v=0', 'o=- 4611731400430051336 2 IN IP4 127.0.0.1', 's=-', 't=0 0', 'a=group:BUNDLE 0', 'a=extmap-allow-mixed',
  'a=msid-semantic: WMS', 'm=application 9 UDP/DTLS/SCTP webrtc-datachannel', 'c=IN IP4 0.0.0.0',
  'a=candidate:1 1 udp 2122260223 192.168.1.23 54321 typ host generation 0 network-id 1',
  'a=candidate:2 1 udp 2122194687 9f3a2c1e-77b1-4e0a-9a51-1c2f3e4d5a6b.local 60001 typ host generation 0 network-id 2',
  'a=ice-ufrag:Ab3d', 'a=ice-pwd:0123456789abcdefABCDEF01', 'a=ice-options:trickle',
  'a=fingerprint:sha-256 6B:8B:5D:EA:59:04:20:23:29:C8:87:1C:CD:87:32:BE:DD:8C:66:A5:8E:50:55:EA:8C:D3:B6:5C:09:5E:89:2F',
  'a=setup:actpass', 'a=mid:0', 'a=sctp-port:5000', 'a=max-message-size:262144', '',
].join('\r\n');

describe('handshake codes', () => {
  it('round-trips an offer and an answer', async () => {
    expect(await decodeCode(await encodeCode('offer', SDP), 'offer')).toBe(SDP);
    expect(await decodeCode(await encodeCode('answer', SDP), 'answer')).toBe(SDP);
  });

  it('is short enough for a QR code a phone camera reads easily', async () => {
    const code = await encodeCode('offer', SDP);
    expect(code.length).toBeLessThan(SDP.length);
    expect(code.length).toBeLessThan(900);
    expect(code).toMatch(/^TP1O[A-Za-z0-9_-]+$/);
  });

  it('tells an offer from an answer, and refuses the wrong kind or anything else', async () => {
    const offer = await encodeCode('offer', SDP);
    expect(kindOf(offer)).toBe('offer');
    expect(kindOf(await encodeCode('answer', SDP))).toBe('answer');
    expect(kindOf('https://example.com')).toBeNull();
    expect(await decodeCode(offer, 'answer')).toBeNull();
    expect(await decodeCode('TP1Onot-really-a-code', 'offer')).toBeNull();
    expect(await decodeCode('hello', 'offer')).toBeNull();
  });
});
