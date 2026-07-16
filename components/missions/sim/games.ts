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
    default: return falconDash(fx);
  }
}

export const SIM_W = W;
export const SIM_H = H;
