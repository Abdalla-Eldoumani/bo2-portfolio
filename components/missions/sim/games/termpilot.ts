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
  TERMPILOT · WAIT FOR — you are the predicate. A live terminal scrolls;
  the brief posts a wait_for pattern; strike the instant a matching line
  appears and let the lookalikes bait someone else. Six catches in, the
  predicate rotates. Ten in, a second session opens and you are watching
  two screens at once — welcome to MAX_SESSIONS.
*/

type Target = {
  label: string; // shown in the wait_for chip
  match: string; // the exact line body that counts
  bait: string[]; // near-misses that do not count
  noise: string[]; // filler output
};

const TARGETS: Target[] = [
  {
    label: 'error\\[E\\d+\\]',
    match: 'error[E502]: borrow does not live long enough',
    bait: ['error(E502): legacy formatter', 'Error[X502]: vendor shim', 'warning[W502]: unused import'],
    noise: ['Compiling core v1.2.0', 'Checking deps 42/97', 'Finished dev profile', 'Downloaded 3 crates'],
  },
  {
    label: 'login:',
    match: 'buildroot login:',
    bait: ['last login: tue 09:14', 'logind: session opened', 'plugin: loaded'],
    noise: ['[ OK ] Started Network Service', '[ OK ] Reached target Multi-User', 'Starting kernel ...', 'EXT4-fs mounted filesystem'],
  },
  {
    label: 'panic:',
    match: 'kernel panic: not syncing',
    bait: ['panics: 0 recorded', 'no panic detected', 'mechanic: torque ok'],
    noise: ['irq 11: handled', 'sched: tick 4096', 'mm: page pool grown', 'net: eth0 up'],
  },
  {
    label: 'PASSED',
    match: 'test result: PASSED 118/118',
    bait: ['test result: PASSED? pending', 'BYPASSED stage 3', 'test result: FAILED 117/118'],
    noise: ['running 118 tests', 'test io::read ... ok', 'test fmt::parse ... ok', 'doc-tests compiling'],
  },
];

type Line = {
  text: string;
  kind: 'noise' | 'bait' | 'target';
  y: number;
  live: boolean;
  pane: number;
};

const LINES = 26;

export function waitFor(fx: Fx, veteran = false): Game {
  const evs: SimEvent[] = [];
  fx.combo.set({ window: 5, step: 3, maxMult: 3 });

  const lines: Line[] = Array.from({ length: LINES }, () => ({
    text: '',
    kind: 'noise',
    y: 0,
    live: false,
    pane: 0,
  }));

  const s = {
    target: TARGETS[0],
    targetIdx: 0,
    pts: 0,
    caught: 0,
    missed: 0,
    falseTriggers: 0,
    paneCatches: 0,
    panes: 1,
    spawnT: 0.4,
    nextTargetT: 2 + Math.random() * 2,
    scroll: (veteran ? 66 : 52), // px per second upward
    flash: 0,
    flashGood: true,
  };

  const rand = (n: number) => Math.floor(Math.random() * n);
  const pick = <T,>(xs: T[]) => xs[rand(xs.length)];

  const spawn = (kind: Line['kind']) => {
    const slot = lines.find((l) => !l.live);
    if (!slot) return;
    slot.kind = kind;
    slot.text =
      kind === 'target' ? s.target.match
      : kind === 'bait' ? pick(s.target.bait)
      : pick(s.target.noise);
    slot.y = H - 66;
    slot.live = true;
    slot.pane = s.panes === 2 ? rand(2) : 0;
  };

  const paneX = (pane: number) => (s.panes === 2 ? (pane === 0 ? 24 : W / 2 + 12) : 34);
  const paneW = () => (s.panes === 2 ? W / 2 - 36 : W - 68);

  const strike = (pane: number) => {
    const onScreen = lines.find(
      (l) => l.live && l.kind === 'target' && l.pane === pane && l.y > 46 && l.y < H - 60,
    );
    s.flash = 0.3;
    if (onScreen) {
      onScreen.live = false;
      s.caught += 1;
      if (s.panes === 2) s.paneCatches += 1;
      const gained = 2 * fx.combo.mult();
      s.pts += gained;
      fx.combo.add();
      s.flashGood = true;
      fx.freeze();
      fx.text(paneX(pane) + paneW() / 2, onScreen.y - 10, `CAUGHT +${gained}`, { color: GREEN });
      fx.burst(paneX(pane) + paneW() / 2, onScreen.y, { color: GREEN, n: 9, speed: 130 });
      if (onScreen.y > H - 130) evs.push({ kind: 'perfect', label: 'INSTANT MATCH' });
      // predicate rotation and the second session
      if (s.caught === 6 || s.caught === 14) {
        s.targetIdx = (s.targetIdx + 1) % TARGETS.length;
        s.target = TARGETS[s.targetIdx];
        fx.announce('NEW PREDICATE', `wait_for: ${s.target.label}`);
        evs.push({ kind: 'milestone', label: 'NEW PREDICATE' });
      }
      if (s.caught === 10 && s.panes === 1) {
        s.panes = 2;
        fx.announce('SECOND SESSION', '← LEFT PANE · RIGHT PANE →');
        evs.push({ kind: 'milestone', label: 'MAX_SESSIONS' });
      }
    } else {
      s.falseTriggers += 1;
      s.pts = Math.max(0, s.pts - 1);
      const broken = fx.combo.break();
      if (broken >= 3) evs.push({ kind: 'combo-break', value: broken });
      fx.shake(2);
      s.flashGood = false;
      fx.text(paneX(pane) + paneW() / 2, H / 2, 'FALSE TRIGGER −1', { color: RED });
      evs.push({ kind: 'hazard', label: 'FALSE TRIGGER' });
    }
  };

  return {
    update(dt, input) {
      s.flash = Math.max(0, s.flash - dt);
      s.scroll = (veteran ? 66 : 52) + s.caught * 2.2;

      // stream
      s.spawnT -= dt;
      if (s.spawnT <= 0) {
        s.spawnT = 0.5 - Math.min(0.24, s.caught * 0.012);
        const roll = Math.random();
        const baitChance = veteran ? 0.3 : 0.2;
        spawn(roll < baitChance ? 'bait' : 'noise');
      }
      s.nextTargetT -= dt;
      if (s.nextTargetT <= 0) {
        s.nextTargetT = 2.2 + Math.random() * 2.4;
        spawn('target');
      }

      for (const l of lines) {
        if (!l.live) continue;
        l.y -= s.scroll * dt;
        if (l.y < 46) {
          if (l.kind === 'target') {
            s.missed += 1;
            const broken = fx.combo.break();
            if (broken >= 3) evs.push({ kind: 'combo-break', value: broken });
            fx.text(paneX(l.pane) + paneW() / 2, 60, 'SCROLLED OFF', { color: RED });
            evs.push({ kind: 'hazard', label: 'MISSED MATCH' });
          }
          l.live = false;
        }
      }

      if (s.panes === 1) {
        if (input.pressed.includes('Enter') || input.tap) strike(0);
      } else {
        if (input.pressed.includes('ArrowLeft')) strike(0);
        if (input.pressed.includes('ArrowRight')) strike(1);
        if (input.pressed.includes('Enter')) strike(0);
        if (input.tap) strike(input.tap.x < W / 2 ? 0 : 1);
      }
    },

    draw(ctx) {
      ctx.fillStyle = SHADOW;
      ctx.fillRect(0, 0, W, H);

      // the wait_for chip
      mono(ctx, 12);
      ctx.fillStyle = BASE;
      ctx.fillRect(W / 2 - 150, 8, 300, 24);
      ctx.strokeStyle = s.flash > 0 ? (s.flashGood ? GREEN : RED) : FR;
      ctx.strokeRect(W / 2 - 150, 8, 300, 24);
      ctx.fillStyle = TEAL;
      ctx.fillText('wait_for:', W / 2 - 140, 24);
      ctx.fillStyle = INK;
      ctx.fillText(s.target.label, W / 2 - 66, 24);

      // pane frames
      for (let p = 0; p < s.panes; p++) {
        ctx.strokeStyle = 'rgba(255,255,255,0.14)';
        ctx.strokeRect(paneX(p) - 8, 42, paneW() + 16, H - 100);
        mono(ctx, 9);
        ctx.fillStyle = INK3;
        ctx.fillText(s.panes === 2 ? `session ${p} ${p === 0 ? '(←)' : '(→)'}` : 'session 0 — pty', paneX(p), H - 48);
      }

      // scrolling lines
      mono(ctx, veteran ? 11 : 12);
      for (const l of lines) {
        if (!l.live) continue;
        const alpha = Math.min(1, (l.y - 40) / 30, (H - 66 - l.y) / 20 + 1);
        ctx.globalAlpha = Math.max(0.15, alpha);
        ctx.fillStyle =
          l.kind === 'target' ? OH : l.kind === 'bait' ? INK2 : INK3;
        const maxW = paneW();
        let text = l.text;
        while (ctx.measureText(text).width > maxW && text.length > 4) {
          text = text.slice(0, -2);
        }
        ctx.fillText(text, paneX(l.pane), l.y);
        ctx.globalAlpha = 1;
      }

      display(ctx, 15);
      ctx.fillStyle = OC;
      ctx.fillText(
        s.panes === 2 ? '← STRIKE LEFT · STRIKE RIGHT →' : '↵ / TAP — STRIKE ON MATCH',
        W / 2 - (s.panes === 2 ? 128 : 104),
        H - 24,
      );
    },

    score: () => s.pts,
    hud: () =>
      `CAUGHT ${s.caught} · FALSE ${s.falseTriggers}${s.panes === 2 ? ' · 2 SESSIONS' : ''}`,
    events: () => evs,
    onRoundEnd: (): RoundStats => ({
      display: [
        { label: 'MATCHES CAUGHT', value: String(s.caught) },
        { label: 'SCROLLED OFF', value: String(s.missed) },
        { label: 'FALSE TRIGGERS', value: String(s.falseTriggers) },
        { label: 'DUAL-PANE CATCHES', value: String(s.paneCatches) },
      ],
      tallies: {
        caught: s.caught,
        missed: s.missed,
        falseTriggers: s.falseTriggers,
        paneCatches: s.paneCatches,
        bestStreak: fx.combo.best,
      },
    }),
  };
}
