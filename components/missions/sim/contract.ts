/*
  The game contract. A field sim is a pure factory over this interface:
  the harness owns clock, lifecycle, input and HUD chrome; games update
  and draw. Everything below update/draw/score/hud is optional so a
  minimal game still works.
*/

export type SimInput = {
  held: boolean; // primary held (Space / pointer down)
  pressed: string[]; // keys pressed this frame: 'Enter','ArrowLeft',…
  tap: { x: number; y: number } | null; // canvas-space tap this frame
};

/*
  Medal-worthy moments games report to the harness (drained per frame).
  The harness turns them into SFX and career-meta tallies. Convention:
  an event carrying x/y also gets default floating text from the harness;
  a game that draws its own feedback emits the event without coordinates.
*/
export type SimEventKind =
  | 'perfect' // dead-center / flawless action
  | 'near-miss' // grazed a hazard or an edge and lived
  | 'streak' // streak milestone reached (value = length)
  | 'hazard' // hazard survived or cleared
  | 'combo-break' // streak lost (value = length lost)
  | 'milestone'; // escalation beat (wave, phase shift, scale-out)

export type SimEvent = {
  kind: SimEventKind;
  label?: string;
  value?: number;
  x?: number;
  y?: number;
};

/** Debrief payload: display lines for the human, tallies for the meta. */
export type RoundStats = {
  display: { label: string; value: string }[];
  tallies: Record<string, number>;
};

export type Game = {
  update(dt: number, input: SimInput): void;
  draw(ctx: CanvasRenderingContext2D): void;
  score(): number;
  hud(): string; // left-side HUD readout
  events?(): SimEvent[]; // drained by the harness every frame
  onRoundEnd?(): RoundStats; // richer debrief + meta-layer stats
};
