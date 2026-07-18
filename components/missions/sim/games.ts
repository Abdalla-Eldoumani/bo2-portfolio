/*
  FIELD SIM game registry — one short score-attack game per op, each
  symbolizing what the project actually does. Pure canvas-2D, palette
  tokens only, one-hand controls, mouse/touch equivalents for every key.

  The contract lives in contract.ts, the game-feel toolkit in fx.ts and
  the games themselves in games/<slug>.ts. This module is the registry:
  createGame(slug, fx, veteran) → Game, plus SIM_META (title, brief,
  control legend, round length, rank bands and the veteran-mode line
  per sim).
*/

import { W, H, type Fx } from '@/components/missions/sim/fx';
import type { Game } from '@/components/missions/sim/contract';
import { falconDash } from '@/components/missions/sim/games/peregrine';
import { kernelBoot } from '@/components/missions/sim/games/aeos';
import { singleStep } from '@/components/missions/sim/games/aarch64-playground';
import { effectCheck } from '@/components/missions/sim/games/qala';
import { loadBalancer } from '@/components/missions/sim/games/rust-http-server';
import { redactionPass } from '@/components/missions/sim/games/dossier';
import { digSite } from '@/components/missions/sim/games/dust';
import { marketRun } from '@/components/missions/sim/games/budget-buddy';
import { domainCollapse } from '@/components/missions/sim/games/lattice';
import { pruningPass } from '@/components/missions/sim/games/whittle';
import { posteriorHunt } from '@/components/missions/sim/games/credence';
import { stateRunner } from '@/components/missions/sim/games/regex-fsm';
import { floodFill } from '@/components/missions/sim/games/qalam';
import { cloudTriage } from '@/components/missions/sim/games/cloud-practitioner-prep';
import { hordeProtocol } from '@/components/missions/sim/games/deadzone';
import { snapshot } from '@/components/missions/sim/games/qemu-mcp-server';
import { binDiff } from '@/components/missions/sim/games/bindiff-mcp';
import { wormProtocol } from '@/components/missions/sim/games/worm-protocol';
import { sortSprint } from '@/components/missions/sim/games/dsav';
import { waitFor } from '@/components/missions/sim/games/termpilot';
import { vectorPass } from '@/components/missions/sim/games/arm-string-ops';

export type {
  Game,
  RoundStats,
  SimEvent,
  SimEventKind,
  SimInput,
} from '@/components/missions/sim/contract';

export type SimMeta = {
  title: string;
  brief: string;
  controls: string;
  roundS: number; // round length in seconds
  bands: [number, number]; // [VETERAN, PRESTIGE] score thresholds
  /** What veteran mode changes, shown on the ready-screen toggle. */
  veteran: string;
};

export const SIM_META: Record<string, SimMeta> = {
  peregrine: {
    title: 'FALCON DASH',
    brief:
      'Hold to climb, release to dive. Thread the gates — the small center ring is FUSED and worth double. Thermals bend the line, and a chain of gates charges OVERSPEED.',
    controls: 'HOLD SPACE / HOLD POINTER — CLIMB',
    roundS: 25,
    bands: [18, 34],
    veteran: 'TIGHTER GATES, FASTER AIR',
  },
  aeos: {
    title: 'KERNEL BOOT',
    brief:
      'Commit each boot stage inside the window — dead center chains an OVERCLOCK multiplier. Service IRQs in the green. Past the eighth stage, userspace pays double.',
    controls: '↵ / TAP — COMMIT STAGE',
    roundS: 20,
    bands: [14, 28],
    veteran: 'NARROW WINDOWS, HOT IRQS',
  },
  'aarch64-playground': {
    title: 'SINGLE STEP',
    brief:
      'Retire each instruction in the execute slot. Branches reverse the fetch direction, and a load stalls its dependent use — wait one beat for the INTERLOCK. Long chains go dual-issue.',
    controls: '↵ / TAP — RETIRE',
    roundS: 22,
    bands: [15, 30],
    veteran: 'HOT PIPELINE, MORE HAZARDS',
  },
  qala: {
    title: 'EFFECT CHECK',
    brief:
      'The compiler asks: is this expression pure, or does it do io? Tiers climb to deceptive names where the body is the truth. Streaks run the optimizer — compressed travel, double points.',
    controls: '← PURE · → IO (TAP LEFT / RIGHT)',
    roundS: 20,
    bands: [16, 30],
    veteran: 'FAST CARDS, EARLY DECEPTION',
  },
  'rust-http-server': {
    title: 'LOAD BALANCER',
    brief:
      'Serve the queues and hold p99 under 10ms. Bursts are telegraphed, serving a lane twice in a beat is a cache hit, and 24 deep trips the circuit breaker. 40 served scales out a fourth node.',
    controls: '← ↓ → (↑ NODE 4) / TAP A LANE — SERVE',
    roundS: 25,
    bands: [60, 100],
    veteran: 'HEAVY TRAFFIC, TOUCHY BREAKERS',
  },
  dossier: {
    title: 'REDACTION PASS',
    brief:
      'Stamp every SECRET line the scanner touches. Ink is a budget, hollow markers are decoys that come back DECLASSIFIED, and page three splits the dossier into two columns.',
    controls: '↵ / TAP — STAMP · SPLIT: ← LEFT → RIGHT',
    roundS: 22,
    bands: [14, 26],
    veteran: 'FAST SCANNER, THIN INK',
  },
  dust: {
    title: 'DIG SITE',
    brief:
      'Artifacts are buried in the grid. Sonar pings expand fast when you are close, dug tiles silt back up, and signal jams mask the heat. Extract clean for the bonus.',
    controls: 'ARROWS + ↵ / TAP A TILE — DIG',
    roundS: 22,
    bands: [9, 18],
    veteran: 'FAST SILT, LONG JAMS',
  },
  'budget-buddy': {
    title: 'MARKET RUN',
    brief:
      'One ticker, one position. Headlines telegraph the next move, volatility regimes rotate, and every trade costs a fee. Hold SPACE for 2× leverage — it cuts both ways.',
    controls: '↵ / TAP — BUY / SELL · HOLD SPACE — LEV ×2',
    roundS: 25,
    bands: [15, 35],
    veteran: 'WILD TAPE, FAT FEES',
  },
  lattice: {
    title: 'DOMAIN COLLAPSE',
    brief:
      'Every variable holds a domain. Eliminate the values its constraint forbids — a domain of one locks, and ALL-DIFF marks that value teal in every other row. Reach fixpoint before the search clock backtracks.',
    controls: '← → ↑ ↓ MOVE · ↵ / TAP — ELIMINATE',
    roundS: 25,
    bands: [28, 50],
    veteran: 'SHORT SEARCH CLOCK',
  },
  whittle: {
    title: 'PRUNING PASS',
    brief:
      'The enumerator streams candidate programs against the spec. Kill anything that contradicts an example — and any duplicate of a kept program. Whatever crosses the keep line joins the set.',
    controls: '↵ / TAP — KILL · LET IT RISE — KEEP',
    roundS: 24,
    bands: [18, 36],
    veteran: 'HOT ENUMERATOR, BIG SURGES',
  },
  credence: {
    title: 'POSTERIOR HUNT',
    brief:
      'Noisy samples rain in around a hidden value. Keep your belief band on it: every inference tick pays for tight-and-right and nothing for tight-and-wrong. It drifts, then it jumps regimes.',
    controls: '← → / TAP — MOVE BAND · HOLD SPACE / POINTER — TIGHTEN',
    roundS: 25,
    bands: [16, 30],
    veteran: 'HEAVY TAILS, RESTLESS REGIMES',
  },
  'regex-fsm': {
    title: 'STATE RUNNER',
    brief:
      'You are the automaton. Pick the arc that consumes each tape symbol and keep the run alive — the accept state cashes the whole word. When no arc matches, λ is the move.',
    controls: '↑ → ↓ / TAP AN ARC — TRANSITION',
    roundS: 22,
    bands: [18, 34],
    veteran: 'THREE ARCS FROM THE START',
  },
  qalam: {
    title: 'FLOOD FILL',
    brief:
      'Seed a flood fill inside the target region and it spreads on its own. The scanline sweep repaints anything half-painted — finish before the beam lands or lose the frame.',
    controls: 'ARROWS + ↵ / TAP A CELL — SEED FILL',
    roundS: 24,
    bands: [16, 32],
    veteran: 'INTERLACED FROM FRAME ONE',
  },
  'cloud-practitioner-prep': {
    title: 'CLOUD TRIAGE',
    brief:
      'True or false, fast. Three right calls master a domain and retire its cards — one wrong call resets its meter. Master all four for the READY SIGNAL and the deck reshuffles at double points.',
    controls: '← FALSE · → TRUE (TAP LEFT / RIGHT)',
    roundS: 22,
    bands: [16, 32],
    veteran: 'EXAM TEMPO',
  },
  deadzone: {
    title: 'HORDE PROTOCOL',
    brief:
      'The weapon aims itself — the footwork is yours. Kills level the build (fire rate, twin shot, pierce), waves thicken the tide, brutes soak three rounds. SPACE spends the bomb, ↵ spends the freeze. Getting caught costs points and the chain.',
    controls: 'ARROWS / HOLD POINTER — MOVE · SPACE — BOMB · ↵ — FREEZE',
    roundS: 25,
    bands: [45, 90],
    veteran: 'THICK TIDE, EARLY BRUTES',
  },
  'qemu-mcp-server': {
    title: 'SNAPSHOT',
    brief:
      'Three guests grind tasks; all of them will glitch, crash and reboot from zero. Snapshot a clean state and a rollback saves the work — an image taken mid-glitch is corrupted and crashes the guest again. Watch the flicker.',
    controls: '← → SELECT · ↵ SNAPSHOT · ↓ ROLLBACK (TAP TOP / BOTTOM OF A GUEST)',
    roundS: 24,
    bands: [18, 34],
    veteran: 'FLAKY FLEET, SHORT TELEGRAPHS',
  },
  'bindiff-mcp': {
    title: 'BIN DIFF',
    brief:
      'Two builds, one symbol line. Call SAME or DRIFT before the window closes: sizes creep, addresses shift a nibble, symbols pick up lookalike glyphs — and the stripped wave takes the names away entirely. False positives cost.',
    controls: '← SAME · → DRIFT (TAP LEFT / RIGHT)',
    roundS: 22,
    bands: [16, 30],
    veteran: 'SURGICAL FROM LINE ONE',
  },
  'worm-protocol': {
    title: 'WORM PROTOCOL',
    brief:
      'Recovered from a classified archive: an ARM64 worm loose on a wrapped network. Eat the data packets, take the slow-mo and shrink pickups, and mind your own tail — the edges forgive, the tail never does. Three lives.',
    controls: 'ARROWS / TAP A DIRECTION — STEER',
    roundS: 25,
    bands: [12, 24],
    veteran: 'TWO LIVES, HOT WIRE',
  },
  dsav: {
    title: 'SORT SPRINT',
    brief:
      'You are the comparator. The scan lights each adjacent pair — call KEEP or SWAP before the window closes, and a clean array locks green. Two arrays in, the MERGE WAVE deals sorted halves and your buttons become "take a head". Comparing, swapping, sorted: the visualizer colors, played live.',
    controls: '← KEEP · → SWAP — MERGE: ← → TAKE A HEAD (TAP A SIDE)',
    roundS: 24,
    bands: [24, 45],
    veteran: 'SHORT WINDOWS, BIGGER ARRAYS',
  },
  termpilot: {
    title: 'WAIT FOR',
    brief:
      'A live terminal scrolls; the brief posts a wait_for pattern. Strike the instant a matching line appears — the lookalikes are bait and a false trigger costs. Six catches rotate the predicate; ten opens a second session, and now you are watching two screens.',
    controls: '↵ / TAP — STRIKE · TWO PANES: ← LEFT · → RIGHT (TAP A SIDE)',
    roundS: 22,
    bands: [16, 32],
    veteran: 'FAST SCROLL, HEAVY BAIT',
  },
  'arm-string-ops': {
    title: 'VECTOR PASS',
    brief:
      'A sixteen-lane NEON register fills with bytes. One press uppercases every lowercase lane at once — the wider the pass, the bigger the payoff. Malformed UTF-8 poisons a vector pass: give those the scalar fix, then go wide. Overflow stalls the pipeline.',
    controls: 'SPACE / TAP LOW — NEON PASS · ← → + ↓ / TAP A LANE — SCALAR FIX',
    roundS: 22,
    bands: [70, 130],
    veteran: 'FAST FEED, DIRTY INPUT',
  },
};

export function createGame(slug: string, fx: Fx, veteran = false): Game {
  switch (slug) {
    case 'peregrine': return falconDash(fx, veteran);
    case 'aeos': return kernelBoot(fx, veteran);
    case 'aarch64-playground': return singleStep(fx, veteran);
    case 'qala': return effectCheck(fx, veteran);
    case 'rust-http-server': return loadBalancer(fx, veteran);
    case 'dossier': return redactionPass(fx, veteran);
    case 'dust': return digSite(fx, veteran);
    case 'budget-buddy': return marketRun(fx, veteran);
    case 'lattice': return domainCollapse(fx, veteran);
    case 'whittle': return pruningPass(fx, veteran);
    case 'credence': return posteriorHunt(fx, veteran);
    case 'regex-fsm': return stateRunner(fx, veteran);
    case 'qalam': return floodFill(fx, veteran);
    case 'cloud-practitioner-prep': return cloudTriage(fx, veteran);
    case 'deadzone': return hordeProtocol(fx, veteran);
    case 'qemu-mcp-server': return snapshot(fx, veteran);
    case 'bindiff-mcp': return binDiff(fx, veteran);
    case 'worm-protocol': return wormProtocol(fx, veteran);
    case 'dsav': return sortSprint(fx, veteran);
    case 'termpilot': return waitFor(fx, veteran);
    case 'arm-string-ops': return vectorPass(fx, veteran);
    default: return falconDash(fx, veteran);
  }
}

export const SIM_W = W;
export const SIM_H = H;
