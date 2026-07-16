import {
  type Fx,
  W,
  H,
  INK,
  INK3,
  OC,
  OH,
  OF,
  GREEN,
  RED,
  BASE,
  SHADOW,
  mono,
} from '@/components/missions/sim/fx';
import type {
  Game,
  RoundStats,
  SimEvent,
} from '@/components/missions/sim/contract';

/*
  AEOS · KERNEL BOOT — commit each stage while the marker crosses the
  orange window. A miss is a kernel panic (stack-trace flash, score dent,
  never a run-ender). IRQs arrive mid-cycle demanding a quick tap in a
  smaller green window. After the eight boot stages the kernel enters
  userspace: scheduling real AEOS processes at a higher clock for double
  points. Dead-center commits chain into an OVERCLOCK multiplier.
*/

const BOOT_STAGES = [
  'EL2 → EL1, stack + BSS by hand',
  'MMU on: identity map',
  'buddy allocator + heap',
  'GICv2 + generic timer',
  'scheduler @ 100 Hz',
  'PSCI: 4 cores online',
  'virtio: GPU, input, net',
  'desktop composited, 30 FPS',
];
// Userspace beats mirror what AEOS actually runs (see lib/data/projects).
const USER_PROCS = [
  'ELF load → EL0',
  'spawn: shell (30 cmds)',
  'spawn: editor (vim keys)',
  'spawn: tetris',
  'compositor @ 30 FPS',
  'net: ARP answered',
  'net: ICMP echo',
  'timer tick @ 100 Hz',
];
const PANIC_TRACE = [
  'panic: sync exception EL1',
  'ESR_EL1 0x96000045 · FAR_EL1 0x0000dead',
  'x0 0x0 x1 0x4a20 lr 0xffff8000',
  '[ scheduler resumed ]',
];

export function kernelBoot(fx: Fx): Game {
  const evs: SimEvent[] = [];
  fx.combo.set({ window: 12, step: 3, maxMult: 3 });
  const s = {
    stage: 0,
    pos: 0,
    dir: 1,
    speed: 1.15,
    pts: 0,
    commits: 0,
    userCommits: 0,
    perfects: 0,
    panics: 0,
    userspace: false,
    panic: 0,
    ok: 0,
    irq: null as null | { pos: number; w: number; life: number },
    irqNext: 4.5,
    irqServiced: 0,
    irqDropped: 0,
    t: 0,
  };
  const winW = () =>
    Math.max(0.085, (s.userspace ? 0.2 : 0.24) - s.commits * 0.011);

  const commit = () => {
    const half = winW() / 2;
    const off = Math.abs(s.pos - 0.5);
    // an active IRQ window is a second valid target anywhere on the bar
    if (s.irq && Math.abs(s.pos - s.irq.pos) < s.irq.w / 2) {
      s.pts += 2;
      s.irqServiced += 1;
      s.irq = null;
      s.ok = 0.3;
      evs.push({ kind: 'hazard', label: 'IRQ SERVICED' });
      fx.text(W / 2, H - 96, 'IRQ SERVICED +2', { color: GREEN });
      return;
    }
    if (off < half) {
      const perfect = off < winW() / 6;
      if (perfect) {
        s.perfects += 1;
        fx.combo.add();
        evs.push({ kind: 'perfect', label: 'PERFECT' });
        fx.text(W / 2, H - 96, 'PERFECT', { color: OH, size: 15, big: true });
        fx.freeze(0.045);
      } else {
        const broken = fx.combo.break();
        if (broken >= 3) evs.push({ kind: 'combo-break', value: broken });
      }
      const mult = fx.combo.mult();
      const pts = (s.userspace ? 2 : 1) * mult;
      s.pts += pts;
      s.commits += 1;
      if (s.userspace) s.userCommits += 1;
      if (!perfect) fx.text(W / 2, H - 96, `+${pts}`, { color: OC });
      else if (mult > 1) fx.text(W / 2, H - 116, `OVERCLOCK ×${mult}`, { color: OH });
      s.ok = 0.3;
      s.speed = Math.min(2.4, s.speed + (s.userspace ? 0.11 : 0.08));
      fx.burst(W / 2, H - 65, { color: perfect ? OH : OC, n: perfect ? 12 : 6, speed: 150 });
      const wasBoot = !s.userspace;
      s.stage = (s.stage + 1) % 8;
      if (wasBoot && s.commits === 8) {
        s.userspace = true;
        s.stage = 0;
        s.speed += 0.15;
        fx.announce('USERSPACE', 'PROCESSES ×2 · CLOCK UP');
        evs.push({ kind: 'milestone', label: 'USERSPACE' });
      }
    } else {
      s.panic = 0.6;
      s.panics += 1;
      s.pts = Math.max(0, s.pts - 1);
      const broken = fx.combo.break();
      if (broken >= 3) evs.push({ kind: 'combo-break', value: broken });
      evs.push({ kind: 'hazard', label: 'KERNEL PANIC' });
      fx.shake(3.5);
      fx.freeze(0.05);
      fx.burst(W / 2, H - 65, { color: RED, n: 12, speed: 170 });
    }
  };

  return {
    update(dt, input) {
      s.t += dt;
      s.pos += s.dir * s.speed * dt;
      if (s.pos > 1) { s.pos = 1; s.dir = -1; }
      if (s.pos < 0) { s.pos = 0; s.dir = 1; }
      s.panic = Math.max(0, s.panic - dt);
      s.ok = Math.max(0, s.ok - dt);

      if (s.irq) {
        s.irq.life -= dt;
        if (s.irq.life <= 0) {
          s.irq = null;
          s.irqDropped += 1;
          s.pts = Math.max(0, s.pts - 1);
          evs.push({ kind: 'hazard', label: 'IRQ DROPPED' });
          fx.text(W / 2, H - 96, 'IRQ DROPPED −1', { color: RED });
        }
      } else if (s.t > 4) {
        s.irqNext -= dt;
        if (s.irqNext <= 0) {
          s.irqNext = 3 + Math.random() * 3;
          const side = Math.random() < 0.5;
          s.irq = { pos: side ? 0.12 + Math.random() * 0.2 : 0.68 + Math.random() * 0.2, w: 0.09, life: 1.7 };
        }
      }

      if (input.pressed.includes('Enter') || input.tap) commit();
    },

    draw(ctx) {
      ctx.fillStyle = SHADOW;
      ctx.fillRect(0, 0, W, H);
      const list = s.userspace ? USER_PROCS : BOOT_STAGES;
      mono(ctx, 13);
      for (let i = 0; i < list.length; i++) {
        const done = i < s.stage;
        ctx.fillStyle = i === s.stage ? INK : done ? GREEN : INK3;
        ctx.fillText(
          `${done ? '[ OK ]' : i === s.stage ? '[ .. ]' : '[    ]'}  ${list[i]}`,
          40,
          52 + i * 25,
        );
      }
      mono(ctx, 10);
      ctx.fillStyle = s.userspace ? OH : INK3;
      ctx.fillText(
        s.userspace ? 'PID 1 — SCHEDULING USERSPACE' : 'EL2 → DESKTOP, NO PANICS',
        40,
        H - 106,
      );

      // timing bar
      const bx = 40, bw = W - 80, by = H - 74;
      ctx.fillStyle = BASE;
      ctx.fillRect(bx, by, bw, 18);
      const ww = winW() * bw;
      ctx.fillStyle = s.panic > 0 ? RED : OF;
      ctx.globalAlpha = s.panic > 0 ? 0.7 : 1;
      ctx.fillRect(bx + bw / 2 - ww / 2, by, ww, 18);
      // dead-center tick: the OVERCLOCK line
      ctx.fillStyle = s.panic > 0 ? RED : OH;
      ctx.fillRect(bx + bw / 2 - 1, by - 2, 2, 22);
      ctx.globalAlpha = 1;
      if (s.irq) {
        const ix = bx + s.irq.pos * bw;
        const iw = s.irq.w * bw;
        ctx.globalAlpha = s.irq.life % 0.3 < 0.15 ? 0.95 : 0.55;
        ctx.fillStyle = GREEN;
        ctx.fillRect(ix - iw / 2, by, iw, 18);
        ctx.globalAlpha = 1;
        mono(ctx, 10);
        ctx.fillStyle = GREEN;
        ctx.fillText('IRQ', ix - 9, by - 6);
      }
      ctx.fillStyle = s.ok > 0 ? GREEN : INK;
      const mx = bx + s.pos * bw;
      ctx.fillRect(mx - 2, by - 5, 4, 28);
      mono(ctx, 11);
      ctx.fillStyle = INK3;
      ctx.fillText('COMMIT INSIDE THE WINDOW · DEAD CENTER CHAINS OVERCLOCK', bx, by + 40);

      // kernel panic flash: brief stack trace, then the scheduler resumes
      if (s.panic > 0) {
        ctx.globalAlpha = Math.min(0.9, s.panic * 2.2);
        ctx.fillStyle = SHADOW;
        ctx.fillRect(60, 96, W - 120, 118);
        ctx.strokeStyle = RED;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(60, 96, W - 120, 118);
        mono(ctx, 12);
        ctx.fillStyle = RED;
        for (let i = 0; i < PANIC_TRACE.length; i++) {
          ctx.fillText(PANIC_TRACE[i], 78, 124 + i * 24);
        }
        ctx.globalAlpha = 1;
      }
    },

    score: () => s.pts,
    hud: () =>
      `STAGES ${s.commits} · CLOCK ×${s.speed.toFixed(2)} · OC ×${fx.combo.mult()}`,
    events: () => evs,
    onRoundEnd: (): RoundStats => ({
      display: [
        { label: 'STAGES COMMITTED', value: String(s.commits) },
        { label: 'PERFECT COMMITS', value: String(s.perfects) },
        { label: 'IRQS SERVICED', value: String(s.irqServiced) },
        { label: 'KERNEL PANICS', value: String(s.panics) },
      ],
      tallies: {
        commits: s.commits,
        userCommits: s.userCommits,
        perfects: s.perfects,
        bestChain: fx.combo.best,
        panics: s.panics,
        irqServiced: s.irqServiced,
        irqDropped: s.irqDropped,
      },
    }),
  };
}
