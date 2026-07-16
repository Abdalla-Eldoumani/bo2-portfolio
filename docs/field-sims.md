# Field sims (the mini-games)

Every project on Mission Select carries a FIELD SIM: a short score-attack
mini-game (20-25 seconds, set per sim) that symbolizes what the project
actually does. Peregrine (a SIMD math engine) is a falcon flying very fast;
the educational OS boots a kernel; the constraint solver collapses domains
to fixpoint. The games are the portfolio's argument made playable.

## The harness (`components/missions/sim/field-sim.tsx`)

One component owns everything game-independent:

- a native `<dialog>` (focus trap, top layer, ESC-to-close for free),
- the ready → running → debrief lifecycle and the per-sim clock
  (`SIM_META[slug].roundS`),
- input collection: keyboard on `window` in the **capture phase** while
  open - game keys (arrows, space, Enter) are stopped dead with
  `stopImmediatePropagation`, so nothing outside the sim ever reacts;
  ESC is deliberately untouched so the native close still works,
- pointer input mapped into canvas coordinates,
- the HUD (timer, per-game status line) drawn onto the canvas,
- a CRT pass: tiled film grain re-offset every frame plus a drifting
  scanline band (pinned still under `prefers-reduced-motion`),
- draining each game's event stream into sound cues, floating combat
  text and the career tallies,
- session best per sim in `sessionStorage` (`sim-<slug>`), all-time
  career state through `lib/career.ts`,
- ranks: FNG → RECRUIT → VETERAN → PRESTIGE against per-sim bands
  (`SIM_META[slug].bands`),
- the debrief: score count-up, round stats, medals, XP bar with rank
  carry-over, next-challenge hint, and Run It Back / Next Sim / Exit.
  Next Sim cycles to the next op's sim without leaving the dialog
  (button or N key).

## The game contract (`components/missions/sim/contract.ts`)

A game is a factory returning four required functions and two optional
hooks - no classes, no React, no DOM:

```ts
type Game = {
  update(dt: number, input: SimInput): void;
  draw(ctx: CanvasRenderingContext2D): void;
  score(): number;
  hud(): string;
  events?(): SimEvent[];      // drained per frame by the harness
  onRoundEnd?(): RoundStats;  // debrief lines + career tallies
};

type SimInput = {
  held: boolean;                        // space / pointer held
  pressed: string[];                    // keys pressed this frame
  tap: { x: number; y: number } | null; // canvas-space tap
};

type SimEvent = {
  kind: 'perfect' | 'near-miss' | 'streak' | 'hazard'
      | 'combo-break' | 'milestone';
  label?: string;      // floating text, when x/y are present
  value?: number;
  x?: number;
  y?: number;
};

type RoundStats = {
  display: { label: string; value: string }[]; // debrief rows
  tallies: Record<string, number>;             // medal/challenge inputs
};
```

Canvas is fixed at 720×380 (`SIM_W`/`SIM_H`), scaled by CSS. `SIM_META`
(in `components/missions/sim/games.ts`, the registry) maps slug → title,
one-line brief, control legend, round length and rank bands.

## The game-feel toolkit (`components/missions/sim/fx.ts`)

One `Fx` instance lives per round; the harness creates it and hands it to
the game factory. It carries the palette constants (mirroring the theme
tokens - games never invent colors) and:

- a pre-allocated particle pool (bursts, trails) and floating-text pool,
- hit-stop (`freeze()`, gating the game world but never the round clock),
- camera shake (`shake()`, applied around the game draw, pinned under
  reduced motion),
- an announcer strip (`announce('WAVE 2', 'sub line')`),
- a shared combo meter (`fx.combo`) so every sim speaks one streak
  grammar.

Everything decorative damps to near-still under `prefers-reduced-motion`.

## The career layer (`lib/career.ts`, `lib/data/career.ts`)

Rounds feed a persistent career: XP normalized against each sim's
PRESTIGE band, a ten-rank ladder reusing the Combat Record emblems,
medals (a shared set plus one signature medal per sim, in that project's
language), bronze/silver/gold challenges per sim, and prestige at the XP
cap. One versioned localStorage key (`bo2-career-v1`), written only at
round end, corrupt data resets cleanly, and a blocked localStorage
degrades to an in-memory session. The top bar wears the rank, Combat
Record shows the full panel, and Mission Select whispers best ranks and
the next unearned challenge.

## The fourteen sims

| Slug | Game | Seconds |
| --- | --- | --- |
| `peregrine` | Falcon dash - thermals, fused center rings, overspeed | 25 |
| `aeos` | Kernel boot - timing windows, IRQs, overclock chains | 20 |
| `aarch64-playground` | Single step - hazards, interlocks, dual-issue | 22 |
| `qala` | Effect check - sort expressions PURE ← / → IO | 20 |
| `rust-http-server` | Load balancer - bursts, cache hits, scale-out | 25 |
| `dossier` | Redaction pass - ink budget, decoys, split pages | 22 |
| `dust` | Dig site - sonar pings, refills, signal jams | 22 |
| `budget-buddy` | Market run - headlines, regimes, leverage | 25 |
| `lattice` | Domain collapse - propagate to fixpoint, backjump on conflict | 25 |
| `whittle` | Pruning pass - kill contradicting candidates, merge duplicates | 24 |
| `credence` | Posterior hunt - calibrate a belief band on a moving value | 25 |
| `regex-fsm` | State runner - consume the tape, cash the accept state | 22 |
| `qalam` | Flood fill - finish regions before the scanline repaints | 24 |
| `cloud-practitioner-prep` | Cloud triage - true/false drill to the ready signal | 22 |

## Adding a game

1. Write a factory in `components/missions/sim/games/<slug>.ts` returning
   the `Game` contract.
2. Register it in `createGame()` and add its `SIM_META` entry (title,
   brief, controls, `roundS`, `bands`).
3. Give the project's data entry the matching `slug`.
4. Add its career data in `lib/data/career.ts`: one signature medal,
   bronze/silver/gold challenges keyed to a tally, and a `MISTAKES`
   derivation. The data tests fail on any gap.

Keep update logic frame-rate independent (use `dt`), avoid per-frame
allocations, draw with the palette constants from `fx.ts`, keep every
keyboard action tap-equivalent, and let the harness own time, input and
sound.
