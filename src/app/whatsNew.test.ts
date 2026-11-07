import { afterEach, describe, expect, it, vi } from 'vitest';
import { formatDay, hasUnseenUpdates, latestStamp, markUpdatesSeen, UPDATES } from './whatsNew';

function fakeStorage() {
  const data = new Map<string, string>();
  return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v) };
}

describe("What's new", () => {
  afterEach(() => vi.unstubAllGlobals());

  it('lists days newest first, one entry a day, each with something in it', () => {
    const dates = UPDATES.map((u) => u.date);
    for (const d of dates) expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect([...dates].sort().reverse()).toEqual(dates);
    expect(new Set(dates).size).toBe(dates.length);
    for (const u of UPDATES) {
      expect(u.items.length).toBeGreaterThan(0);
      for (const item of u.items) expect(item.trim().length).toBeGreaterThan(10);
    }
  });

  it('shows days as "November 7"', () => {
    expect(formatDay('2026-11-07')).toBe('November 7');
    expect(formatDay('2026-12-25')).toBe('December 25');
  });

  it('a new line on the newest day, or a new day, counts as new', () => {
    const day = { date: '2026-11-07', items: ['A thing that changed.'] };
    expect(latestStamp([{ ...day, items: [...day.items, 'Another thing that changed.'] }])).not.toBe(latestStamp([day]));
    expect(latestStamp([{ date: '2026-11-08', items: ['A thing that changed.'] }, day])).not.toBe(latestStamp([day]));
  });

  it('is new until the page is opened, and new again with the next update', () => {
    vi.stubGlobal('localStorage', fakeStorage());
    expect(hasUnseenUpdates()).toBe(true);
    markUpdatesSeen();
    expect(hasUnseenUpdates()).toBe(false);
    localStorage.setItem('tidepool.seenUpdates', '2000-01-01#1');
    expect(hasUnseenUpdates()).toBe(true);
  });

  it('never shows the dot if storage is blocked', () => {
    vi.stubGlobal('localStorage', { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } });
    expect(hasUnseenUpdates()).toBe(false);
    expect(() => markUpdatesSeen()).not.toThrow();
  });
});
