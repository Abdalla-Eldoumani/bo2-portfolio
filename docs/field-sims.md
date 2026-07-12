# Field sims (the mini-games)

Every project on Mission Select carries a FIELD SIM: a 20-second
score-attack mini-game that symbolizes what the project actually does.
Peregrine (a SIMD math engine) is a falcon flying very fast; the educational OS
boots a kernel; the HTTP server load-balances queues. The games are the
portfolio's argument made playable.

## The harness (`components/missions/sim/field-sim.tsx`)

One component owns everything game-independent:

- a native `<dialog>` (focus trap, top layer, ESC-to-close for free),
- the ready → running → debrief lifecycle and the 20s clock,
- input collection: keyboard on `window` in the **capture phase** while
  open - game keys (arrows, space, Enter) are stopped dead with
  `stopImmediatePropagation`, so nothing outside the sim ever reacts;
  ESC is deliberately untouched so the native close still works,
- pointer input mapped into canvas coordinates,
- the HUD (timer, per-game status line) drawn onto the canvas,
- a CRT pass: tiled film grain re-offset every frame plus a drifting
  scanline band (pinned still under `prefers-reduced-motion`),
- score blips and the debrief sting from `lib/sfx.ts`,
- session best per sim in `sessionStorage` (`sim-<slug>`),
- ranks: FNG → RECRUIT → VETERAN → PRESTIGE against per-game bands.

## The game contract (`components/missions/sim/games.ts`)

A game is a factory returning four functions - no classes, no React:

```ts
type Game = {
  update(dt: number, input: SimInput): void;
  draw(ctx: CanvasRenderingContext2D): void;
  score(): number;
  hud(): string;
};

type SimInput = {
  held: boolean;                        // space / pointer held
  pressed: string[];                    // keys pressed this frame
  tap: { x: number; y: number } | null; // canvas-space tap
};
```

Canvas is fixed at 720×380 (`SIM_W`/`SIM_H`), scaled by CSS. `SIM_META`
maps slug → title, one-line brief, and the control legend shown on the
ready screen.

## The eight sims

| Slug | Game |
| --- | --- |
| `peregrine` | Falcon dash - dive through gates at speed |
| `aeos` | Kernel boot - hit the timing window on real boot-log stages |
| `aarch64-playground` | Single-step - route instructions, flush the pipeline |
| `qala` | Effect check - sort expressions PURE ← / → IO |
| `rust-http-server` | Load balancer - keep three queues under p99 |
| `dossier` | Redaction pass - clear classified lines |
| `dust` | Dig site - probe the heat grid |
| `budget-buddy` | Market run - trade a random walk |

## Adding a game

1. Write a factory in `games.ts` returning the `Game` contract.
2. Register it in `createGame()` and add its `SIM_META` entry.
3. Give the project's data entry the matching `slug`.
4. Set its score bands in `rank()` in `field-sim.tsx`.

Keep update logic frame-rate independent (use `dt`), draw with the scene
palette, and let the harness own time, input and sound.
