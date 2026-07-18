/*
  FIELD SIM game registry — one short score-attack game per op, each
  symbolizing what the project actually does. Pure canvas-2D, palette
  tokens only, one-hand controls, mouse/touch equivalents for every key.

  The contract lives in contract.ts, the game-feel toolkit in fx.ts and
  the games themselves in games/<slug>.ts. This module is the registry:
  createGame(slug, fx) → Game, plus SIM_META (title, brief, control
  legend, round length and rank bands per sim).
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
};

export const SIM_META: Record<string, SimMeta> = {
  peregrine: {
    title: 'FALCON DASH',
    brief:
      'Hold to climb, release to dive. Thread the gates — the small center ring is FUSED and worth double. Thermals bend the line, and a chain of gates charges OVERSPEED.',
    controls: 'HOLD SPACE / HOLD POINTER — CLIMB',
    roundS: 25,
    bands: [18, 34],
  },
  aeos: {
    title: 'KERNEL BOOT',
    brief:
      'Commit each boot stage inside the window — dead center chains an OVERCLOCK multiplier. Service IRQs in the green. Past the eighth stage, userspace pays double.',
    controls: '↵ / TAP — COMMIT STAGE',
    roundS: 20,
    bands: [14, 28],
  },
  'aarch64-playground': {
    title: 'SINGLE STEP',
    brief:
      'Retire each instruction in the execute slot. Branches reverse the fetch direction, and a load stalls its dependent use — wait one beat for the INTERLOCK. Long chains go dual-issue.',
    controls: '↵ / TAP — RETIRE',
    roundS: 22,
    bands: [15, 30],
  },
  qala: {
    title: 'EFFECT CHECK',
    brief:
      'The compiler asks: is this expression pure, or does it do io? Tiers climb to deceptive names where the body is the truth. Streaks run the optimizer — compressed travel, double points.',
    controls: '← PURE · → IO (TAP LEFT / RIGHT)',
    roundS: 20,
    bands: [16, 30],
  },
  'rust-http-server': {
    title: 'LOAD BALANCER',
    brief:
      'Serve the queues and hold p99 under 10ms. Bursts are telegraphed, serving a lane twice in a beat is a cache hit, and 24 deep trips the circuit breaker. 40 served scales out a fourth node.',
    controls: '← ↓ → (↑ NODE 4) / TAP A LANE — SERVE',
    roundS: 25,
    bands: [60, 100],
  },
  dossier: {
    title: 'REDACTION PASS',
    brief:
      'Stamp every SECRET line the scanner touches. Ink is a budget, hollow markers are decoys that come back DECLASSIFIED, and page three splits the dossier into two columns.',
    controls: '↵ / TAP — STAMP · SPLIT: ← LEFT → RIGHT',
    roundS: 22,
    bands: [14, 26],
  },
  dust: {
    title: 'DIG SITE',
    brief:
      'Artifacts are buried in the grid. Sonar pings expand fast when you are close, dug tiles silt back up, and signal jams mask the heat. Extract clean for the bonus.',
    controls: 'ARROWS + ↵ / TAP A TILE — DIG',
    roundS: 22,
    bands: [9, 18],
  },
  'budget-buddy': {
    title: 'MARKET RUN',
    brief:
      'One ticker, one position. Headlines telegraph the next move, volatility regimes rotate, and every trade costs a fee. Hold SPACE for 2× leverage — it cuts both ways.',
    controls: '↵ / TAP — BUY / SELL · HOLD SPACE — LEV ×2',
    roundS: 25,
    bands: [15, 35],
  },
  lattice: {
    title: 'DOMAIN COLLAPSE',
    brief:
      'Every variable holds a domain. Eliminate the values its constraint forbids — a domain of one locks, and ALL-DIFF marks that value teal in every other row. Reach fixpoint before the search clock backtracks.',
    controls: '← → ↑ ↓ MOVE · ↵ / TAP — ELIMINATE',
    roundS: 25,
    bands: [28, 50],
  },
  whittle: {
    title: 'PRUNING PASS',
    brief:
      'The enumerator streams candidate programs against the spec. Kill anything that contradicts an example — and any duplicate of a kept program. Whatever crosses the keep line joins the set.',
    controls: '↵ / TAP — KILL · LET IT RISE — KEEP',
    roundS: 24,
    bands: [18, 36],
  },
  credence: {
    title: 'POSTERIOR HUNT',
    brief:
      'Noisy samples rain in around a hidden value. Keep your belief band on it: every inference tick pays for tight-and-right and nothing for tight-and-wrong. It drifts, then it jumps regimes.',
    controls: '← → / TAP — MOVE BAND · HOLD SPACE / POINTER — TIGHTEN',
    roundS: 25,
    bands: [16, 30],
  },
  'regex-fsm': {
    title: 'STATE RUNNER',
    brief:
      'You are the automaton. Pick the arc that consumes each tape symbol and keep the run alive — the accept state cashes the whole word. When no arc matches, λ is the move.',
    controls: '↑ → ↓ / TAP AN ARC — TRANSITION',
    roundS: 22,
    bands: [18, 34],
  },
  qalam: {
    title: 'FLOOD FILL',
    brief:
      'Seed a flood fill inside the target region and it spreads on its own. The scanline sweep repaints anything half-painted — finish before the beam lands or lose the frame.',
    controls: 'ARROWS + ↵ / TAP A CELL — SEED FILL',
    roundS: 24,
    bands: [16, 32],
  },
  'cloud-practitioner-prep': {
    title: 'CLOUD TRIAGE',
    brief:
      'True or false, fast. Three right calls master a domain and retire its cards — one wrong call resets its meter. Master all four for the READY SIGNAL and the deck reshuffles at double points.',
    controls: '← FALSE · → TRUE (TAP LEFT / RIGHT)',
    roundS: 22,
    bands: [16, 32],
  },
  deadzone: {
    title: 'HORDE PROTOCOL',
    brief:
      'The weapon aims itself — the footwork is yours. Kills level the build (fire rate, twin shot, pierce), waves thicken the tide, brutes soak three rounds. SPACE spends the bomb, ↵ spends the freeze. Getting caught costs points and the chain.',
    controls: 'ARROWS / HOLD POINTER — MOVE · SPACE — BOMB · ↵ — FREEZE',
    roundS: 25,
    bands: [45, 90],
  },
  'qemu-mcp-server': {
    title: 'SNAPSHOT',
    brief:
      'Three guests grind tasks; all of them will glitch, crash and reboot from zero. Snapshot a clean state and a rollback saves the work — an image taken mid-glitch is corrupted and crashes the guest again. Watch the flicker.',
    controls: '← → SELECT · ↵ SNAPSHOT · ↓ ROLLBACK (TAP TOP / BOTTOM OF A GUEST)',
    roundS: 24,
    bands: [18, 34],
  },
  'bindiff-mcp': {
    title: 'BIN DIFF',
    brief:
      'Two builds, one symbol line. Call SAME or DRIFT before the window closes: sizes creep, addresses shift a nibble, symbols pick up lookalike glyphs — and the stripped wave takes the names away entirely. False positives cost.',
    controls: '← SAME · → DRIFT (TAP LEFT / RIGHT)',
    roundS: 22,
    bands: [16, 30],
  },
  'worm-protocol': {
    title: 'WORM PROTOCOL',
    brief:
      'Recovered from a classified archive: an ARM64 worm loose on a wrapped network. Eat the data packets, take the slow-mo and shrink pickups, and mind your own tail — the edges forgive, the tail never does. Three lives.',
    controls: 'ARROWS / TAP A DIRECTION — STEER',
    roundS: 25,
    bands: [12, 24],
  },
};

export function createGame(slug: string, fx: Fx): Game {
  switch (slug) {
    case 'peregrine': return falconDash(fx);
    case 'aeos': return kernelBoot(fx);
    case 'aarch64-playground': return singleStep(fx);
    case 'qala': return effectCheck(fx);
    case 'rust-http-server': return loadBalancer(fx);
    case 'dossier': return redactionPass(fx);
    case 'dust': return digSite(fx);
    case 'budget-buddy': return marketRun(fx);
    case 'lattice': return domainCollapse(fx);
    case 'whittle': return pruningPass(fx);
    case 'credence': return posteriorHunt(fx);
    case 'regex-fsm': return stateRunner(fx);
    case 'qalam': return floodFill(fx);
    case 'cloud-practitioner-prep': return cloudTriage(fx);
    case 'deadzone': return hordeProtocol(fx);
    case 'qemu-mcp-server': return snapshot(fx);
    case 'bindiff-mcp': return binDiff(fx);
    case 'worm-protocol': return wormProtocol(fx);
    default: return falconDash(fx);
  }
}

export const SIM_W = W;
export const SIM_H = H;
