// Field-sim career shapes: the rank ladder, medals, per-round challenges
// and the persisted profile. Data in lib/data/career.ts conforms via
// `satisfies`; the store in lib/career.ts owns persistence.

/** Numeric tallies a round reports: game stats + harness event counts. */
export type RoundTallies = Record<string, number>;

export interface RankDef {
  /** 1-based ladder position. */
  level: number;
  name: string;
  /** Cumulative XP required to hold this rank. */
  xp: number;
  /** Enamel emblem art, reused from the Combat Record ladder. */
  emblem: string;
}

export interface MedalDef {
  id: string;
  name: string;
  /** Sim slug for signature medals; undefined = shared set. */
  sim?: string;
  description: string;
  check(ctx: {
    score: number;
    bands: [number, number];
    stats: RoundTallies;
    events: RoundTallies;
    mistakes: number;
  }): boolean;
}

export type ChallengeTier = 'bronze' | 'silver' | 'gold';

export interface ChallengeDef {
  id: string;
  sim: string;
  tier: ChallengeTier;
  name: string;
  detail: string;
  /** Key into the round's stats tallies measured against target. */
  metric: string;
  target: number;
}

/** The persisted profile under the versioned localStorage key. */
export interface CareerState {
  v: 1;
  xp: number;
  prestige: number;
  plays: number;
  /** All-time best score per sim slug. */
  bests: Record<string, number>;
  /** Best per-sim rank band reached: 0 FNG · 1 RECRUIT · 2 VETERAN · 3 PRESTIGE. */
  bestRanks: Record<string, number>;
  /** Times each medal has been earned. */
  medals: Record<string, number>;
  /** Challenge ids completed (once ever). */
  challenges: Record<string, true>;
  /** Latest daily-contract resolution; only the current day matters. */
  contract: { date: string; done: boolean } | null;
  /** The classified arcade stays unlocked once found. */
  arcade: boolean;
}

/** The day's rotating contract: one sim, one target, one bounty. */
export interface ContractDef {
  date: string;
  sim: string;
  challenge: ChallengeDef;
  bounty: number;
}

/** What one round did to the career; drives the debrief. */
export interface RoundReport {
  /** Whether the round ran in veteran mode (xp paid at 1.5x). */
  veteran: boolean;
  /** Wager resolution when one was staked this round. */
  wager: { staked: number; won: boolean } | null;
  /** Set when this round completed the daily contract. */
  contract: { name: string; bounty: number } | null;
  score: number;
  xpGained: number;
  xpBefore: number;
  xpAfter: number;
  rankBefore: RankDef;
  rankAfter: RankDef;
  rankedUp: boolean;
  atCap: boolean;
  prestige: number;
  newMedals: MedalDef[];
  newChallenges: ChallengeDef[];
  allTimeBest: number;
  isNewBest: boolean;
  nextChallenge: { def: ChallengeDef; progress: number } | null;
}
