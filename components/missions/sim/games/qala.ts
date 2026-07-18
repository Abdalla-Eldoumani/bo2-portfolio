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
  BASE,
  MID,
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
  QALA · EFFECT CHECK — the compiler asks: is this expression pure, or
  does it do io? Difficulty tiers climb from bare calls through nested
  expressions to deceptively named functions whose body tells the truth.
  A streak fills the optimizer meter: while the optimizer pass runs,
  cards travel compressed and points double. Three straight misses deal
  a type-error recovery card to reset your footing.
*/

type Snip = { code: string; io: boolean; tier: 1 | 2 | 3; hint?: string };

const SNIPPETS: Snip[] = [
  // tier 1 — bare expressions
  { code: 'print("salaam")', io: true, tier: 1 },
  { code: 'let y = x * 2', io: false, tier: 1 },
  { code: 'file.read("cfg")', io: true, tier: 1 },
  { code: 'fn add(a, b) = a + b', io: false, tier: 1 },
  { code: 'net.send(pkt)', io: true, tier: 1 },
  { code: 'let n = len(xs)', io: false, tier: 1 },
  { code: 'clock.now()', io: true, tier: 1 },
  { code: 'map(xs, square)', io: false, tier: 1 },
  { code: 'rand()', io: true, tier: 1 },
  { code: 'sort(ys)', io: false, tier: 1 },
  // tier 2 — nested calls: judge the whole chain
  { code: 'len(map(xs, square))', io: false, tier: 2 },
  { code: 'log(compute(x))', io: true, tier: 2 },
  { code: 'sum(filter(xs, even))', io: false, tier: 2 },
  { code: 'save(merge(a, b))', io: true, tier: 2 },
  { code: 'max(xs) + min(xs)', io: false, tier: 2 },
  { code: 'trim(read_line())', io: true, tier: 2 },
  { code: 'hash(join(parts))', io: false, tier: 2 },
  { code: 'send(zip(ks, vs))', io: true, tier: 2 },
  // tier 3 — deceptive names: the body is the truth
  { code: 'pure_log(x)', io: true, tier: 3, hint: 'fn pure_log(x) { file.write(x) }' },
  { code: 'get_cached(k)', io: true, tier: 3, hint: 'fn get_cached(k) { net.fetch(k) }' },
  { code: 'print_len(xs)', io: false, tier: 3, hint: 'fn print_len(xs) = len(xs)' },
  { code: 'random_seed', io: false, tier: 3, hint: 'let random_seed = 42' },
  { code: 'offline_sum(a)', io: true, tier: 3, hint: 'fn offline_sum(a) { log(a); a }' },
  { code: 'write_up(s)', io: false, tier: 3, hint: 'fn write_up(s) = upper(s)' },
  { code: 'fetch_size', io: false, tier: 3, hint: 'let fetch_size = 4096' },
  { code: 'quiet_calc(x)', io: true, tier: 3, hint: 'fn quiet_calc(x) { net.send(x); x }' },
];

export function effectCheck(fx: Fx, veteran = false): Game {
  const evs: SimEvent[] = [];
  fx.combo.set({ window: 5, step: 3, maxMult: 3 });
  const s = {
    card: null as null | (Snip & { y: number; recovery: boolean }),
    pts: 0,
    ok: 0,
    bad: 0,
    missRun: 0,
    tier3Reads: 0,
    optimizer: 0,
    optimizerPasses: 0,
    lastTriggerN: 0,
    feedback: 0,
    feedbackGood: true,
    tierPeak: 1,
  };

  // veteran mode runs hotter: the tier gates arrive sooner
  const pool = (): Snip[] => {
    if (s.ok < (veteran ? 4 : 6)) return SNIPPETS.filter((c) => c.tier === 1);
    if (s.ok < (veteran ? 10 : 14)) return SNIPPETS.filter((c) => c.tier <= 2);
    return SNIPPETS.filter((c) => c.tier >= 2);
  };

  const spawn = (recovery = false) => {
    const from = recovery ? SNIPPETS.filter((c) => c.tier === 1) : pool();
    const pick = from[Math.floor(Math.random() * from.length)];
    s.card = { ...pick, y: 40, recovery };
    const tier = pick.tier;
    if (!recovery && tier > s.tierPeak) {
      s.tierPeak = tier;
      fx.announce(tier === 2 ? 'TIER 2: NESTED CALLS' : 'TIER 3: DECEPTIVE NAMES',
        tier === 3 ? 'THE BODY IS THE TRUTH' : undefined);
      evs.push({ kind: 'milestone', label: `TIER ${tier}` });
    }
  };
  spawn();

  const speed = () => {
    const base = 58 + Math.min(s.ok * 4.5, 110);
    return (
      base * (s.optimizer > 0 ? 1.65 : 1) * (s.card?.recovery ? 0.7 : 1) * (veteran ? 1.25 : 1)
    );
  };

  const judge = (io: boolean) => {
    const card = s.card;
    if (!card) return;
    const right = card.io === io;
    const lateness = (card.y - 40) / (H - 136 - 40);
    if (right) {
      const mult = s.optimizer > 0 ? 2 : 1;
      const pts = card.tier * mult;
      s.pts += pts;
      s.ok += 1;
      s.missRun = 0;
      fx.combo.add();
      fx.text(W / 2, card.y - 30, `+${pts}`, { color: s.optimizer > 0 ? OH : OC });
      fx.burst(W / 2, card.y, { color: right && card.tier === 3 ? OH : GREEN, n: 8, speed: 130 });
      if (card.recovery) evs.push({ kind: 'hazard', label: 'TYPE ERROR CLEARED' });
      if (card.tier === 3) {
        s.tier3Reads += 1;
        evs.push({ kind: 'perfect', label: 'DECEPTION READ' });
      }
      if (lateness > 0.82) evs.push({ kind: 'near-miss', label: 'LAST TICK', x: W / 2, y: card.y - 48 });
      if (fx.combo.n - s.lastTriggerN >= 6 && s.optimizer <= 0) {
        s.optimizer = 6;
        s.optimizerPasses += 1;
        s.lastTriggerN = fx.combo.n;
        fx.announce('OPTIMIZER PASS', 'TRAVEL COMPRESSED · POINTS ×2');
        evs.push({ kind: 'streak', value: fx.combo.n });
      }
    } else {
      s.bad += 1;
      s.missRun += 1;
      const broken = fx.combo.break();
      if (broken >= 3) evs.push({ kind: 'combo-break', value: broken });
      fx.shake(2.5);
      fx.burst(W / 2, card.y, { color: RED, n: 10, speed: 150 });
      fx.text(W / 2, card.y - 30, card.io ? 'DOES IO' : 'IS PURE', { color: RED });
    }
    s.feedback = 0.35;
    s.feedbackGood = right;
    spawn(s.missRun >= 3);
    if (s.missRun >= 3) {
      s.missRun = 0;
      fx.announce('TYPE ERROR', 'RECOVERY CARD DEALT');
      evs.push({ kind: 'hazard', label: 'TYPE ERROR' });
    }
  };

  return {
    update(dt, input) {
      s.optimizer = Math.max(0, s.optimizer - dt);
      if (s.card) {
        s.card.y += speed() * dt;
        if (s.card.y > H - 136) {
          s.bad += 1;
          s.missRun += 1;
          const broken = fx.combo.break();
          if (broken >= 3) evs.push({ kind: 'combo-break', value: broken });
          s.feedback = 0.35;
          s.feedbackGood = false;
          fx.text(W / 2, H - 150, 'TIMED OUT', { color: RED });
          spawn(s.missRun >= 3);
          if (s.missRun >= 3) s.missRun = 0;
        }
      }
      s.feedback = Math.max(0, s.feedback - dt);
      if (input.pressed.includes('ArrowLeft')) judge(false);
      else if (input.pressed.includes('ArrowRight')) judge(true);
      else if (input.tap) judge(input.tap.x > W / 2);
    },

    draw(ctx) {
      ctx.fillStyle = SHADOW;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = MID;
      ctx.globalAlpha = 0.14;
      ctx.fillRect(0, 0, W / 2, H);
      ctx.globalAlpha = 0.1;
      ctx.fillRect(W / 2, 0, W / 2, H);
      ctx.globalAlpha = 1;
      display(ctx, 24);
      ctx.fillStyle = GREEN;
      ctx.fillText('IS PURE  ←', 60, H - 40);
      ctx.fillStyle = OC;
      ctx.fillText('→  IS IO', W - 170, H - 40);
      ctx.strokeStyle = INK3;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(W / 2, 20);
      ctx.lineTo(W / 2, H - 70);
      ctx.stroke();
      ctx.setLineDash([]);

      // optimizer meter — six segments, drains while the pass runs
      const segs = 6;
      const charge = s.optimizer > 0 ? (s.optimizer / 6) * segs : Math.min(segs, fx.combo.n - s.lastTriggerN);
      mono(ctx, 9);
      ctx.fillStyle = s.optimizer > 0 ? OH : INK3;
      ctx.fillText('OPTIMIZER', W / 2 - 26, H - 58);
      for (let i = 0; i < segs; i++) {
        ctx.fillStyle =
          i < charge ? (s.optimizer > 0 ? OH : FR) : 'rgba(255,255,255,0.13)';
        ctx.fillRect(W / 2 - 45 + i * 16, H - 52, 12, 5);
      }

      if (s.card) {
        const cw = s.card.hint ? 340 : 300;
        const ch = s.card.hint ? 58 : 44;
        const top = s.card.y - 22;
        ctx.fillStyle = BASE;
        ctx.fillRect(W / 2 - cw / 2, top, cw, ch);
        ctx.strokeStyle =
          s.feedback > 0 ? (s.feedbackGood ? GREEN : RED) : s.card.recovery ? GREEN : FR;
        ctx.lineWidth = 2;
        ctx.strokeRect(W / 2 - cw / 2, top, cw, ch);
        mono(ctx, 15);
        ctx.fillStyle = INK;
        const tw = ctx.measureText(s.card.code).width;
        ctx.fillText(s.card.code, W / 2 - tw / 2, s.card.y + 5);
        if (s.card.hint) {
          mono(ctx, 11);
          ctx.fillStyle = INK2;
          const hw = ctx.measureText(s.card.hint).width;
          ctx.fillText(s.card.hint, W / 2 - hw / 2, s.card.y + 24);
        }
        if (s.card.recovery) {
          mono(ctx, 9);
          ctx.fillStyle = GREEN;
          ctx.fillText('RECOVERY', W / 2 - cw / 2, top - 6);
        }
      }
    },

    score: () => s.pts,
    hud: () => `COMPILED ${s.ok} · ERRORS ${s.bad}${s.optimizer > 0 ? ' · OPT ×2' : ''}`,
    events: () => evs,
    onRoundEnd: (): RoundStats => {
      const total = s.ok + s.bad;
      const acc = total > 0 ? Math.round((s.ok / total) * 100) : 0;
      return {
        display: [
          { label: 'EXPRESSIONS JUDGED', value: String(total) },
          { label: 'ACCURACY', value: `${acc}%` },
          { label: 'DECEPTIONS READ', value: String(s.tier3Reads) },
          { label: 'OPTIMIZER PASSES', value: String(s.optimizerPasses) },
        ],
        tallies: {
          judged: total,
          correct: s.ok,
          accuracy: acc,
          tier3Reads: s.tier3Reads,
          optimizerPasses: s.optimizerPasses,
          bestStreak: fx.combo.best,
        },
      };
    },
  };
}
