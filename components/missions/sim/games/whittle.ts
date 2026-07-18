import {
  type Fx,
  W,
  H,
  INK,
  INK2,
  INK3,
  OC,
  OH,
  FR,
  GREEN,
  RED,
  TEAL,
  BASE,
  SHADOW,
  mono,
  display,
} from '@/components/missions/sim/fx';
import type {
  Game,
  RoundStats,
  SimEvent,
} from '@/components/missions/sim/contract';

/*
  WHITTLE · PRUNING PASS — the enumerator generates candidate programs;
  you are the pruner. Kill any candidate that contradicts the
  input/output examples before it joins the kept set; let consistent
  ones through. Duplicates that compute the same outputs as a kept
  program are dead branches — observational equivalence says kill those
  too, however correct they look. The enumerator only gets faster.
*/

type Verdict = 'kill' | 'keep' | 'dup';
type Cand = { expr: string; v: Verdict; note?: string };
type Spec = { io: string; cands: Cand[] };

// Every verdict is verified against the two examples by hand; dups are
// ordered after the kept twin they duplicate.
const SPECS: Spec[] = [
  {
    io: 'f(3) = 6 · f(1) = 2',
    cands: [
      { expr: 'x + 3', v: 'kill' },
      { expr: 'x * 2', v: 'keep' },
      { expr: 'x * x', v: 'kill' },
      { expr: 'x + x', v: 'dup', note: 'OUTPUTS MATCH x * 2' },
      { expr: 'x + 1', v: 'kill' },
      { expr: '6', v: 'kill' },
    ],
  },
  {
    io: 'f(2) = 4 · f(3) = 9',
    cands: [
      { expr: 'x * 2', v: 'kill' },
      { expr: '3 * x - 2', v: 'kill' },
      { expr: 'x * x', v: 'keep' },
      { expr: 'x + 2', v: 'kill' },
      { expr: 'x * x * 1', v: 'dup', note: 'OUTPUTS MATCH x * x' },
      { expr: '12 - x', v: 'kill' },
    ],
  },
  {
    io: 'f(4) = 5 · f(0) = 1',
    cands: [
      { expr: 'x * 2 - 3', v: 'kill' },
      { expr: 'x + 1', v: 'keep' },
      { expr: '5', v: 'kill' },
      { expr: '1 + x', v: 'dup', note: 'OUTPUTS MATCH x + 1' },
      { expr: 'x - 1', v: 'kill' },
      { expr: 'x * x', v: 'kill' },
    ],
  },
  {
    io: 'f(2) = 1 · f(5) = 4',
    cands: [
      { expr: 'x / 2', v: 'kill' },
      { expr: 'x - 1', v: 'keep' },
      { expr: '6 - x', v: 'kill' },
      { expr: 'x - 1 + 0', v: 'dup', note: 'OUTPUTS MATCH x - 1' },
      { expr: '1', v: 'kill' },
      { expr: 'x + 1', v: 'kill' },
    ],
  },
  {
    io: 'f(1) = 3 · f(2) = 6',
    cands: [
      { expr: 'x + 2', v: 'kill' },
      { expr: 'x * 3', v: 'keep' },
      { expr: '3', v: 'kill' },
      { expr: 'x * x + 2', v: 'keep' },
      { expr: 'x + x + x', v: 'dup', note: 'OUTPUTS MATCH x * 3' },
      { expr: 'x * 2', v: 'kill' },
    ],
  },
  {
    io: 'f(6) = 3 · f(2) = 1',
    cands: [
      { expr: 'x - 3', v: 'kill' },
      { expr: 'x / 2', v: 'keep' },
      { expr: 'x * 2', v: 'kill' },
      { expr: '3', v: 'kill' },
      { expr: 'x / 2 + 0', v: 'dup', note: 'OUTPUTS MATCH x / 2' },
      { expr: 'x - 1', v: 'kill' },
    ],
  },
];

export function pruningPass(fx: Fx, veteran = false): Game {
  const evs: SimEvent[] = [];
  fx.combo.set({ window: 5, step: 3, maxMult: 3 });
  const order = [...SPECS].sort(() => Math.random() - 0.5);
  const s = {
    specIdx: 0,
    candIdx: 0,
    card: null as (Cand & { y: number }) | null,
    kept: [] as string[],
    pts: 0,
    judged: 0,
    pruned: 0,
    merges: 0,
    wrongKills: 0,
    bloat: 0,
    surge: 0, // cards remaining in the current surge
    flash: 0,
    flashGood: true,
  };

  const spec = () => order[s.specIdx % order.length];

  const deal = () => {
    const sp = spec();
    if (s.candIdx >= sp.cands.length) {
      s.specIdx += 1;
      s.candIdx = 0;
      s.kept = [];
      fx.announce('NEW SPEC', spec().io);
      evs.push({ kind: 'milestone', label: 'NEW SPEC' });
    }
    s.card = { ...spec().cands[s.candIdx], y: H - 44 };
    s.candIdx += 1;
    if (s.judged > 0 && s.judged % 12 === 0 && s.surge <= 0) {
      s.surge = veteran ? 4 : 3;
      fx.announce('ENUMERATOR SURGE', veteran ? 'FOUR FAST CANDIDATES' : 'THREE FAST CANDIDATES');
      evs.push({ kind: 'hazard', label: 'SURGE' });
    }
  };
  deal();

  const riseSpeed = () => {
    const base = 80 + Math.min(s.judged * 4, 90);
    return base * (s.surge > 0 ? 1.45 : 1) * (veteran ? 1.2 : 1);
  };

  const settle = (killed: boolean) => {
    const card = s.card;
    if (!card) return;
    s.judged += 1;
    if (s.surge > 0) s.surge -= 1;
    const y = card.y;
    s.flash = 0.35;
    if (killed) {
      if (card.v === 'kill') {
        const gained = 2 * fx.combo.mult();
        s.pts += gained;
        s.pruned += 1;
        fx.combo.add();
        s.flashGood = true;
        fx.text(W / 2, y - 28, `PRUNED +${gained}`, { color: OC });
        fx.burst(W / 2, y, { color: OC, n: 9, speed: 140 });
        if (y < H * 0.35) evs.push({ kind: 'near-miss', label: 'LAST CALL' });
      } else if (card.v === 'dup') {
        s.pts += 3;
        s.merges += 1;
        fx.combo.add();
        s.flashGood = true;
        fx.freeze();
        fx.text(W / 2, y - 28, 'OBS-EQ MERGE +3', { color: TEAL });
        fx.burst(W / 2, y, { color: TEAL, n: 12, speed: 150 });
        evs.push({ kind: 'perfect', label: 'OBS-EQ MERGE' });
      } else {
        s.pts = Math.max(0, s.pts - 2);
        s.wrongKills += 1;
        const broken = fx.combo.break();
        if (broken >= 3) evs.push({ kind: 'combo-break', value: broken });
        fx.shake(3);
        s.flashGood = false;
        fx.text(W / 2, y - 28, 'KILLED THE ANSWER −2', { color: RED });
        fx.burst(W / 2, y, { color: RED, n: 12, speed: 160 });
        evs.push({ kind: 'hazard', label: 'ANSWER LOST' });
      }
    } else {
      // reached the top: kept
      if (card.v === 'keep') {
        const gained = 2;
        s.pts += gained;
        fx.combo.add();
        s.flashGood = true;
        if (s.kept.length < 4) s.kept.push(card.expr);
        fx.text(W / 2, 76, `KEPT +${gained}`, { color: GREEN });
        fx.burst(W / 2, 64, { color: GREEN, n: 7, speed: 110 });
      } else {
        s.pts = Math.max(0, s.pts - 1);
        s.bloat += 1;
        const broken = fx.combo.break();
        if (broken >= 3) evs.push({ kind: 'combo-break', value: broken });
        s.flashGood = false;
        fx.text(W / 2, 76, card.v === 'dup' ? 'REDUNDANT −1' : 'BLOAT −1', { color: RED });
        evs.push({ kind: 'hazard', label: 'SEARCH BLOAT' });
      }
    }
    deal();
  };

  return {
    update(dt, input) {
      s.flash = Math.max(0, s.flash - dt);
      if (s.card) {
        s.card.y -= riseSpeed() * dt;
        if (s.card.y <= 62) settle(false);
      }
      if (input.pressed.includes('Enter') || input.tap) {
        settle(true);
      }
    },

    draw(ctx) {
      ctx.fillStyle = SHADOW;
      ctx.fillRect(0, 0, W, H);

      // spec banner
      const sp = spec();
      display(ctx, 22);
      ctx.fillStyle = INK;
      const iw = ctx.measureText(sp.io).width;
      ctx.fillText(sp.io, W / 2 - iw / 2, 58);
      mono(ctx, 9);
      ctx.fillStyle = INK3;
      ctx.fillText('SPEC — CANDIDATES MUST MATCH BOTH EXAMPLES', W / 2 - 132, 72);

      // kept tray (right rail)
      mono(ctx, 9);
      ctx.fillStyle = INK3;
      ctx.fillText('KEPT', W - 128, 100);
      s.kept.slice(-4).forEach((k, i) => {
        ctx.fillStyle = BASE;
        ctx.fillRect(W - 132, 108 + i * 26, 116, 20);
        ctx.strokeStyle = GREEN;
        ctx.lineWidth = 1;
        ctx.strokeRect(W - 132, 108 + i * 26, 116, 20);
        mono(ctx, 11);
        ctx.fillStyle = INK2;
        ctx.fillText(k, W - 124, 122 + i * 26);
      });

      // rising candidate
      if (s.card) {
        const cw = s.card.note ? 300 : 220;
        const ch = s.card.note ? 56 : 42;
        const top = s.card.y - ch / 2;
        const isDup = s.card.v === 'dup';
        ctx.fillStyle = BASE;
        ctx.fillRect(W / 2 - cw / 2, top, cw, ch);
        ctx.strokeStyle =
          s.flash > 0 ? (s.flashGood ? GREEN : RED) : isDup ? TEAL : FR;
        ctx.lineWidth = 2;
        ctx.strokeRect(W / 2 - cw / 2, top, cw, ch);
        mono(ctx, 16);
        ctx.fillStyle = INK;
        const ew = ctx.measureText(s.card.expr).width;
        ctx.fillText(s.card.expr, W / 2 - ew / 2, top + (s.card.note ? 24 : 27));
        if (s.card.note) {
          mono(ctx, 10);
          ctx.fillStyle = TEAL;
          const nw = ctx.measureText(s.card.note).width;
          ctx.fillText(s.card.note, W / 2 - nw / 2, top + 44);
        }
      }

      // pruning line + keep line
      ctx.strokeStyle = INK3;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(60, 84);
      ctx.lineTo(W - 150, 84);
      ctx.stroke();
      ctx.setLineDash([]);
      mono(ctx, 9);
      ctx.fillStyle = INK3;
      ctx.fillText('KEEP LINE — UNKILLED CANDIDATES JOIN THE SET', 60, 96);

      display(ctx, 18);
      ctx.fillStyle = OC;
      ctx.fillText('↵ / TAP — KILL', 60, H - 40);
      ctx.fillStyle = GREEN;
      ctx.fillText('LET IT RISE — KEEP', W - 260, H - 40);
    },

    score: () => s.pts,
    hud: () =>
      `PRUNED ${s.pruned} · KEPT ${s.judged - s.pruned - s.merges - s.wrongKills - s.bloat} · MERGES ${s.merges}${s.surge > 0 ? ' · SURGE' : ''}`,
    events: () => evs,
    onRoundEnd: (): RoundStats => ({
      display: [
        { label: 'CANDIDATES JUDGED', value: String(s.judged) },
        { label: 'PRUNED', value: String(s.pruned) },
        { label: 'OBS-EQ MERGES', value: String(s.merges) },
        { label: 'ANSWERS LOST', value: String(s.wrongKills) },
      ],
      tallies: {
        judged: s.judged,
        pruned: s.pruned,
        merges: s.merges,
        wrongKills: s.wrongKills,
        bloat: s.bloat,
        bestStreak: fx.combo.best,
      },
    }),
  };
}
