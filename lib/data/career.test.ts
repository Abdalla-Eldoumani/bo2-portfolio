import { describe, expect, it } from 'vitest';
import {
  CHALLENGES,
  MEDALS,
  MISTAKES,
  RANKS,
  challengesForSim,
  medalsForSim,
} from '@/lib/data/career';
import { projects } from '@/lib/data/projects';

const SLUGS = projects.map((p) => p.slug);

describe('career rank ladder', () => {
  it('climbs ten ranks from FNG to COMMANDER', () => {
    expect(RANKS).toHaveLength(10);
    expect(RANKS[0]).toMatchObject({ level: 1, name: 'FNG', xp: 0 });
    expect(RANKS[9]).toMatchObject({ level: 10, name: 'COMMANDER' });
  });

  it('has strictly increasing XP thresholds and levels', () => {
    for (let i = 1; i < RANKS.length; i++) {
      expect(RANKS[i].xp).toBeGreaterThan(RANKS[i - 1].xp);
      expect(RANKS[i].level).toBe(RANKS[i - 1].level + 1);
    }
  });

  it('reuses only the existing enamel emblems', () => {
    for (const r of RANKS) {
      expect(r.emblem).toMatch(/^\/art\/emblems\/rank-[1-5]-[a-z]+\.svg$/);
    }
  });
});

describe('medals', () => {
  it('gives every sim a signature medal plus the shared set', () => {
    const shared = MEDALS.filter((m) => m.sim === undefined);
    expect(shared.length).toBeGreaterThanOrEqual(4);
    for (const slug of SLUGS) {
      const signature = MEDALS.filter((m) => m.sim === slug);
      expect(signature, `signature medal for ${slug}`).toHaveLength(1);
      expect(medalsForSim(slug)).toHaveLength(shared.length + 1);
    }
  });

  it('has unique ids and non-empty display copy', () => {
    expect(new Set(MEDALS.map((m) => m.id)).size).toBe(MEDALS.length);
    for (const m of MEDALS) {
      expect(m.name.length).toBeGreaterThan(0);
      expect(m.description.length).toBeGreaterThan(0);
    }
  });

  it('evaluates checks against real tally shapes', () => {
    const base = { score: 0, bands: [10, 20] as [number, number], events: {}, mistakes: 0 };
    const fused = MEDALS.find((m) => m.id === 'fused-chain');
    expect(fused?.check({ ...base, stats: { fused: 4 } })).toBe(true);
    expect(fused?.check({ ...base, stats: { fused: 3 } })).toBe(false);
    const leaks = MEDALS.find((m) => m.id === 'zero-leaks');
    expect(leaks?.check({ ...base, stats: { cleanPages: 2 } })).toBe(true);
    const flawless = MEDALS.find((m) => m.id === 'flawless');
    expect(flawless?.check({ ...base, score: 12, stats: {}, mistakes: 0 })).toBe(true);
    expect(flawless?.check({ ...base, score: 12, stats: {}, mistakes: 1 })).toBe(false);
    const storm = MEDALS.find((m) => m.id === 'cache-storm');
    expect(storm?.check({ ...base, stats: { cacheHits: 6 } })).toBe(true);
  });

  it('never throws on empty tallies', () => {
    const ctx = { score: 0, bands: [10, 20] as [number, number], stats: {}, events: {}, mistakes: 0 };
    for (const m of MEDALS) expect(() => m.check(ctx)).not.toThrow();
  });
});

describe('challenges', () => {
  it('defines exactly bronze, silver and gold per sim', () => {
    for (const slug of SLUGS) {
      const tiers = challengesForSim(slug).map((c) => c.tier);
      expect(tiers, `challenge tiers for ${slug}`).toEqual(['bronze', 'silver', 'gold']);
    }
    expect(CHALLENGES).toHaveLength(SLUGS.length * 3);
  });

  it('escalates targets within each sim', () => {
    for (const slug of SLUGS) {
      const [b, s, g] = challengesForSim(slug);
      expect(s.target).toBeGreaterThan(b.target);
      expect(g.target).toBeGreaterThan(s.target);
      expect(b.metric).toBe(s.metric);
      expect(s.metric).toBe(g.metric);
    }
  });

  it('has unique ids and detail copy carrying the target', () => {
    expect(new Set(CHALLENGES.map((c) => c.id)).size).toBe(CHALLENGES.length);
    for (const c of CHALLENGES) {
      expect(c.detail).toContain(String(c.target));
    }
  });
});

describe('mistake derivations', () => {
  it('covers every sim and tolerates empty tallies', () => {
    for (const slug of SLUGS) {
      expect(MISTAKES[slug], `mistakes fn for ${slug}`).toBeTypeOf('function');
      expect(() => MISTAKES[slug]({})).not.toThrow();
    }
  });

  it('reads the tallies each game actually reports', () => {
    expect(MISTAKES.peregrine({ groundHits: 2 })).toBe(2);
    expect(MISTAKES.aeos({ panics: 1, irqDropped: 1 })).toBe(2);
    expect(MISTAKES.qala({ judged: 10, correct: 8 })).toBe(2);
    expect(MISTAKES.dossier({ leaks: 1, decoysHit: 2 })).toBe(3);
    expect(MISTAKES.dust({ artifacts: 2 })).toBe(0);
    expect(MISTAKES['budget-buddy']({ pl: -5 })).toBe(1);
  });
});
