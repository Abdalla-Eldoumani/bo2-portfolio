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
  BINDIFF MCP · BIN DIFF — two builds, one symbol table, your eyes.
  Each card shows the same symbol line from BUILD A and BUILD B; call
  SAME or DRIFT before the window closes. Mutations start loud (a size
  jump) and get surgical (one hex nibble, a lookalike glyph); the
  stripped wave takes the names away and leaves you the bytes. False
  positives cost — a diff tool that cries wolf is worse than none.
*/

const SYMBOLS = [
  'memcpy', 'vfs_read', 'sched_tick', 'page_alloc', 'irq_handle',
  'ctx_switch', 'kmalloc', 'strcmp', 'timer_isr', 'mmu_map',
  'elf_load', 'net_poll', 'fb_blit', 'queue_push', 'hash_mix',
];
const SECTIONS = ['.text', '.data', '.rodata', '.bss'];

type Card = {
  a: string;
  b: string;
  differs: boolean;
  hint: string; // what changed, shown on a miss
};

const hex = (n: number) => n.toString(16);

export function binDiff(fx: Fx, veteran = false): Game {
  const evs: SimEvent[] = [];
  fx.combo.set({ window: 4.5, step: 3, maxMult: 3 });

  const s = {
    card: null as Card | null,
    clock: 0,
    clockMax: 3.6,
    pts: 0,
    judged: 0,
    caught: 0,
    falsePos: 0,
    missed: 0,
    stripped: 0,
    strippedCaught: 0,
    // veteran mode opens surgical: tier 2 mutations from line one
    tier: veteran ? 2 : 1,
    feedback: 0,
    feedbackGood: true,
    feedbackHint: '',
  };

  const rand = (n: number) => Math.floor(Math.random() * n);
  const pick = <T,>(xs: T[]) => xs[rand(xs.length)];

  const makeLine = () => {
    const sym = pick(SYMBOLS);
    const sec = pick(SECTIONS);
    const addr = 0x400000 + rand(0xfffff);
    const size = 128 + rand(4000);
    return { sym, sec, addr, size };
  };

  const fmt = (l: { sym: string; sec: string; addr: number; size: number }) =>
    `${l.sym.padEnd(11)} ${l.sec.padEnd(8)} 0x${hex(l.addr)}  ${l.size}B`;

  const deal = () => {
    const stripped = s.tier >= 3 && Math.random() < 0.45;
    const differs = Math.random() < 0.45;
    let a: string;
    let b: string;
    let hint = '';
    if (stripped) {
      s.stripped += 1;
      const bytes = Array.from({ length: 8 }, () => rand(256));
      const aStr = bytes.map((v) => hex(v).padStart(2, '0')).join(' ');
      const bBytes = [...bytes];
      if (differs) {
        const i = rand(8);
        bBytes[i] = (bBytes[i] + 1 + rand(254)) % 256;
        hint = `BYTE ${i} CHANGED`;
      }
      a = `.text  ${aStr}`;
      b = `.text  ${bBytes.map((v) => hex(v).padStart(2, '0')).join(' ')}`;
    } else {
      const base = makeLine();
      a = fmt(base);
      if (!differs) {
        b = a;
      } else {
        const kind = s.tier === 1 ? rand(2) : 2 + rand(3);
        const mutated = { ...base };
        if (kind === 0) {
          mutated.size = base.size + 64 + rand(900);
          hint = 'SIZE GREW';
        } else if (kind === 1) {
          mutated.sec = pick(SECTIONS.filter((x) => x !== base.sec));
          hint = 'SECTION MOVED';
        } else if (kind === 2) {
          mutated.addr = base.addr + (1 << (4 * rand(3)));
          hint = 'ADDRESS SHIFTED';
        } else if (kind === 3) {
          mutated.size = base.size + 1 + rand(8);
          hint = 'SIZE CREPT';
        } else {
          const c = base.sym.split('');
          const i = 1 + rand(c.length - 1);
          const swaps: Record<string, string> = { l: '1', o: '0', m: 'rn', i: 'l', e: 'c' };
          c[i] = swaps[c[i]] ?? 'x';
          mutated.sym = c.join('');
          hint = 'SYMBOL RENAMED';
        }
        b = fmt(mutated);
      }
    }
    s.card = { a, b, differs, hint };
    s.clockMax = Math.max(1.8, 3.6 - s.judged * 0.09) * (veteran ? 0.85 : 1);
    s.clock = s.clockMax;
  };
  deal();

  const resolve = (saidDiff: boolean | null) => {
    const card = s.card;
    if (!card) return;
    s.judged += 1;
    const right = saidDiff !== null && saidDiff === card.differs;
    s.feedback = 0.45;
    s.feedbackGood = right;
    s.feedbackHint = card.differs ? card.hint : 'IDENTICAL';
    if (right) {
      const gained = (card.differs ? 2 : 1) * fx.combo.mult();
      s.pts += gained;
      fx.combo.add();
      if (card.differs) {
        s.caught += 1;
        if (card.a.startsWith('.text  ') && s.tier >= 3) s.strippedCaught += 1;
      }
      fx.text(W / 2, H / 2 - 66, `+${gained}`, { color: card.differs ? OH : OC });
      fx.burst(W / 2, H / 2 - 30, { color: GREEN, n: 7, speed: 110 });
      if (s.clock / s.clockMax > 0.75 && card.differs) {
        evs.push({ kind: 'perfect', label: 'INSTANT READ' });
      }
    } else {
      if (saidDiff === true) {
        s.falsePos += 1;
        s.pts = Math.max(0, s.pts - 2);
      } else {
        s.missed += 1;
      }
      const broken = fx.combo.break();
      if (broken >= 3) evs.push({ kind: 'combo-break', value: broken });
      fx.shake(2.5);
      fx.burst(W / 2, H / 2 - 30, { color: RED, n: 9, speed: 130 });
      fx.text(
        W / 2,
        H / 2 - 66,
        saidDiff === null ? 'TIME' : saidDiff ? 'FALSE POSITIVE' : `MISSED — ${card.hint}`,
        { color: RED },
      );
      evs.push({ kind: 'hazard', label: saidDiff ? 'FALSE POSITIVE' : 'DRIFT MISSED' });
    }
    // escalation: tier 2 sharpens the deltas, tier 3 strips the symbols
    if (s.tier === 1 && s.judged >= 6) {
      s.tier = 2;
      fx.announce('SURGICAL DIFFS', 'ONE NIBBLE, ONE GLYPH');
      evs.push({ kind: 'milestone', label: 'SURGICAL DIFFS' });
    } else if (s.tier === 2 && s.judged >= 14) {
      s.tier = 3;
      fx.announce('STRIPPED BINARY', 'NO SYMBOLS — READ THE BYTES');
      evs.push({ kind: 'milestone', label: 'STRIPPED BINARY' });
    }
    deal();
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
      ctx.globalAlpha = 0.1;
      ctx.fillStyle = MID;
      ctx.fillRect(0, 0, W / 2, H);
      ctx.globalAlpha = 0.14;
      ctx.fillRect(W / 2, 0, W / 2, H);
      ctx.globalAlpha = 1;
      display(ctx, 24);
      ctx.fillStyle = GREEN;
      ctx.fillText('SAME  ←', 60, H - 60);
      ctx.fillStyle = OC;
      ctx.fillText('→  DRIFT', W - 176, H - 60);

      if (s.card) {
        const cw = 560;
        const ch = 96;
        const top = H / 2 - 88;
        ctx.fillStyle = BASE;
        ctx.fillRect(W / 2 - cw / 2, top, cw, ch);
        ctx.strokeStyle = s.feedback > 0 ? (s.feedbackGood ? GREEN : RED) : FR;
        ctx.lineWidth = 2;
        ctx.strokeRect(W / 2 - cw / 2, top, cw, ch);

        mono(ctx, 9);
        ctx.fillStyle = INK3;
        ctx.fillText('BUILD A', W / 2 - cw / 2 + 12, top + 20);
        ctx.fillText('BUILD B', W / 2 - cw / 2 + 12, top + 62);
        mono(ctx, 14);
        ctx.fillStyle = INK;
        ctx.fillText(s.card.a, W / 2 - cw / 2 + 76, top + 34);
        ctx.fillStyle = INK2;
        ctx.fillText(s.card.b, W / 2 - cw / 2 + 76, top + 76);

        const frac = Math.max(0, s.clock / s.clockMax);
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(W / 2 - cw / 2, top + ch + 8, cw, 3);
        ctx.fillStyle = frac < 0.3 ? RED : OC;
        ctx.fillRect(W / 2 - cw / 2, top + ch + 8, cw * frac, 3);
      }

      if (s.feedback > 0) {
        mono(ctx, 11);
        ctx.fillStyle = s.feedbackGood ? GREEN : RED;
        const msg = s.feedbackGood ? s.feedbackHint : '';
        if (msg) {
          const tw = ctx.measureText(msg).width;
          ctx.fillText(msg, W / 2 - tw / 2, H / 2 + 44);
        }
      }

      mono(ctx, 10);
      ctx.fillStyle = INK3;
      ctx.fillText('A DIFF TOOL THAT CRIES WOLF IS WORSE THAN NONE', W / 2 - 156, H - 20);
    },

    score: () => s.pts,
    hud: () =>
      `CAUGHT ${s.caught} · FALSE+ ${s.falsePos}${s.tier >= 3 ? ' · STRIPPED' : ''}`,
    events: () => evs,
    onRoundEnd: (): RoundStats => {
      const acc = s.judged > 0 ? Math.round(((s.judged - s.falsePos - s.missed) / s.judged) * 100) : 0;
      return {
        display: [
          { label: 'LINES JUDGED', value: String(s.judged) },
          { label: 'DRIFT CAUGHT', value: String(s.caught) },
          { label: 'FALSE POSITIVES', value: String(s.falsePos) },
          { label: 'ACCURACY', value: `${acc}%` },
        ],
        tallies: {
          judged: s.judged,
          caught: s.caught,
          falsePositives: s.falsePos,
          missed: s.missed,
          strippedCaught: s.strippedCaught,
          bestStreak: fx.combo.best,
        },
      };
    },
  };
}
