import { describe, it, expect } from 'vitest';

import { timeAgo } from './time-ago';

// Anchor every case against a fixed `relativeTo` (never the wall clock) so the
// assertions are deterministic and mirror how the scoreboard reads its rows:
// each createdAt is aged against the snapshot's syncedAt.
const REL = '2026-07-08T12:00:00.000Z';

function isoBefore(ms: number): string {
  return new Date(Date.parse(REL) - ms).toISOString();
}

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

describe('timeAgo', () => {
  it('reads the same instant as "just now"', () => {
    expect(timeAgo(REL, REL)).toBe('just now');
  });

  it('reads a sub-minute delta as "just now"', () => {
    expect(timeAgo(isoBefore(45 * SECOND), REL)).toBe('just now');
  });

  it('reads minutes as "{n}m"', () => {
    expect(timeAgo(isoBefore(5 * MINUTE), REL)).toBe('5m');
  });

  it('reads hours as "{n}h"', () => {
    expect(timeAgo(isoBefore(3 * HOUR), REL)).toBe('3h');
  });

  it('reads days as "{n}d"', () => {
    expect(timeAgo(isoBefore(2 * DAY), REL)).toBe('2d');
  });

  it('reads weeks as "{n}w"', () => {
    expect(timeAgo(isoBefore(3 * WEEK), REL)).toBe('3w');
  });

  it('reads months as "{n}mo"', () => {
    expect(timeAgo(isoBefore(150 * DAY), REL)).toBe('5mo');
  });

  it('reads years as "{n}y"', () => {
    expect(timeAgo(isoBefore(730 * DAY), REL)).toBe('2y');
  });

  it('clamps a future iso (clock skew) to "just now"', () => {
    const future = new Date(Date.parse(REL) + HOUR).toISOString();
    expect(timeAgo(future, REL)).toBe('just now');
  });

  it('guards an invalid iso to "just now" without throwing', () => {
    expect(() => timeAgo('not-a-date', REL)).not.toThrow();
    expect(timeAgo('not-a-date', REL)).toBe('just now');
  });

  it('guards an invalid relativeTo to "just now" without throwing', () => {
    expect(() => timeAgo(REL, 'nope')).not.toThrow();
    expect(timeAgo(REL, 'nope')).toBe('just now');
  });
});
