import { describe, it, expect } from 'vitest';

import { formatSynced } from './format-synced';

describe('formatSynced', () => {
  it('formats an ISO timestamp to a locale string containing the year', () => {
    const out = formatSynced('2026-07-06T12:00:00.000Z', 'en-US');
    expect(out.length).toBeGreaterThan(0);
    expect(out).toContain('2026');
  });

  it('returns a non-empty string when no locale is supplied', () => {
    const out = formatSynced('2026-07-06T12:00:00.000Z');
    expect(out.length).toBeGreaterThan(0);
  });

  it('does not throw for a valid ISO string', () => {
    expect(() => formatSynced('2020-01-01T00:00:00.000Z', 'en-US')).not.toThrow();
  });
});
