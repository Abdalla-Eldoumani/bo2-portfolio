import {
  type Fx,
  W,
  H,
  INK,
  INK2,
  INK3,
  OC,
  OH,
  OF,
  GREEN,
  RED,
  SHADOW,
  mono,
} from '@/components/missions/sim/fx';
import type {
  Game,
  RoundStats,
  SimEvent,
} from '@/components/missions/sim/contract';

/*
  AARCH64 · SINGLE STEP — retire each instruction as it crosses the
  execute slot. Branches reverse the fetch direction on retire (the
  survivors mirror to the new incoming side). A load makes its dependent
  use stall one beat: retiring it too early flushes, waiting scores an
  INTERLOCK. A long enough chain widens the machine to dual issue: two
  lanes, alternating slots, double points, one button.
*/

type Instr = {
  x: number;
  lane: 0 | 1;
  text: string;
  kind: 'op' | 'branch' | 'load' | 'use';
  stall: number; // use only: time until safe to retire
  linked: boolean; // use only: its load has retired (stall running)
};

const OPS = [
  'ADD X0, X0, #1',
  'SUBS X2, X2, #4',
  'STR X0, [X19]',
  'MOV X8, #93',
  'ORR X3, X3, X4',
  'LSL X5, X5, #2',
  'AND X6, X6, #0xff',
];
const BRANCHES = ['B loop', 'CBZ X2, done', 'B.NE retry'];
const LOADS = ['LDR X1, [SP]', 'LDR X7, [X19, #8]'];
const USES = ['ADD X0, X1, #4', 'SUBS X4, X7, #1'];

const SLOT_X = W / 2;
const TOL = 34;

export function singleStep(fx: Fx): Game {
  const evs: SimEvent[] = [];
  fx.combo.set({ window: 10, step: 4, maxMult: 2 });
  const s = {
    items: [] as Instr[],
    next: 0.4,
    pts: 0,
    retired: 0,
    interlocks: 0,
    branches: 0,
    flushes: 0,
    dir: 1 as 1 | -1, // 1: instructions flow right → left
    dual: false,
    dualLane: 0 as 0 | 1,
    pairPending: false, // a load/use pair is in flight
    flush: 0,
    stallFlash: 0,
    pc: 0x4000,
    regs: [0, 0, 0, 0],
    t: 0,
  };

  const laneY = (lane: 0 | 1) => (s.dual ? (lane === 0 ? H / 2 - 52 : H / 2 + 40) : H / 2);

  const spawn = () => {
    const lane: 0 | 1 = s.dual ? s.dualLane : 0;
    if (s.dual) s.dualLane = s.dualLane === 0 ? 1 : 0;
    const x = s.dir === 1 ? W + 40 : -40;
    const r = Math.random();
    if (!s.pairPending && r < 0.22) {
      // load-use dependent pair enters back to back on one lane
      s.pairPending = true;
      const li = Math.floor(Math.random() * LOADS.length);
      s.items.push({ x, lane, text: LOADS[li], kind: 'load', stall: 0, linked: false });
      s.items.push({
        x: x + s.dir * 120,
        lane,
        text: USES[li],
        kind: 'use',
        stall: 0,
        linked: false,
      });
    } else if (r < 0.36) {
      s.items.push({
        x,
        lane,
        text: BRANCHES[Math.floor(Math.random() * BRANCHES.length)],
        kind: 'branch',
        stall: 0,
        linked: false,
      });
    } else {
      s.items.push({
        x,
        lane,
        text: OPS[Math.floor(Math.random() * OPS.length)],
        kind: 'op',
        stall: 0,
        linked: false,
      });
    }
  };

  // full flush: the load-use lesson. Wipes the pipeline and drops dual issue.
  const doFlush = (label: string) => {
    s.flushes += 1;
    s.flush = 0.5;
    s.items.length = 0;
    s.pairPending = false;
    const broken = fx.combo.break();
    if (broken >= 3) evs.push({ kind: 'combo-break', value: broken });
    evs.push({ kind: 'hazard', label });
    fx.shake(3.5);
    fx.freeze(0.055);
    fx.burst(SLOT_X, laneY(0), { color: RED, n: 14, speed: 190 });
    if (s.dual) {
      s.dual = false;
      fx.announce('ISSUE WIDTH 1', 'PIPELINE REBUILDING');
    }
  };

  // soft miss: a beat of stall, the chain breaks, the stream keeps flowing.
  const miss = (label: string) => {
    s.flush = 0.35;
    const broken = fx.combo.break();
    if (broken >= 3) evs.push({ kind: 'combo-break', value: broken });
    evs.push({ kind: 'hazard', label });
    fx.shake(2);
    fx.text(SLOT_X, laneY(0) - 44, label, { color: RED });
  };

  const retire = (it: Instr, idx: number) => {
    s.items.splice(idx, 1);
    const dual = s.dual ? 2 : 1;
    let pts = 1 * dual;
    if (it.kind === 'use' && it.linked) {
      pts = 2 * dual;
      s.interlocks += 1;
      evs.push({ kind: 'perfect', label: 'INTERLOCK' });
      fx.text(SLOT_X, laneY(it.lane) - 34, 'INTERLOCK +2', { color: OH, size: 14, big: true });
      fx.freeze(0.045);
      s.pairPending = false;
    } else if (it.kind === 'use') {
      s.pairPending = false;
    }
    s.pts += pts;
    s.retired += 1;
    s.pc += 4;
    s.regs[s.retired % 4] += Math.floor(1 + Math.random() * 9);
    fx.combo.add();
    fx.burst(SLOT_X, laneY(it.lane), { color: OC, n: 6, speed: 110 });
    if (it.kind !== 'use' || !it.linked) {
      fx.text(SLOT_X + 26, laneY(it.lane) - 22, `+${pts}`, { color: OC });
    }
    if (it.kind === 'load') {
      // the dependent use begins its one-beat stall
      const use = s.items.find((c) => c.kind === 'use');
      if (use) { use.linked = true; use.stall = 0.62; }
    }
    if (it.kind === 'branch') {
      s.branches += 1;
      s.dir = s.dir === 1 ? -1 : 1;
      // survivors mirror across the slot: fetch now streams the other way
      for (const c of s.items) c.x = 2 * SLOT_X - c.x;
      evs.push({ kind: 'milestone', label: 'BRANCH' });
      fx.text(SLOT_X, 64, 'BRANCH TAKEN — FETCH REVERSED', { color: OH });
    }
    if (!s.dual && fx.combo.n >= 10) {
      s.dual = true;
      fx.announce('DUAL ISSUE', 'TWO LANES · POINTS ×2');
      evs.push({ kind: 'milestone', label: 'DUAL ISSUE' });
    }
  };

  return {
    update(dt, input) {
      s.t += dt;
      const speed = (120 + Math.min(s.retired * 5, 130)) * (s.dual ? 0.92 : 1);
      s.next -= dt;
      if (s.next <= 0) {
        s.next = Math.max(0.62, 1.1 - s.retired * 0.015) * (s.dual ? 0.62 : 1);
        spawn();
      }
      for (const it of s.items) {
        it.x -= s.dir * speed * dt;
        if (it.stall > 0) it.stall = Math.max(0, it.stall - dt);
      }
      s.flush = Math.max(0, s.flush - dt);
      s.stallFlash = Math.max(0, s.stallFlash - dt);

      if ((input.pressed.includes('Enter') || input.tap) && s.flush <= 0) {
        // nearest in-slot head across active lanes
        let hit = -1;
        let best = TOL + 1;
        for (let i = 0; i < s.items.length; i++) {
          const d = Math.abs(s.items[i].x - SLOT_X);
          if (d < best) { best = d; hit = i; }
        }
        if (hit >= 0 && best <= TOL) {
          const it = s.items[hit];
          if (it.kind === 'use' && it.linked && it.stall > 0) {
            s.stallFlash = 0.3;
            doFlush('LOAD-USE HAZARD');
          } else {
            retire(it, hit);
          }
        } else {
          miss('EARLY RETIRE');
        }
      }

      // an instruction that drifts past the slot un-retired is a lost beat
      for (let i = s.items.length - 1; i >= 0; i--) {
        const it = s.items[i];
        const past = s.dir === 1 ? it.x < SLOT_X - TOL - 6 : it.x > SLOT_X + TOL + 6;
        if (past) {
          if (it.kind === 'use') s.pairPending = false;
          s.items.splice(i, 1);
          miss('RETIRE MISSED');
        }
      }
    },

    draw(ctx) {
      ctx.fillStyle = SHADOW;
      ctx.fillRect(0, 0, W, H);

      const lanes: (0 | 1)[] = s.dual ? [0, 1] : [0];
      for (const lane of lanes) {
        const y = laneY(lane);
        ctx.strokeStyle = 'rgba(255,255,255,0.09)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(20, y + 14);
        ctx.lineTo(W - 20, y + 14);
        ctx.stroke();
        ctx.strokeStyle = s.flush > 0 ? RED : OF;
        ctx.lineWidth = 2;
        ctx.strokeRect(SLOT_X - 36, y - 26, 72, 52);
      }
      mono(ctx, 10);
      ctx.fillStyle = INK3;
      ctx.fillText('EXECUTE', SLOT_X - 22, laneY(0) - 34);
      // fetch direction indicator
      ctx.fillStyle = OH;
      ctx.fillText(s.dir === 1 ? 'FETCH →→ RETIRE' : 'RETIRE ←← FETCH', W - 160, 46);

      // hazard tether between a load and its use
      const load = s.items.find((c) => c.kind === 'load');
      const use = s.items.find((c) => c.kind === 'use');
      if (load && use) {
        ctx.strokeStyle = OH;
        ctx.globalAlpha = 0.5;
        ctx.setLineDash([3, 4]);
        ctx.beginPath();
        ctx.moveTo(load.x, laneY(load.lane) + 10);
        ctx.lineTo(use.x, laneY(use.lane) + 10);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
      }

      mono(ctx, 14);
      for (const it of s.items) {
        const y = laneY(it.lane);
        const inSlot = Math.abs(it.x - SLOT_X) < TOL;
        const stalled = it.kind === 'use' && it.linked && it.stall > 0;
        ctx.fillStyle = stalled ? RED : inSlot ? OC : it.kind === 'branch' ? OH : INK2;
        const tw = ctx.measureText(it.text).width;
        ctx.fillText(it.text, it.x - tw / 2, y + 5);
        if (stalled) {
          mono(ctx, 9);
          ctx.fillStyle = RED;
          ctx.fillText('STALL', it.x - 14, y - 16);
          mono(ctx, 14);
        } else if (it.kind === 'use' && it.linked) {
          mono(ctx, 9);
          ctx.fillStyle = GREEN;
          ctx.fillText('READY', it.x - 16, y - 16);
          mono(ctx, 14);
        }
      }

      mono(ctx, 13);
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = INK3;
        ctx.fillText(`X${i}`, 48 + i * 160, H - 40);
        ctx.fillStyle = INK;
        ctx.fillText(`0x${s.regs[i].toString(16).padStart(4, '0')}`, 84 + i * 160, H - 40);
      }
      mono(ctx, 12);
      ctx.fillStyle = INK3;
      ctx.fillText(`PC 0x${s.pc.toString(16)}`, 48, 46);
      if (s.stallFlash > 0) {
        ctx.fillStyle = RED;
        ctx.fillText('LOAD-USE HAZARD — FLUSH', SLOT_X - 80, 46);
      }
    },

    score: () => s.pts,
    hud: () => `RETIRED ${s.retired} · CHAIN ${fx.combo.n}${s.dual ? ' · DUAL ×2' : ''}`,
    events: () => evs,
    onRoundEnd: (): RoundStats => ({
      display: [
        { label: 'INSTRUCTIONS RETIRED', value: String(s.retired) },
        { label: 'INTERLOCKS', value: String(s.interlocks) },
        { label: 'BRANCHES TAKEN', value: String(s.branches) },
        { label: 'PIPELINE FLUSHES', value: String(s.flushes) },
      ],
      tallies: {
        retired: s.retired,
        interlocks: s.interlocks,
        branches: s.branches,
        flushes: s.flushes,
        bestChain: fx.combo.best,
      },
    }),
  };
}
