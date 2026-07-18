import type {
  ChallengeDef,
  MedalDef,
  RankDef,
  RoundTallies,
} from '@/lib/types/career';

/*
  Field-sim career content: the rank ladder, the medal set and the
  per-sim challenges. The ladder reuses the Combat Record enamel emblems
  (two ranks per emblem, climbing the same gold road). Every threshold
  here is a tuning decision the tests pin down; the store in
  lib/career.ts owns evaluation and persistence.
*/

export const RANKS: readonly RankDef[] = [
  { level: 1, name: 'FNG', xp: 0, emblem: '/art/emblems/rank-1-mentor.svg' },
  { level: 2, name: 'RECRUIT', xp: 100, emblem: '/art/emblems/rank-1-mentor.svg' },
  { level: 3, name: 'REGULAR', xp: 220, emblem: '/art/emblems/rank-2-fellow.svg' },
  { level: 4, name: 'HARDENED', xp: 360, emblem: '/art/emblems/rank-2-fellow.svg' },
  { level: 5, name: 'SPECIALIST', xp: 520, emblem: '/art/emblems/rank-3-specialist.svg' },
  { level: 6, name: 'OPERATOR', xp: 700, emblem: '/art/emblems/rank-3-specialist.svg' },
  { level: 7, name: 'VETERAN', xp: 900, emblem: '/art/emblems/rank-4-instructor.svg' },
  { level: 8, name: 'ELITE', xp: 1120, emblem: '/art/emblems/rank-4-instructor.svg' },
  { level: 9, name: 'WARRANT', xp: 1360, emblem: '/art/emblems/rank-5-researcher.svg' },
  { level: 10, name: 'COMMANDER', xp: 1620, emblem: '/art/emblems/rank-5-researcher.svg' },
] satisfies readonly RankDef[];

/** XP awarded per medal and per challenge tier (one-time). */
export const XP_PER_MEDAL = 15;
export const XP_PER_CHALLENGE = { bronze: 25, silver: 50, gold: 100 } as const;

/**
 * What counts as a mistake per sim, derived from that game's round
 * tallies — feeds the shared FLAWLESS medal without games knowing about
 * medals.
 */
export const MISTAKES: Record<string, (t: RoundTallies) => number> = {
  peregrine: (t) => t.groundHits ?? 0,
  aeos: (t) => (t.panics ?? 0) + (t.irqDropped ?? 0),
  'aarch64-playground': (t) => t.flushes ?? 0,
  qala: (t) => (t.judged ?? 0) - (t.correct ?? 0),
  'rust-http-server': (t) => t.breakers ?? 0,
  dossier: (t) => (t.leaks ?? 0) + (t.decoysHit ?? 0),
  dust: (t) => ((t.artifacts ?? 0) > 0 ? 0 : 1),
  'budget-buddy': (t) => ((t.pl ?? 0) > 0 ? 0 : 1),
  lattice: (t) => t.conflicts ?? 0,
  whittle: (t) => (t.wrongKills ?? 0) + (t.bloat ?? 0),
  credence: (t) => (t.ticks ?? 0) - (t.hits ?? 0),
  'regex-fsm': (t) => t.rejects ?? 0,
  qalam: (t) => t.wipes ?? 0,
  'cloud-practitioner-prep': (t) => (t.judged ?? 0) - (t.correct ?? 0),
  deadzone: (t) => t.hitsTaken ?? 0,
  'qemu-mcp-server': (t) => (t.corrupted ?? 0) + (t.crashesLost ?? 0),
  'bindiff-mcp': (t) => (t.falsePositives ?? 0) + (t.missed ?? 0),
  'worm-protocol': (t) => t.segfaults ?? 0,
};

const streak = (t: RoundTallies) => t.bestStreak ?? t.bestChain ?? 0;

export const MEDALS: readonly MedalDef[] = [
  // shared set — one grammar across every sim
  {
    id: 'unbroken',
    name: 'UNBROKEN',
    description: 'Run a streak of 8 without dropping the chain.',
    check: ({ stats }) => streak(stats) >= 8,
  },
  {
    id: 'surgical',
    name: 'SURGICAL',
    description: 'Land 5 perfect actions in one round.',
    check: ({ events }) => (events.perfect ?? 0) >= 5,
  },
  {
    id: 'flawless',
    name: 'FLAWLESS',
    description: 'Finish at VETERAN pace or better without a single mistake.',
    check: ({ score, bands, mistakes }) => mistakes === 0 && score >= bands[0],
  },
  {
    id: 'prestige-op',
    name: 'PRESTIGE OP',
    description: 'Clear the PRESTIGE score band.',
    check: ({ score, bands }) => score >= bands[1],
  },
  // signature medals — one per sim, in its project language
  {
    id: 'fused-chain',
    name: 'FUSED CHAIN',
    sim: 'peregrine',
    description: 'Fly 4 fused centers in one sortie.',
    check: ({ stats }) => (stats.fused ?? 0) >= 4,
  },
  {
    id: 'clean-boot',
    name: 'CLEAN BOOT',
    sim: 'aeos',
    description: 'Commit 10 stages with zero kernel panics.',
    check: ({ stats }) => (stats.commits ?? 0) >= 10 && (stats.panics ?? 0) === 0,
  },
  {
    id: 'interlocked',
    name: 'INTERLOCKED',
    sim: 'aarch64-playground',
    description: 'Score 3 interlocks in one round.',
    check: ({ stats }) => (stats.interlocks ?? 0) >= 3,
  },
  {
    id: 'truthful-declaration',
    name: 'TRUTHFUL DECLARATION',
    sim: 'qala',
    description: 'Judge 10 or more expressions without one wrong verdict.',
    check: ({ stats }) =>
      (stats.judged ?? 0) >= 10 && (stats.correct ?? 0) === (stats.judged ?? 0),
  },
  {
    id: 'cache-storm',
    name: 'CACHE STORM',
    sim: 'rust-http-server',
    description: 'Chain 6 cache hits in one round.',
    check: ({ stats }) => (stats.cacheHits ?? 0) >= 6,
  },
  {
    id: 'zero-leaks',
    name: 'ZERO LEAKS',
    sim: 'dossier',
    description: 'Close out two clean pages in one pass.',
    check: ({ stats }) => (stats.cleanPages ?? 0) >= 2,
  },
  {
    id: 'blackout-dig',
    name: 'BLACKOUT DIG',
    sim: 'dust',
    description: 'Extract an artifact while the signal is jammed.',
    check: ({ stats }) => (stats.blindExtracts ?? 0) >= 1,
  },
  {
    id: 'market-maker',
    name: 'MARKET MAKER',
    sim: 'budget-buddy',
    description: 'Book two clean exits and finish green.',
    check: ({ stats }) => (stats.cleanExits ?? 0) >= 2 && (stats.pl ?? 0) > 0,
  },
  {
    id: 'fixpoint',
    name: 'FIXPOINT',
    sim: 'lattice',
    description: 'Solve two grids without a single conflict.',
    check: ({ stats }) => (stats.cleanGrids ?? 0) >= 2,
  },
  {
    id: 'obs-eq',
    name: 'OBSERVATIONAL EQUIVALENCE',
    sim: 'whittle',
    description: 'Merge 3 duplicate candidates in one round.',
    check: ({ stats }) => (stats.merges ?? 0) >= 3,
  },
  {
    id: 'tight-posterior',
    name: 'TIGHT POSTERIOR',
    sim: 'credence',
    description: 'Land 4 sharp-band hits in one round.',
    check: ({ stats }) => (stats.sharpHits ?? 0) >= 4,
  },
  {
    id: 'lambda-closure',
    name: 'λ-CLOSURE',
    sim: 'regex-fsm',
    description: 'Thread 4 λ-moves in one round.',
    check: ({ stats }) => (stats.lambdaMoves ?? 0) >= 4,
  },
  {
    id: 'golden-frame',
    name: 'GOLDEN FRAME',
    sim: 'qalam',
    description: 'Lock 4 regions with zero repaints.',
    check: ({ stats }) => (stats.regions ?? 0) >= 4 && (stats.wipes ?? 0) === 0,
  },
  {
    id: 'ready-signal',
    name: 'READY SIGNAL',
    sim: 'cloud-practitioner-prep',
    description: 'Master all four exam domains in one round.',
    check: ({ stats }) => (stats.readySignal ?? 0) >= 1,
  },
  {
    id: 'untouchable',
    name: 'UNTOUCHABLE',
    sim: 'deadzone',
    description: 'Survive three waves without getting caught once.',
    check: ({ stats }) => (stats.waves ?? 0) >= 3 && (stats.hitsTaken ?? 0) === 0,
  },
  {
    id: 'clean-image',
    name: 'CLEAN IMAGE',
    sim: 'qemu-mcp-server',
    description: 'Restore three snapshots without a single corrupted image.',
    check: ({ stats }) => (stats.restores ?? 0) >= 3 && (stats.corrupted ?? 0) === 0,
  },
  {
    id: 'clean-diff',
    name: 'CLEAN DIFF',
    sim: 'bindiff-mcp',
    description: 'Catch 8 drifts with zero false positives.',
    check: ({ stats }) => (stats.caught ?? 0) >= 8 && (stats.falsePositives ?? 0) === 0,
  },
  {
    id: 'worm-protocol',
    name: 'WORM PROTOCOL',
    sim: 'worm-protocol',
    description: 'Eat 20 packets without a single segfault.',
    check: ({ stats }) => (stats.packets ?? 0) >= 20 && (stats.segfaults ?? 0) === 0,
  },
] satisfies readonly MedalDef[];

const tiers = (
  sim: string,
  name: string,
  metric: string,
  detail: (n: number) => string,
  targets: [number, number, number],
): ChallengeDef[] =>
  (['bronze', 'silver', 'gold'] as const).map((tier, i) => ({
    id: `${sim}-${tier}`,
    sim,
    tier,
    name,
    detail: detail(targets[i]),
    metric,
    target: targets[i],
  }));

export const CHALLENGES: readonly ChallengeDef[] = [
  ...tiers('peregrine', 'FLIGHT HOURS', 'gates', (n) => `Clear ${n} gates in one sortie.`, [10, 18, 26]),
  ...tiers('aeos', 'BOOT DISCIPLINE', 'commits', (n) => `Commit ${n} stages in one boot.`, [8, 14, 20]),
  ...tiers('aarch64-playground', 'ISSUE WIDTH', 'retired', (n) => `Retire ${n} instructions in one round.`, [12, 20, 30]),
  ...tiers('qala', 'PROOF LOAD', 'correct', (n) => `Judge ${n} expressions correctly in one round.`, [8, 14, 20]),
  ...tiers('rust-http-server', 'SLO', 'under10Pct', (n) => `Hold p99 under 10ms for ${n}% of the round.`, [60, 80, 95]),
  ...tiers('dossier', 'CHAIN OF CUSTODY', 'cleanPages', (n) => `Finish ${n} ${n === 1 ? 'page' : 'pages'} with zero leaks in one run.`, [1, 2, 3]),
  ...tiers('dust', 'EXCAVATION', 'artifacts', (n) => `Recover ${n} artifacts in one dig.`, [3, 5, 7]),
  ...tiers('budget-buddy', 'THE BOOK', 'pl', (n) => `Close the round $${n} or better in profit.`, [10, 25, 40]),
  ...tiers('lattice', 'PROPAGATION', 'eliminations', (n) => `Eliminate ${n} candidate values in one round.`, [16, 24, 34]),
  ...tiers('whittle', 'SEARCH PRESSURE', 'pruned', (n) => `Prune ${n} contradicting candidates in one round.`, [8, 11, 13]),
  ...tiers('credence', 'CALIBRATION', 'hits', (n) => `Land ${n} calibrated ticks in one round.`, [6, 9, 12]),
  ...tiers('regex-fsm', 'RUN LENGTH', 'transitions', (n) => `Take ${n} transitions in one round.`, [14, 24, 34]),
  ...tiers('qalam', 'FRAME BUDGET', 'regions', (n) => `Lock ${n} regions in one round.`, [3, 5, 7]),
  ...tiers('cloud-practitioner-prep', 'MOCK EXAM', 'correct', (n) => `Judge ${n} statements correctly in one round.`, [10, 16, 22]),
  ...tiers('deadzone', 'BODY COUNT', 'kills', (n) => `Drop ${n} walkers in one round.`, [18, 30, 45]),
  ...tiers('qemu-mcp-server', 'UPTIME', 'tasks', (n) => `Ship ${n} guest tasks in one round.`, [6, 10, 14]),
  ...tiers('bindiff-mcp', 'DRIFT HUNTER', 'caught', (n) => `Catch ${n} drifted lines in one round.`, [7, 11, 15]),
] satisfies readonly ChallengeDef[];

/** Per-sim band-rank labels, indexed by bandRank() in lib/career.ts. */
export const BAND_RANKS = ['FNG', 'RECRUIT', 'VETERAN', 'PRESTIGE'] as const;

export const medalsForSim = (slug: string) =>
  MEDALS.filter((m) => m.sim === undefined || m.sim === slug);

export const challengesForSim = (slug: string) =>
  CHALLENGES.filter((c) => c.sim === slug);
