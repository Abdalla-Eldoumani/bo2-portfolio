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
  QEMU MCP SERVER · SNAPSHOT — fleet triage over QMP. Every VM grinds a
  task for points, and every VM will eventually glitch, then crash, then
  reboot from zero. Snapshots are your save states: take them clean and
  a rollback restores the work; take one mid-glitch and the image is
  corrupted — restoring it just crashes the guest again. Watch the
  telegraph, keep the images clean, keep the fleet earning.
*/

type VmState = 'running' | 'glitch' | 'crashed' | 'reboot';

type Vm = {
  name: string;
  arch: string;
  state: VmState;
  progress: number; // 0..1 task progress
  stateT: number; // time left in glitch/crashed/reboot
  glitchT: number; // countdown to next glitch
  snap: number | null; // snapshotted progress
  snapDirty: boolean; // taken during a glitch
  graceT: number; // rollback grace after a crash
};

const NAMES = ['vm0', 'vm1', 'vm2', 'vm3'];
const ARCHES = ['aarch64', 'x86_64', 'aarch64', 'x86_64'];

export function snapshot(fx: Fx): Game {
  const evs: SimEvent[] = [];
  fx.combo.set({ window: 6, step: 2, maxMult: 3 });

  const newVm = (i: number): Vm => ({
    name: NAMES[i],
    arch: ARCHES[i],
    state: 'running',
    progress: 0,
    stateT: 0,
    glitchT: 2.5 + Math.random() * 4,
    snap: null,
    snapDirty: false,
    graceT: 0,
  });

  const s = {
    vms: [newVm(0), newVm(1), newVm(2)],
    sel: 0,
    pts: 0,
    tasks: 0,
    snapshots: 0,
    restores: 0,
    preemptive: 0,
    corrupted: 0,
    crashesLost: 0,
    t: 0,
  };

  const panelW = () => Math.min(210, (W - 60) / s.vms.length - 14);
  const panelX = (i: number) => {
    const w = panelW();
    const total = s.vms.length * (w + 14) - 14;
    return (W - total) / 2 + i * (w + 14);
  };
  const PANEL_Y = 74;
  const PANEL_H = 210;

  const takeSnapshot = (vm: Vm) => {
    if (vm.state === 'crashed' || vm.state === 'reboot') return;
    vm.snap = vm.progress;
    vm.snapDirty = vm.state === 'glitch';
    s.snapshots += 1;
    const x = panelX(s.vms.indexOf(vm)) + panelW() / 2;
    fx.text(x, PANEL_Y + 58, vm.snapDirty ? 'SNAP (NOISY…)' : 'SNAPSHOT SAVED', {
      color: vm.snapDirty ? OH : TEAL,
    });
    fx.burst(x, PANEL_Y + 70, { color: TEAL, n: 6, speed: 90 });
  };

  const rollback = (vm: Vm) => {
    const x = panelX(s.vms.indexOf(vm)) + panelW() / 2;
    if (vm.snap === null) {
      fx.text(x, PANEL_Y + 58, 'NO IMAGE', { color: INK3, size: 10 });
      return;
    }
    if (vm.snapDirty) {
      // restoring a corrupted image crashes the guest all over again
      s.corrupted += 1;
      vm.snap = null;
      vm.snapDirty = false;
      crash(vm, true);
      fx.text(x, PANEL_Y + 58, 'CORRUPTED IMAGE', { color: RED });
      evs.push({ kind: 'hazard', label: 'CORRUPTED IMAGE' });
      return;
    }
    const wasGlitch = vm.state === 'glitch';
    const wasGrace = vm.state === 'crashed' && vm.graceT > 0;
    if (!wasGlitch && !wasGrace) {
      fx.text(x, PANEL_Y + 58, 'GUEST IS CLEAN', { color: INK3, size: 10 });
      return;
    }
    vm.state = 'running';
    vm.stateT = 0;
    vm.progress = vm.snap;
    vm.glitchT = 3 + Math.random() * 4;
    s.restores += 1;
    s.pts += 2;
    fx.combo.add();
    fx.freeze();
    fx.burst(x, PANEL_Y + 90, { color: GREEN, n: 10, speed: 130 });
    if (wasGlitch) {
      s.preemptive += 1;
      fx.text(x, PANEL_Y + 58, 'PREEMPTIVE RESTORE +2', { color: OH });
      evs.push({ kind: 'perfect', label: 'PREEMPTIVE' });
    } else {
      fx.text(x, PANEL_Y + 58, 'RESTORED +2', { color: GREEN });
      evs.push({ kind: 'streak', label: 'RESTORED', value: s.restores });
    }
  };

  const crash = (vm: Vm, fromRollback: boolean) => {
    vm.state = 'crashed';
    vm.stateT = 1.6;
    vm.graceT = fromRollback ? 0 : 1.4;
    if (!fromRollback && vm.progress > 0.25) {
      s.crashesLost += 1;
      const broken = fx.combo.break();
      if (broken >= 2) evs.push({ kind: 'combo-break', value: broken });
    }
    vm.progress = 0;
    fx.shake(3);
    const x = panelX(s.vms.indexOf(vm)) + panelW() / 2;
    fx.burst(x, PANEL_Y + 100, { color: RED, n: 12, speed: 150 });
  };

  const actOn = (i: number, isSnapshot: boolean) => {
    s.sel = i;
    const vm = s.vms[i];
    if (!vm) return;
    if (isSnapshot) takeSnapshot(vm);
    else rollback(vm);
  };

  return {
    update(dt, input) {
      s.t += dt;

      // fleet grows once the triage is proven
      if (s.vms.length === 3 && s.tasks >= 6) {
        s.vms.push(newVm(3));
        fx.announce('MAX_VMS RAISED', 'A FOURTH GUEST JOINS THE FLEET');
        evs.push({ kind: 'milestone', label: 'MAX_VMS RAISED' });
      }

      const taskRate = 1 / Math.max(2.6, 4.2 - s.tasks * 0.12);
      for (const vm of s.vms) {
        vm.graceT = Math.max(0, vm.graceT - dt);
        if (vm.state === 'running') {
          vm.progress += taskRate * dt;
          if (vm.progress >= 1) {
            vm.progress = 0;
            vm.snap = null;
            vm.snapDirty = false;
            s.tasks += 1;
            const gained = 3 * fx.combo.mult();
            s.pts += gained;
            fx.combo.add();
            const x = panelX(s.vms.indexOf(vm)) + panelW() / 2;
            fx.text(x, PANEL_Y + 34, `TASK DONE +${gained}`, { color: OC });
            fx.burst(x, PANEL_Y + 46, { color: OC, n: 9, speed: 120 });
          }
          vm.glitchT -= dt;
          if (vm.glitchT <= 0) {
            vm.state = 'glitch';
            vm.stateT = 1.4;
            evs.push({ kind: 'hazard', label: 'GLITCH' });
          }
        } else if (vm.state === 'glitch') {
          vm.stateT -= dt;
          vm.progress += taskRate * 0.4 * dt;
          if (vm.stateT <= 0) crash(vm, false);
        } else if (vm.state === 'crashed') {
          vm.stateT -= dt;
          if (vm.stateT <= 0) {
            vm.state = 'reboot';
            vm.stateT = 1.2;
          }
        } else {
          vm.stateT -= dt;
          if (vm.stateT <= 0) {
            vm.state = 'running';
            vm.glitchT = 3 + Math.random() * 4;
          }
        }
      }

      if (input.pressed.includes('ArrowLeft')) s.sel = (s.sel + s.vms.length - 1) % s.vms.length;
      if (input.pressed.includes('ArrowRight')) s.sel = (s.sel + 1) % s.vms.length;
      if (input.pressed.includes('Enter')) actOn(s.sel, true);
      if (input.pressed.includes('ArrowDown')) actOn(s.sel, false);
      if (input.tap) {
        for (let i = 0; i < s.vms.length; i++) {
          const x = panelX(i);
          if (input.tap.x >= x && input.tap.x <= x + panelW()) {
            actOn(i, input.tap.y < PANEL_Y + PANEL_H / 2);
          }
        }
      }
    },

    draw(ctx) {
      ctx.fillStyle = SHADOW;
      ctx.fillRect(0, 0, W, H);
      mono(ctx, 9);
      ctx.fillStyle = INK3;
      ctx.fillText('QMP SOCKET LIVE — SNAPSHOT CLEAN, ROLL BACK THE CRASHES', 16, 52);

      s.vms.forEach((vm, i) => {
        const x = panelX(i);
        const w = panelW();
        const sel = i === s.sel;
        const glitchJit =
          vm.state === 'glitch' ? (Math.random() - 0.5) * 3 : 0;

        ctx.fillStyle = BASE;
        ctx.fillRect(x + glitchJit, PANEL_Y, w, PANEL_H);
        ctx.strokeStyle =
          vm.state === 'crashed' ? RED : sel ? OH : 'rgba(255,255,255,0.18)';
        ctx.lineWidth = sel ? 2.5 : 1.5;
        ctx.strokeRect(x + glitchJit, PANEL_Y, w, PANEL_H);

        mono(ctx, 11);
        ctx.fillStyle = INK;
        ctx.fillText(vm.name, x + 10, PANEL_Y + 20);
        ctx.fillStyle = INK3;
        ctx.fillText(vm.arch, x + 52, PANEL_Y + 20);

        // state line
        const stateColor =
          vm.state === 'running' ? GREEN
          : vm.state === 'glitch' ? OH
          : vm.state === 'crashed' ? RED
          : INK3;
        ctx.fillStyle = stateColor;
        ctx.fillText(
          vm.state === 'running' ? '● RUNNING'
          : vm.state === 'glitch' ? '▲ GLITCHING'
          : vm.state === 'crashed' ? (vm.graceT > 0 ? '✕ CRASHED — ROLL BACK!' : '✕ CRASHED')
          : '… REBOOT',
          x + 10,
          PANEL_Y + 42,
        );

        // task progress (transform-free fill, drawn not animated)
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(x + 10, PANEL_Y + 58, w - 20, 8);
        ctx.fillStyle = vm.state === 'glitch' ? OH : OC;
        ctx.fillRect(x + 10, PANEL_Y + 58, (w - 20) * vm.progress, 8);
        mono(ctx, 9);
        ctx.fillStyle = INK2;
        ctx.fillText(`task ${Math.round(vm.progress * 100)}%`, x + 10, PANEL_Y + 80);

        // snapshot chip
        if (vm.snap !== null) {
          ctx.fillStyle = vm.snapDirty ? RED : TEAL;
          ctx.fillRect(x + 10, PANEL_Y + 92, 8, 8);
          ctx.fillStyle = vm.snapDirty ? RED : INK2;
          ctx.fillText(
            `SNAP @ ${Math.round(vm.snap * 100)}%${vm.snapDirty ? ' DIRTY' : ''}`,
            x + 24,
            PANEL_Y + 100,
          );
        } else {
          ctx.fillStyle = INK3;
          ctx.fillText('NO SNAPSHOT', x + 10, PANEL_Y + 100);
        }

        // console noise for flavor; screams when glitching
        mono(ctx, 8);
        for (let line = 0; line < 5; line++) {
          const yy = PANEL_Y + 122 + line * 13;
          ctx.fillStyle = vm.state === 'glitch' && Math.random() < 0.4 ? OH : INK3;
          ctx.globalAlpha = 0.55;
          const txt =
            vm.state === 'crashed'
              ? line === 2 ? '*** PANIC ***' : ''
              : `[${(s.t + line * 7.3).toFixed(2)}] ${vm.state === 'glitch' ? '?!##' : 'ok'} ${vm.name}.${line}`;
          ctx.fillText(txt, x + 10, yy);
          ctx.globalAlpha = 1;
        }

        // action legend on the selected panel
        if (sel) {
          mono(ctx, 8);
          ctx.fillStyle = FR;
          ctx.fillText('↵ SNAPSHOT · ↓ ROLLBACK', x + 10, PANEL_Y + PANEL_H - 8);
        }
      });

      display(ctx, 15);
      ctx.fillStyle = INK2;
      ctx.fillText(`TASKS SHIPPED ${s.tasks}`, 16, H - 16);
      mono(ctx, 9);
      ctx.fillStyle = INK3;
      ctx.fillText('TAP TOP OF A GUEST — SNAPSHOT · TAP BOTTOM — ROLLBACK', W - 340, H - 14);
    },

    score: () => s.pts,
    hud: () =>
      `TASKS ${s.tasks} · RESTORES ${s.restores} · CORRUPTED ${s.corrupted}`,
    events: () => evs,
    onRoundEnd: (): RoundStats => ({
      display: [
        { label: 'TASKS SHIPPED', value: String(s.tasks) },
        { label: 'CLEAN RESTORES', value: String(s.restores) },
        { label: 'PREEMPTIVE', value: String(s.preemptive) },
        { label: 'CORRUPTED IMAGES', value: String(s.corrupted) },
      ],
      tallies: {
        tasks: s.tasks,
        snapshots: s.snapshots,
        restores: s.restores,
        preemptive: s.preemptive,
        corrupted: s.corrupted,
        crashesLost: s.crashesLost,
        bestStreak: fx.combo.best,
      },
    }),
  };
}
