// Compact relative-time token for the scoreboard killfeed ("5m", "3h", "2d").
//
// The anchor is an explicit `relativeTo` argument, NEVER Date.now(): the section
// is a static/ISR Server Component and its rows are aged against the snapshot's
// `syncedAt` (per UI-SPEC "Relative time computed against syncedAt"). Reading the
// wall clock here would make the route dynamic, break deterministic tests, and
// drift the frozen-fallback rows away from the register-identity the fallback is
// meant to preserve. Pure: output derives only from the two ISO arguments, no I/O,
// no third-party date library.

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
// Coarse buckets use month = 30d, year = 365d. The token is decorative recency
// flavor (row order carries the real ordering per UI-SPEC), so the approximation
// is deliberate and documented rather than a calendar-accurate computation.
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

export function timeAgo(iso: string, relativeTo: string): string {
  const then = new Date(iso).getTime();
  const now = new Date(relativeTo).getTime();
  // Either arg being an invalid date (or a future `iso` from clock skew) collapses
  // to the safest neutral token rather than emitting "NaN"/"Invalid" or throwing.
  if (Number.isNaN(then) || Number.isNaN(now)) return 'just now';

  const delta = Math.max(0, now - then);

  if (delta < MINUTE) return 'just now';
  if (delta < HOUR) return `${Math.floor(delta / MINUTE)}m`;
  if (delta < DAY) return `${Math.floor(delta / HOUR)}h`;
  if (delta < WEEK) return `${Math.floor(delta / DAY)}d`;
  if (delta < MONTH) return `${Math.floor(delta / WEEK)}w`;
  if (delta < YEAR) return `${Math.floor(delta / MONTH)}mo`;
  return `${Math.floor(delta / YEAR)}y`;
}
