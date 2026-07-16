import { describe, expect, it } from 'vitest';
import {
  TRIAGE_DOMAINS,
  TRIAGE_STATEMENTS,
} from '@/lib/data/cloud-triage';

describe('cloud triage statements', () => {
  it('covers all four CLF-C02 domains evenly', () => {
    const domains = Object.keys(TRIAGE_DOMAINS);
    expect(domains).toHaveLength(4);
    for (const d of domains) {
      const inDomain = TRIAGE_STATEMENTS.filter((s) => s.domain === d);
      expect(inDomain, `statements for ${d}`).toHaveLength(6);
    }
  });

  it('mixes true and false claims in every domain', () => {
    for (const d of Object.keys(TRIAGE_DOMAINS)) {
      const inDomain = TRIAGE_STATEMENTS.filter((s) => s.domain === d);
      expect(inDomain.some((s) => s.truth)).toBe(true);
      expect(inDomain.some((s) => !s.truth)).toBe(true);
    }
  });

  it('keeps statements unique and short enough for the two-second read', () => {
    const texts = TRIAGE_STATEMENTS.map((s) => s.text);
    expect(new Set(texts).size).toBe(texts.length);
    for (const t of texts) {
      expect(t.length).toBeGreaterThan(0);
      expect(t.length).toBeLessThanOrEqual(40);
    }
  });
});
