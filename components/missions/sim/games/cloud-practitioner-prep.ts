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
import {
  TRIAGE_DOMAINS,
  TRIAGE_STATEMENTS,
  type TriageDomain,
} from '@/lib/data/cloud-triage';

/*
  CLOUD PRACTITIONER PREP · CLOUD TRIAGE — rapid true/false triage of AWS
  statements under a per-card clock. Four domain meters mirror the CLF-C02
  exam domains: three correct verdicts master a domain and retire its
  cards, steering the deck toward what you still miss (the project's
  adaptive weak-area drill). Master all four for the READY SIGNAL, then
  the deck reshuffles into exam mode at double points.
*/

const DOMAINS: TriageDomain[] = ['concepts', 'security', 'technology', 'billing'];
const MASTERY = 3;

export function cloudTriage(fx: Fx): Game {
  const evs: SimEvent[] = [];
  fx.combo.set({ window: 4.5, step: 3, maxMult: 3 });
  const s = {
    deck: [...TRIAGE_STATEMENTS].sort(() => Math.random() - 0.5),
    idx: 0,
    card: null as (typeof TRIAGE_STATEMENTS)[number] | null,
    clock: 0,
    clockMax: 3.4,
    pts: 0,
    judged: 0,
    correct: 0,
    mastery: { concepts: 0, security: 0, technology: 0, billing: 0 } as Record<TriageDomain, number>,
    mastered: 0,
    exam: false,
    ready: 0,
    feedback: 0,
    feedbackGood: true,
    verdictShown: '',
  };

  const domainDone = (d: TriageDomain) => s.mastery[d] >= MASTERY;

  const next = () => {
    // Adaptive drill: skip mastered domains until everything is mastered,
    // then exam mode runs the full deck.
    for (let hop = 0; hop < s.deck.length + 1; hop++) {
      const c = s.deck[s.idx % s.deck.length];
      s.idx += 1;
      if (s.exam || !domainDone(c.domain)) {
        s.card = c;
        s.clockMax = Math.max(1.7, 3.4 - s.judged * 0.09) * (s.exam ? 0.8 : 1);
        s.clock = s.clockMax;
        return;
      }
    }
    s.card = null;
  };
  next();

  const resolve = (verdict: boolean | null) => {
    const card = s.card;
    if (!card) return;
    const right = verdict !== null && verdict === card.truth;
    s.judged += 1;
    s.feedback = 0.4;
    s.feedbackGood = right;
    s.verdictShown = card.truth ? 'TRUE' : 'FALSE';
    if (right) {
      const mult = fx.combo.mult() * (s.exam ? 2 : 1);
      s.pts += mult;
      s.correct += 1;
      fx.combo.add();
      fx.text(W / 2, H / 2 - 52, `+${mult}`, { color: s.exam ? OH : OC });
      fx.burst(W / 2, H / 2 - 20, { color: GREEN, n: 7, speed: 120 });
      if (s.clock / s.clockMax > 0.72) {
        evs.push({ kind: 'perfect', label: 'SNAP CALL' });
      }
      if (!s.exam) {
        s.mastery[card.domain] += 1;
        if (domainDone(card.domain)) {
          s.mastered += 1;
          s.pts += 3;
          fx.announce(`${TRIAGE_DOMAINS[card.domain]} MASTERED`, 'DOMAIN RETIRED FROM THE DRILL');
          evs.push({ kind: 'milestone', label: `${TRIAGE_DOMAINS[card.domain]} MASTERED` });
          fx.freeze();
          if (s.mastered === DOMAINS.length) {
            s.exam = true;
            s.ready = 1;
            s.pts += 5;
            fx.announce('READY SIGNAL', 'EXAM MODE — POINTS ×2');
            evs.push({ kind: 'streak', label: 'READY SIGNAL', value: s.correct });
          }
        }
      }
    } else {
      const broken = fx.combo.break();
      if (broken >= 3) evs.push({ kind: 'combo-break', value: broken });
      // the conservative ready signal: one wrong call resets the domain
      if (!s.exam && !domainDone(card.domain)) s.mastery[card.domain] = 0;
      fx.shake(2.5);
      fx.burst(W / 2, H / 2 - 20, { color: RED, n: 9, speed: 140 });
      fx.text(
        W / 2,
        H / 2 - 52,
        verdict === null ? 'TIME' : `IT IS ${s.verdictShown}`,
        { color: RED },
      );
    }
    next();
  };

  return {
    update(dt, input) {
      s.feedback = Math.max(0, s.feedback - dt);
      if (s.card) {
        s.clock -= dt;
        if (s.clock <= 0) resolve(null);
      }
      if (input.pressed.includes('ArrowLeft')) resolve(false);
      else if (input.pressed.includes('ArrowRight')) resolve(true);
      else if (input.tap) resolve(input.tap.x > W / 2);
    },

    draw(ctx) {
      ctx.fillStyle = SHADOW;
      ctx.fillRect(0, 0, W, H);
      // verdict halves
      ctx.globalAlpha = 0.1;
      ctx.fillStyle = MID;
      ctx.fillRect(0, 0, W / 2, H);
      ctx.globalAlpha = 0.14;
      ctx.fillRect(W / 2, 0, W / 2, H);
      ctx.globalAlpha = 1;
      display(ctx, 24);
      ctx.fillStyle = RED;
      ctx.fillText('FALSE  ←', 60, H - 84);
      ctx.fillStyle = GREEN;
      ctx.fillText('→  TRUE', W - 160, H - 84);

      // statement card
      if (s.card) {
        const cw = 460;
        const ch = 66;
        const top = H / 2 - 56;
        ctx.fillStyle = BASE;
        ctx.fillRect(W / 2 - cw / 2, top, cw, ch);
        ctx.strokeStyle =
          s.feedback > 0 ? (s.feedbackGood ? GREEN : RED) : s.exam ? OH : FR;
        ctx.lineWidth = 2;
        ctx.strokeRect(W / 2 - cw / 2, top, cw, ch);
        mono(ctx, 9);
        ctx.fillStyle = INK3;
        ctx.fillText(TRIAGE_DOMAINS[s.card.domain], W / 2 - cw / 2 + 10, top + 15);
        if (s.exam) {
          ctx.fillStyle = OH;
          ctx.fillText('EXAM ×2', W / 2 + cw / 2 - 58, top + 15);
        }
        mono(ctx, 15);
        ctx.fillStyle = INK;
        const tw = ctx.measureText(s.card.text).width;
        ctx.fillText(s.card.text, W / 2 - tw / 2, top + 42);
        // per-card clock
        const frac = Math.max(0, s.clock / s.clockMax);
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(W / 2 - cw / 2, top + ch + 6, cw, 3);
        ctx.fillStyle = frac < 0.3 ? RED : OC;
        ctx.fillRect(W / 2 - cw / 2, top + ch + 6, cw * frac, 3);
      }

      // domain mastery meters
      const mw = 130;
      const gap = (W - mw * 4 - 60) / 3;
      DOMAINS.forEach((d, i) => {
        const x = 30 + i * (mw + gap);
        const y = H - 48;
        const done = domainDone(d);
        mono(ctx, 9);
        ctx.fillStyle = done ? GREEN : INK2;
        ctx.fillText(TRIAGE_DOMAINS[d], x, y - 6);
        for (let k = 0; k < MASTERY; k++) {
          ctx.fillStyle =
            k < s.mastery[d] ? (done ? GREEN : OC) : 'rgba(255,255,255,0.12)';
          ctx.fillRect(x + k * 44, y, 40, 5);
        }
      });
    },

    score: () => s.pts,
    hud: () =>
      `JUDGED ${s.judged} · CORRECT ${s.correct}${s.exam ? ' · EXAM ×2' : ` · MASTERED ${s.mastered}/4`}`,
    events: () => evs,
    onRoundEnd: (): RoundStats => {
      const acc = s.judged > 0 ? Math.round((s.correct / s.judged) * 100) : 0;
      return {
        display: [
          { label: 'STATEMENTS JUDGED', value: String(s.judged) },
          { label: 'ACCURACY', value: `${acc}%` },
          { label: 'DOMAINS MASTERED', value: `${s.mastered}/4` },
          { label: 'READY SIGNAL', value: s.ready ? 'YES' : 'NO' },
        ],
        tallies: {
          judged: s.judged,
          correct: s.correct,
          accuracy: acc,
          domains: s.mastered,
          readySignal: s.ready,
          bestStreak: fx.combo.best,
        },
      };
    },
  };
}
