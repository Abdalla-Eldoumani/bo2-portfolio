import { describe, expect, it } from 'vitest';
import {
  RANK_CAP_XP,
  bandRank,
  careerTotals,
  loadCareer,
  rankForXp,
  recordRound,
} from '@/lib/career';
import { XP_PER_CHALLENGE, XP_PER_MEDAL } from '@/lib/data/career';

// Node has no window: the store runs on its in-memory fallback, which is
// exactly the degraded browser path — the math under test is identical.

describe('rank resolution', () => {
  it('maps xp to the ladder', () => {
    expect(rankForXp(0).name).toBe('FNG');
    expect(rankForXp(99).name).toBe('FNG');
    expect(rankForXp(100).name).toBe('RECRUIT');
    expect(rankForXp(RANK_CAP_XP).name).toBe('COMMANDER');
    expect(rankForXp(999999).name).toBe('COMMANDER');
  });

  it('scores band ranks against sim bands', () => {
    expect(bandRank(0, [10, 20])).toBe(0);
    expect(bandRank(5, [10, 20])).toBe(1);
    expect(bandRank(10, [10, 20])).toBe(2);
    expect(bandRank(20, [10, 20])).toBe(3);
  });
});

describe('recordRound', () => {
  it('normalizes score into ~100 xp at the prestige band on any sim', () => {
    const a = recordRound('dust', 18, [9, 18], { artifacts: 6 }, {});
    expect(a.xpGained).toBeGreaterThanOrEqual(100);
    expect(a.rankAfter.level).toBeGreaterThanOrEqual(a.rankBefore.level);
  });

  it('awards signature medals and one-time challenges with xp bonuses', () => {
    const r = recordRound(
      'dossier',
      15,
      [14, 26],
      { redacted: 15, cleanPages: 2, leaks: 0, decoysHit: 0, pages: 4, bestStreak: 9 },
      { perfect: 2 },
    );
    const medalIds = r.newMedals.map((m) => m.id);
    expect(medalIds).toContain('zero-leaks');
    expect(medalIds).toContain('unbroken');
    expect(medalIds).toContain('flawless');
    const tiers = r.newChallenges.map((c) => c.tier);
    expect(tiers).toContain('bronze');
    expect(tiers).toContain('silver');
    const base = Math.round((15 / 26) * 100);
    expect(r.xpGained).toBe(
      base +
        r.newMedals.length * XP_PER_MEDAL +
        XP_PER_CHALLENGE.bronze +
        XP_PER_CHALLENGE.silver,
    );
    // second identical round: challenges are once-ever, medals repeat
    const again = recordRound(
      'dossier',
      15,
      [14, 26],
      { redacted: 15, cleanPages: 2, leaks: 0, decoysHit: 0, pages: 4, bestStreak: 9 },
      { perfect: 2 },
    );
    expect(again.newChallenges).toHaveLength(0);
    expect(again.newMedals.map((m) => m.id)).toContain('zero-leaks');
  });

  it('tracks bests, band ranks and the next unearned challenge', () => {
    const first = recordRound('peregrine', 12, [18, 34], { gates: 12 }, {});
    expect(first.isNewBest).toBe(true);
    expect(first.nextChallenge?.def.tier).toBe('silver');
    expect(first.nextChallenge?.progress).toBe(12);
    const worse = recordRound('peregrine', 4, [18, 34], { gates: 4 }, {});
    expect(worse.isNewBest).toBe(false);
    expect(worse.allTimeBest).toBe(12);
    const state = loadCareer();
    expect(state.bests.peregrine).toBe(12);
    expect(state.bestRanks.peregrine).toBe(1);
    expect(state.plays).toBeGreaterThanOrEqual(2);
  });

  it('summarizes totals for the record panel', () => {
    const totals = careerTotals(loadCareer());
    expect(totals.rank.level).toBeGreaterThanOrEqual(1);
    expect(totals.challengeTotal).toBe(42);
    expect(totals.medalCount).toBeGreaterThan(0);
  });
});
