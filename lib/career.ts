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
  ContractDef,
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
  contract: null,
  arcade: false,
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
      contract:
        typeof p.contract === 'object' &&
        p.contract !== null &&
        typeof p.contract.date === 'string' &&
        typeof p.contract.done === 'boolean'
          ? p.contract
          : null,
      arcade: p.arcade === true,
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

/*
  Wager match — double or nothing. Stake scales with the ladder so it
  always matters; hitting the sim's VETERAN band pays the stake back
  doubled, missing hands it to the house — and yes, a bad enough loss
  busts you down a rank. The prestige glyph is the only thing the house
  can never touch.
*/
export function wagerStake(state: CareerState = loadCareer()): number {
  return Math.max(15, Math.min(60, Math.round(state.xp * 0.12)));
}

export function canWager(state: CareerState = loadCareer()): boolean {
  return state.xp >= wagerStake(state);
}

/** Local calendar day, YYYY-MM-DD. */
export function todayKey(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/*
  Daily contract — one sim, one target, one bounty, rotating with the
  local calendar day. The target reuses the sim's silver challenge so
  the ask is always tested data, and completing it pays whether or not
  the challenge itself was already earned.
*/
export const CONTRACT_BOUNTY = 40;

export function dailyContract(): ContractDef | null {
  const sims = [...new Set(CHALLENGES.map((c) => c.sim))];
  if (sims.length === 0) return null;
  const d = new Date();
  const dayIndex = Math.floor(
    Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000,
  );
  const sim = sims[dayIndex % sims.length];
  const silver = challengesForSim(sim)[1];
  if (!silver) return null;
  return { date: todayKey(), sim, challenge: silver, bounty: CONTRACT_BOUNTY };
}

export function contractDoneToday(state: CareerState = loadCareer()): boolean {
  return state.contract?.date === todayKey() && state.contract.done;
}

/** The classified arcade: once found, it stays on the board. */
export function unlockArcade(): CareerState {
  const state = loadCareer();
  if (!state.arcade) {
    state.arcade = true;
    save(state);
  }
  return state;
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
  wagered = false,
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

  // daily contract: pays its bounty once per calendar day, on its sim
  const today = todayKey();
  const contract = dailyContract();
  let contractResult: { name: string; bounty: number } | null = null;
  if (
    contract &&
    contract.sim === slug &&
    !(state.contract?.date === today && state.contract.done) &&
    (stats[contract.challenge.metric] ?? 0) >= contract.challenge.target
  ) {
    contractResult = { name: contract.challenge.name, bounty: contract.bounty };
    state.contract = { date: today, done: true };
  }

  const xpBefore = state.xp;
  let xpAfter = Math.min(
    RANK_CAP_XP,
    xpBefore + xpGained + (contractResult?.bounty ?? 0),
  );

  // wager resolution: staked before the round, settled on the band
  let wagerResult: { staked: number; won: boolean } | null = null;
  if (wagered && canWager(state)) {
    const staked = wagerStake(state);
    const won = bandRank(score, bands) >= 2;
    wagerResult = { staked, won };
    xpAfter = won
      ? Math.min(RANK_CAP_XP, xpAfter + staked)
      : Math.max(0, xpAfter - staked);
  }

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
    wager: wagerResult,
    contract: contractResult,
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
