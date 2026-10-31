import { describe, expect, it } from 'vitest';
import { describeDevice, FEEDBACK_EMAIL, feedbackMailto } from './contact';

const decode = (href: string) => {
  const url = new URL(href);
  return { to: url.pathname, subject: url.searchParams.get('subject'), body: url.searchParams.get('body') };
};

describe('feedbackMailto', () => {
  it('addresses the feedback email with a subject naming the kind and game', () => {
    const href = feedbackMailto({ kind: 'problem', game: 'Dominoes', message: '  The tile stuck. ', details: null });
    expect(href.startsWith(`mailto:${FEEDBACK_EMAIL}?`)).toBe(true);
    expect(decode(href)).toEqual({ to: FEEDBACK_EMAIL, subject: 'Tidepool: Something went wrong (Dominoes)', body: 'The tile stuck.' });
  });

  it('adds the details under a line, and encodes spaces as %20 rather than +', () => {
    const href = feedbackMailto({ kind: 'idea', game: null, message: 'More cats & dogs', details: ['Chrome 130 on Android', 'Lagoon'] });
    expect(href).not.toContain('+');
    expect(decode(href).subject).toBe('Tidepool: An idea');
    expect(decode(href).body).toBe('More cats & dogs\n\n---\nChrome 130 on Android\nLagoon');
  });
});

describe('describeDevice', () => {
  const android = 'Mozilla/5.0 (Linux; Android 14; A065) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36';
  const iphone = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';

  it('names the browser, its version and the system', () => {
    expect(describeDevice(android)).toBe('Chrome 130 on Android');
    expect(describeDevice(iphone)).toBe('Safari 17 on iPhone/iPad');
    expect(describeDevice(android, true)).toBe('Brave on Android');
    expect(describeDevice('Mozilla/5.0 (Android 14; Mobile; rv:131.0) Gecko/131.0 Firefox/131.0')).toBe('Firefox 131 on Android');
  });
});
