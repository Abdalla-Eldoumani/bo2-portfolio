import {
  CHALLENGES,
  MEDALS,
  MISTAKES,
  RANKS,
  XP_PER_CHALLENGE,
  XP_PER_MEDAL,
  challengesForSim,
  medalsForSim,
} from '@/lib/data/career';
import type {
  CareerState,
  RankDef,
  RoundReport,
  RoundTallies,
} from '@/lib/types/career';

/*
  Field-sim career store — one versioned localStorage key, written only
  at round end and read defensively (corrupt or foreign data resets
  cleanly, storage failures degrade to an in-memory profile for the page
  life). Zero backend, zero accounts: the career belongs to this browser.
*/

const KEY = 'bo2-career-v1';

/** Fired on window whenever the profile changes (detail: CareerState). */
export const CAREER_CHANGE_EVENT = 'bo2-career-change';

const fresh = (): CareerState => ({
  v: 1,
  xp: 0,
  prestige: 0,
  plays: 0,
  bests: {},
  bestRanks: {},
  medals: {},
  challenges: {},
});

// In-memory fallback so a blocked localStorage still gives a session career.
let memory: CareerState | null = null;

export function loadCareer(): CareerState {
  if (memory) return memory;
  if (typeof window === 'undefined') return fresh();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return fresh();
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== 'object' || parsed === null ||
      (parsed as { v?: unknown }).v !== 1 ||
      typeof (parsed as { xp?: unknown }).xp !== 'number'
    ) {
      return fresh();
    }
    const p = parsed as CareerState;
    return {
      v: 1,
      xp: Math.max(0, p.xp),
      prestige: typeof p.prestige === 'number' ? Math.max(0, p.prestige) : 0,
      plays: typeof p.plays === 'number' ? Math.max(0, p.plays) : 0,
      bests: typeof p.bests === 'object' && p.bests !== null ? p.bests : {},
      bestRanks: typeof p.bestRanks === 'object' && p.bestRanks !== null ? p.bestRanks : {},
      medals: typeof p.medals === 'object' && p.medals !== null ? p.medals : {},
      challenges: typeof p.challenges === 'object' && p.challenges !== null ? p.challenges : {},
    };
  } catch {
    return memory ?? fresh();
  }
}

function save(state: CareerState) {
  if (typeof window === 'undefined') {
    memory = state;
    return;
  }
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
    memory = null;
  } catch {
    memory = state;
  }
  window.dispatchEvent(new CustomEvent(CAREER_CHANGE_EVENT, { detail: state }));
}

export function rankForXp(xp: number): RankDef {
  let rank = RANKS[0];
  for (const r of RANKS) if (xp >= r.xp) rank = r;
  return rank;
}

export const RANK_CAP_XP = RANKS[RANKS.length - 1].xp;

/** 0 FNG · 1 RECRUIT · 2 VETERAN · 3 PRESTIGE against the sim's bands. */
export function bandRank(score: number, bands: [number, number]): number {
  if (score >= bands[1]) return 3;
  if (score >= bands[0]) return 2;
  if (score > 0) return 1;
  return 0;
}

/**
 * Fold one finished round into the career. The single storage write of
 * the whole system happens here, at round end.
 */
export function recordRound(
  slug: string,
  score: number,
  bands: [number, number],
  stats: RoundTallies,
  events: RoundTallies,
): RoundReport {
  const state = loadCareer();
  const mistakes = MISTAKES[slug]?.(stats) ?? 0;
  const ctx = { score, bands, stats, events, mistakes };

  const newMedals = medalsForSim(slug).filter((m) => {
    try {
      return m.check(ctx);
    } catch {
      return false;
    }
  });
  const newChallenges = challengesForSim(slug).filter(
    (c) => !state.challenges[c.id] && (stats[c.metric] ?? 0) >= c.target,
  );

  // score → XP normalized against the sim's PRESTIGE band, so a great
  // round is worth ~100 XP on any sim regardless of its score scale
  const base = Math.round(Math.min(1.5, Math.max(0, score / bands[1])) * 100);
  const xpGained =
    base +
    newMedals.length * XP_PER_MEDAL +
    newChallenges.reduce((sum, c) => sum + XP_PER_CHALLENGE[c.tier], 0);

  const xpBefore = state.xp;
  const xpAfter = Math.min(RANK_CAP_XP, xpBefore + xpGained);
  const rankBefore = rankForXp(xpBefore);
  const rankAfter = rankForXp(xpAfter);

  const prevBest = state.bests[slug] ?? 0;
  const isNewBest = score > prevBest;

  state.xp = xpAfter;
  state.plays += 1;
  if (isNewBest) state.bests[slug] = score;
  state.bestRanks[slug] = Math.max(state.bestRanks[slug] ?? 0, bandRank(score, bands));
  for (const m of newMedals) state.medals[m.id] = (state.medals[m.id] ?? 0) + 1;
  for (const c of newChallenges) state.challenges[c.id] = true;
  save(state);

  const nextDef = challengesForSim(slug).find((c) => !state.challenges[c.id]);
  return {
    score,
    xpGained,
    xpBefore,
    xpAfter,
    rankBefore,
    rankAfter,
    rankedUp: rankAfter.level > rankBefore.level,
    atCap: xpAfter >= RANK_CAP_XP,
    prestige: state.prestige,
    newMedals,
    newChallenges,
    allTimeBest: Math.max(prevBest, score),
    isNewBest,
    nextChallenge: nextDef
      ? { def: nextDef, progress: Math.min(stats[nextDef.metric] ?? 0, nextDef.target) }
      : null,
  };
}

/** At the rank cap: reset XP, keep the glyph forever. */
export function enterPrestige(): CareerState {
  const state = loadCareer();
  if (state.xp >= RANK_CAP_XP) {
    state.prestige += 1;
    state.xp = 0;
    save(state);
  }
  return state;
}

/** Career totals for the Combat Record panel. */
export function careerTotals(state: CareerState) {
  return {
    rank: rankForXp(state.xp),
    medalCount: Object.values(state.medals).reduce((a, b) => a + b, 0),
    challengeCount: Object.keys(state.challenges).length,
    challengeTotal: CHALLENGES.length,
    medalKinds: Object.keys(state.medals).length,
    medalTotal: MEDALS.length,
  };
}
