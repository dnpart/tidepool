// The "What's new" page's list (Settings → What's new): what changed for players, newest first, grouped by day.
// Every change people can see adds a line here in the same commit (see CLAUDE.md "What's new"). Keep each line short
// and in players' words; behind-the-scenes work (tests, the art export) stays out.

export interface Update {
  /** The day, as YYYY-MM-DD. */
  date: string;
  items: string[];
}

export const UPDATES: Update[] = [
  {
    date: '2026-11-07',
    items: [
      "What's new lives here now, in Settings, and the tips on Home are shorter. A dot on the Settings button means there's something new.",
      'Coral Stack: a new shape or coral color arrives with each level up to level 8, starting with the branch (three blocks with one on top) at level 2.',
      'Tide Swap: swipe down on the columns to drop, just like Bubble Pals and Coral Stack.',
      "Tide Swap: two bottom shells that meet now wash away. They don't make a pearl.",
    ],
  },
  {
    date: '2026-11-06',
    items: ['New game: Checkers. Play the computer (easy, medium or hard), or pass the phone to a friend.'],
  },
  {
    date: '2026-11-05',
    items: [
      'Dominoes: All Fives, a second way to play, scoring points to 100. An opening double becomes a spinner that can be played on all four sides. Switch to it in the game menu.',
      'The fox and owl are hand-drawn now, all 28 of them.',
      'Pond Hop: in Koi Garden, the koi swim around the pond.',
    ],
  },
  {
    date: '2026-11-04',
    items: [
      'New palette: Koi Garden, with cherry petals falling by day and paper lanterns at night.',
      'Pond Hop: new ponds with rocky edges and piers, and the die is now the only button at the bottom.',
      'The pieces in Bubble Pals, Coral Stack, Tide Swap and Pond Hop are hand-drawn now, and so are the clouds and snowflakes.',
    ],
  },
  {
    date: '2026-11-02',
    items: [
      'Three new games: Bubble Pals, Coral Stack and Tide Swap.',
      'The octopus and manta are hand-drawn now, and the app has a new icon.',
      'Pond Hop: Winter freezes the pond, and Forest and Honeycomb give it their own look and hop sound.',
      'Card tables in dark mode follow your palette.',
      'Sounds come back after a phone call or switching apps.',
    ],
  },
  {
    date: '2026-11-01',
    items: ['Fishy: when the computer catches a fib it was sure about, it tells you why ("I had three 7s!").'],
  },
];

const SEEN_KEY = 'tidepool.seenUpdates';

/** Changes whenever a line is added to the newest day, or a new day starts. */
export const latestStamp = (updates: Update[] = UPDATES): string =>
  updates.length ? `${updates[0].date}#${updates[0].items.length}` : '';

/** True when there's an update this phone hasn't seen on the What's new page (a fresh install counts as unseen). */
export function hasUnseenUpdates(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) !== latestStamp();
  } catch {
    return false;
  }
}

/** Called when the What's new page opens. */
export function markUpdatesSeen(): void {
  try {
    localStorage.setItem(SEEN_KEY, latestStamp());
  } catch {
    // not saved: the dot just stays
  }
}

/** "November 7", from YYYY-MM-DD, read as a local day. */
export function formatDay(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}
