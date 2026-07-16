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
  REGEX-FSM · STATE RUNNER — you are the automaton. Characters stream
  off the tape; pick the outgoing arc that consumes each one to keep the
  run alive. Reaching the accept state (the double ring) cashes the whole
  word. From tier two the machine grows a third arc and λ-transitions:
  when no arc matches the tape, the λ move is the only way to live —
  exactly how an NFA threads a hole in its transition table.
*/

const ALPHABET = ['a', 'b', '0', '1'];
const LAMBDA = 'λ';

type Arc = { label: string; correct: boolean };

export function stateRunner(fx: Fx): Game {
  const evs: SimEvent[] = [];
  fx.combo.set({ window: 4, step: 4, maxMult: 4 });
  const s = {
    word: [] as string[], // tape symbols for this run (λ slots included)
    pos: 0, // consumed symbols
    arcs: [] as Arc[],
    clock: 0,
    clockMax: 3,
    pts: 0,
    transitions: 0,
    accepts: 0,
    rejects: 0,
    lambdaMoves: 0,
    tier: 1,
    pause: 0, // dead time after accept/reject
    flash: 0,
    flashGood: true,
  };

  const rand = (n: number) => Math.floor(Math.random() * n);
  const pick = <T,>(xs: T[]) => xs[rand(xs.length)];

  const newWord = () => {
    const len = Math.min(7, 4 + Math.floor(s.accepts / 2));
    s.word = Array.from({ length: len }, () => pick(ALPHABET));
    // Tier 2+: one symbol becomes a λ step — the tape char has no arc and
    // the free move is the answer.
    if (s.tier >= 2 && Math.random() < 0.7) {
      s.word[1 + rand(len - 2)] = LAMBDA;
    }
    s.pos = 0;
    dealArcs();
  };

  const dealArcs = () => {
    const want = s.word[s.pos];
    const n = s.tier >= 2 ? 3 : 2;
    const labels = new Set<string>();
    const arcs: Arc[] = [];
    if (want === LAMBDA) {
      arcs.push({ label: LAMBDA, correct: true });
      labels.add(LAMBDA);
    } else {
      arcs.push({ label: want, correct: true });
      labels.add(want);
    }
    while (arcs.length < n) {
      const alt = pick(ALPHABET);
      if (labels.has(alt) || alt === s.word[s.pos]) continue;
      labels.add(alt);
      arcs.push({ label: alt, correct: false });
    }
    s.arcs = arcs.sort(() => Math.random() - 0.5);
    s.clockMax = Math.max(1.4, 2.8 - s.transitions * 0.045);
    s.clock = s.clockMax;
  };

  const choose = (i: number | null) => {
    if (s.pause > 0 || s.arcs.length === 0) return;
    const arc = i === null ? null : s.arcs[i];
    if (arc?.correct) {
      const isLambda = arc.label === LAMBDA;
      s.transitions += 1;
      fx.combo.add();
      const gained = fx.combo.mult();
      s.pts += gained;
      s.flash = 0.3;
      s.flashGood = true;
      const nx = nodeX(s.pos + 1);
      fx.text(nx, 176, `+${gained}`, { color: isLambda ? TEAL : OC });
      fx.burst(nx, 200, { color: isLambda ? TEAL : OC, n: 6, speed: 110 });
      if (isLambda) {
        s.lambdaMoves += 1;
        evs.push({ kind: 'perfect', label: 'λ-CLOSURE' });
      }
      if (s.clock / s.clockMax < 0.22) {
        evs.push({ kind: 'near-miss', label: 'LAST TICK' });
      }
      s.pos += 1;
      if (s.pos >= s.word.length) {
        // accept state: cash the word
        const bonus = s.word.length;
        s.pts += bonus;
        s.accepts += 1;
        fx.freeze();
        fx.text(nodeX(s.pos), 176, `ACCEPTED +${bonus}`, { color: GREEN, big: true, size: 17 });
        fx.burst(nodeX(s.pos), 200, { color: GREEN, n: 14, speed: 160 });
        evs.push({ kind: 'streak', label: 'ACCEPTED', value: s.accepts });
        if (s.tier === 1 && s.accepts >= 2) {
          s.tier = 2;
          fx.announce('NFA MODE', 'THREE ARCS · λ-TRANSITIONS LIVE');
          evs.push({ kind: 'milestone', label: 'NFA MODE' });
        } else if (s.tier === 2 && s.accepts >= 5) {
          s.tier = 3;
          fx.announce('SUBSET SPRINT', 'THE TAPE SPEEDS UP');
          evs.push({ kind: 'milestone', label: 'SUBSET SPRINT' });
        }
        s.pause = 0.55;
      } else {
        dealArcs();
      }
    } else {
      s.rejects += 1;
      const broken = fx.combo.break();
      if (broken >= 3) evs.push({ kind: 'combo-break', value: broken });
      fx.shake(3);
      s.flash = 0.35;
      s.flashGood = false;
      fx.text(nodeX(s.pos), 176, i === null ? 'TIMED OUT' : 'TRAP STATE', { color: RED });
      fx.burst(nodeX(s.pos), 200, { color: RED, n: 10, speed: 140 });
      evs.push({ kind: 'hazard', label: 'REJECTED' });
      s.pause = 0.55;
      s.pos = s.word.length; // force new word after the pause
    }
  };

  const nodeX = (i: number) => 74 + i * Math.min(64, 480 / Math.max(1, s.word.length));

  newWord();

  const CHIP_Y = [96, 168, 240];

  return {
    update(dt, input) {
      s.flash = Math.max(0, s.flash - dt);
      if (s.pause > 0) {
        s.pause -= dt;
        if (s.pause <= 0 && s.pos >= s.word.length) newWord();
        return;
      }
      s.clock -= dt;
      if (s.clock <= 0) {
        choose(null);
        return;
      }
      const keys = ['ArrowUp', 'ArrowRight', 'ArrowDown'];
      for (let i = 0; i < s.arcs.length; i++) {
        if (input.pressed.includes(keys[i])) {
          choose(i);
          return;
        }
      }
      if (input.tap && input.tap.x > W * 0.55) {
        const zone = Math.floor(((input.tap.y - 60) / (H - 120)) * s.arcs.length);
        choose(Math.max(0, Math.min(s.arcs.length - 1, zone)));
      }
    },

    draw(ctx) {
      ctx.fillStyle = SHADOW;
      ctx.fillRect(0, 0, W, H);

      // the tape: consumed symbols dim, current bright
      mono(ctx, 12);
      let tx = 16;
      ctx.fillStyle = INK3;
      ctx.fillText('TAPE', tx, 46);
      tx += 44;
      for (let i = 0; i < s.word.length; i++) {
        ctx.fillStyle = i < s.pos ? INK3 : i === s.pos ? OH : INK2;
        const sym = s.word[i];
        ctx.fillText(sym, tx, 46);
        tx += 18;
      }

      // current symbol, big
      if (s.pos < s.word.length && s.pause <= 0) {
        display(ctx, 44);
        const sym = s.word[s.pos];
        ctx.fillStyle = sym === LAMBDA ? TEAL : INK;
        const swd = ctx.measureText(sym).width;
        ctx.fillText(sym, W * 0.32 - swd / 2, 110);
        mono(ctx, 9);
        ctx.fillStyle = INK3;
        ctx.fillText(sym === LAMBDA ? 'NO ARC CONSUMES λ — FREE MOVE' : 'READ', W * 0.32 - 40, 126);
        // decision clock
        const frac = Math.max(0, s.clock / s.clockMax);
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(W * 0.32 - 50, 134, 100, 3);
        ctx.fillStyle = frac < 0.3 ? RED : OC;
        ctx.fillRect(W * 0.32 - 50, 134, 100 * frac, 3);
      }

      // state chain: run so far, accept state double-ringed
      const cy = 200;
      for (let i = 0; i <= s.word.length; i++) {
        const x = nodeX(i);
        const isCur = i === s.pos;
        const isAccept = i === s.word.length;
        ctx.beginPath();
        ctx.arc(x, cy, isCur ? 11 : 8, 0, Math.PI * 2);
        ctx.fillStyle = i < s.pos ? FR : isCur ? OC : BASE;
        ctx.fill();
        ctx.strokeStyle = isCur ? OH : s.flash > 0 && !s.flashGood && isCur ? RED : INK3;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        if (isAccept) {
          ctx.beginPath();
          ctx.arc(x, cy, 13, 0, Math.PI * 2);
          ctx.strokeStyle = GREEN;
          ctx.stroke();
        }
        if (i < s.word.length) {
          ctx.strokeStyle = i < s.pos ? FR : 'rgba(255,255,255,0.18)';
          ctx.beginPath();
          ctx.moveTo(x + (isCur ? 11 : 8), cy);
          ctx.lineTo(nodeX(i + 1) - 8, cy);
          ctx.stroke();
        }
      }
      mono(ctx, 9);
      ctx.fillStyle = INK3;
      ctx.fillText('q0', nodeX(0) - 6, cy + 24);
      ctx.fillStyle = GREEN;
      ctx.fillText('ACCEPT', nodeX(s.word.length) - 18, cy + 28);

      // arc choices
      if (s.pos < s.word.length && s.pause <= 0) {
        const from = { x: nodeX(s.pos), y: cy };
        const keyCaps = ['↑', '→', '↓'];
        s.arcs.forEach((arc, i) => {
          const y = CHIP_Y[i] + (3 - s.arcs.length) * 30;
          const x = W - 150;
          ctx.strokeStyle = arc.label === LAMBDA ? TEAL : INK3;
          ctx.globalAlpha = 0.7;
          ctx.beginPath();
          ctx.moveTo(from.x + 12, from.y - 4);
          ctx.quadraticCurveTo((from.x + x) / 2, y - 24, x - 12, y + 14);
          ctx.stroke();
          ctx.globalAlpha = 1;
          ctx.fillStyle = BASE;
          ctx.fillRect(x - 12, y, 96, 30);
          ctx.strokeStyle = arc.label === LAMBDA ? TEAL : FR;
          ctx.lineWidth = 1.5;
          ctx.strokeRect(x - 12, y, 96, 30);
          display(ctx, 21);
          ctx.fillStyle = arc.label === LAMBDA ? TEAL : INK;
          ctx.fillText(arc.label, x + 4, y + 22);
          mono(ctx, 10);
          ctx.fillStyle = INK3;
          ctx.fillText(keyCaps[i], x + 62, y + 20);
        });
      }
    },

    score: () => s.pts,
    hud: () =>
      `RUNS ACCEPTED ${s.accepts} · TRANSITIONS ${s.transitions}${s.tier >= 2 ? ' · NFA' : ''}`,
    events: () => evs,
    onRoundEnd: (): RoundStats => ({
      display: [
        { label: 'WORDS ACCEPTED', value: String(s.accepts) },
        { label: 'TRANSITIONS', value: String(s.transitions) },
        { label: 'λ-CLOSURES', value: String(s.lambdaMoves) },
        { label: 'REJECTIONS', value: String(s.rejects) },
      ],
      tallies: {
        accepts: s.accepts,
        transitions: s.transitions,
        lambdaMoves: s.lambdaMoves,
        rejects: s.rejects,
        bestStreak: fx.combo.best,
      },
    }),
  };
}
