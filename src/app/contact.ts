import { version } from '../../package.json';

/** The app's one public contact address. Keep every other email out of the app and the repo. */
export const FEEDBACK_EMAIL = 'tidepool.five456@passinbox.com';
export const KOFI_URL = 'https://ko-fi.com/drnightphlox';
export const SOURCE_URL = 'https://github.com/dnpart/tidepool';
export const APP_VERSION = version;

export type FeedbackKind = 'idea' | 'problem' | 'hi';

export const FEEDBACK_KINDS: { value: FeedbackKind; label: string; subject: string }[] = [
  { value: 'idea', label: 'Idea', subject: 'An idea' },
  { value: 'problem', label: 'Problem', subject: 'Something went wrong' },
  { value: 'hi', label: 'Say hi', subject: 'Hello' },
];

export interface FeedbackDraft {
  kind: FeedbackKind;
  /** A game's title, or null for the app in general. */
  game: string | null;
  message: string;
  /** Lines describing the phone and app, or null when the person chose not to include them. */
  details: string[] | null;
}

/** A mailto: link that opens the person's email app with the feedback filled in. */
export function feedbackMailto(draft: FeedbackDraft): string {
  const kind = FEEDBACK_KINDS.find((k) => k.value === draft.kind) ?? FEEDBACK_KINDS[0];
  const subject = `Tidepool: ${kind.subject}${draft.game ? ` (${draft.game})` : ''}`;
  let body = draft.message.trim();
  if (draft.details?.length) body += `\n\n---\n${draft.details.join('\n')}`;
  // encodeURIComponent, not URLSearchParams: email apps read "+" as a plus sign, not a space
  return `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/** A short, readable description of the browser and phone, from the user agent. */
export function describeDevice(userAgent: string, brave = false): string {
  const os = /Android/.test(userAgent)
    ? 'Android'
    : /iPhone|iPad|iPod/.test(userAgent)
      ? 'iPhone/iPad'
      : /Mac OS X/.test(userAgent)
        ? 'Mac'
        : /Windows/.test(userAgent)
          ? 'Windows'
          : /Linux/.test(userAgent)
            ? 'Linux'
            : 'another system';
  const match = (re: RegExp) => userAgent.match(re)?.[1];
  let browser: string;
  if (brave) browser = 'Brave';
  else if (match(/SamsungBrowser\/(\d+)/)) browser = `Samsung Internet ${match(/SamsungBrowser\/(\d+)/)}`;
  else if (match(/Firefox\/(\d+)/) ?? match(/FxiOS\/(\d+)/)) browser = `Firefox ${match(/Firefox\/(\d+)/) ?? match(/FxiOS\/(\d+)/)}`;
  else if (match(/Edg[A-Za-z]*\/(\d+)/)) browser = `Edge ${match(/Edg[A-Za-z]*\/(\d+)/)}`;
  else if (match(/CriOS\/(\d+)/) ?? match(/Chrome\/(\d+)/)) browser = `Chrome ${match(/CriOS\/(\d+)/) ?? match(/Chrome\/(\d+)/)}`;
  else if (match(/Version\/(\d+).*Safari/)) browser = `Safari ${match(/Version\/(\d+).*Safari/)}`;
  else browser = 'an unknown browser';
  return `${browser} on ${os}`;
}
