import { describe, expect, it } from 'vitest';
import {
  CONTRACT_BOUNTY,
  RANK_CAP_XP,
  bandRank,
  canVeteran,
  canWager,
  careerTotals,
  dailyContract,
  enterPrestige,
  loadCareer,
  rankForXp,
  recordRound,
  todayKey,
  unlockArcade,
  wagerStake,
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
    expect(totals.challengeTotal).toBe(60);
    expect(totals.medalCount).toBeGreaterThan(0);
  });
});

describe('wager match', () => {
  it('scales the stake with xp inside 15..60', () => {
    expect(wagerStake({ ...loadCareer(), xp: 0 })).toBe(15);
    expect(wagerStake({ ...loadCareer(), xp: 200 })).toBe(24);
    expect(wagerStake({ ...loadCareer(), xp: 5000 })).toBe(60);
  });

  it('refuses a stake the ladder cannot cover', () => {
    expect(canWager({ ...loadCareer(), xp: 0 })).toBe(false);
    expect(canWager({ ...loadCareer(), xp: 20 })).toBe(true);
  });

  it('pays a won wager and lets a lost one bust you down', () => {
    // grind to a coverable position (prestige past the cap if needed)
    for (let i = 0; i < 30 && !canWager(); i++) {
      if (loadCareer().xp >= RANK_CAP_XP) enterPrestige();
      recordRound('dust', 5, [9, 18], {}, {});
    }
    expect(canWager()).toBe(true);

    const before = loadCareer().xp;
    const stake = wagerStake(loadCareer());
    const win = recordRound('dust', 18, [9, 18], { artifacts: 6 }, {}, true);
    expect(win.wager).toEqual({ staked: stake, won: true });
    expect(win.xpAfter).toBe(Math.min(RANK_CAP_XP, before + win.xpGained + stake));

    if (loadCareer().xp >= RANK_CAP_XP) enterPrestige();
    // primitives only: in the memory fallback loadCareer() returns the
    // live object, which the next recordRound mutates in place
    const midXp = loadCareer().xp;
    const loss = recordRound('dust', 0, [9, 18], {}, {}, true);
    expect(loss.wager?.won).toBe(false);
    expect(loss.xpBefore).toBe(midXp);
    // an idle round earns nothing, so the house takes the whole stake —
    // straight through a rank floor if that is where the xp sits
    expect(loss.xpAfter).toBe(
      Math.max(
        0,
        loss.xpBefore +
          loss.xpGained +
          (loss.contract?.bounty ?? 0) -
          (loss.wager?.staked ?? 0),
      ),
    );
    expect(loss.rankAfter.level).toBeLessThanOrEqual(loss.rankBefore.level);
  });

  it('ignores the flag when the wager is not coverable', () => {
    const broke = recordRound('qala', 0, [10, 20], {}, {}, true);
    // either coverable (wager recorded) or silently no wager — never a crash
    expect(broke.wager === null || typeof broke.wager.staked === 'number').toBe(true);
  });
});

describe('daily contract', () => {
  it('derives one deterministic contract per local day', () => {
    const a = dailyContract();
    const b = dailyContract();
    expect(a).not.toBeNull();
    expect(a).toEqual(b);
    expect(a?.date).toBe(todayKey());
    expect(a?.challenge.tier).toBe('silver');
    expect(a?.bounty).toBe(CONTRACT_BOUNTY);
  });

  it('pays the bounty once per day on the contract sim', () => {
    const c = dailyContract();
    if (!c) return;
    const stats = { [c.challenge.metric]: c.challenge.target };
    const first = recordRound(c.sim, 1, [10, 20], stats, {});
    expect(first.contract).toEqual({ name: c.challenge.name, bounty: c.bounty });
    const second = recordRound(c.sim, 1, [10, 20], stats, {});
    expect(second.contract).toBeNull();
    expect(loadCareer().contract).toEqual({ date: todayKey(), done: true });
  });
});

describe('veteran mode', () => {
  it('unlocks at the veteran band and pays xp at 1.5x', () => {
    expect(canVeteran('qala', { ...loadCareer(), bestRanks: { qala: 2 } })).toBe(true);
    expect(canVeteran('qala', { ...loadCareer(), bestRanks: { qala: 1 } })).toBe(false);
    const plain = recordRound('qala', 10, [16, 30], {}, {});
    const vet = recordRound('qala', 10, [16, 30], {}, {}, false, true);
    expect(vet.veteran).toBe(true);
    expect(plain.veteran).toBe(false);
    expect(vet.xpGained).toBe(Math.round(plain.xpGained * 1.5));
  });
});

describe('classified arcade', () => {
  it('unlocks once and stays unlocked', () => {
    expect(loadCareer().arcade).toBe(false);
    expect(unlockArcade().arcade).toBe(true);
    expect(loadCareer().arcade).toBe(true);
  });
});
