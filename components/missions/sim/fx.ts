/*
  Game-feel toolkit for the field sims: particle pool, hit-stop, camera
  shake, floating combat text, a shared combo meter and the announcer
  strip. One Fx instance lives per round — the harness creates it, hands
  it to the game factory, and owns the update/draw order. Games call in
  at their action sites and never touch the DOM. Pools are pre-allocated
  (no per-frame allocation in hot loops) and everything decorative damps
  to near-still under prefers-reduced-motion.
*/

export const W = 720;
export const H = 380;

// Palette — mirrors the @theme tokens in app/globals.css. Teal is legal
// here because the sims only ever open on Mission Select; gold is
// reserved for prestige accents.
export const INK = '#eef3f5';
export const INK2 = '#9db0ba';
export const INK3 = '#5f7280';
export const INK_MENU = '#cfd9de';
export const OC = '#ff9c1e'; // orange-core
export const OH = '#ffb340'; // orange-hot
export const OF = '#ff9600'; // orange-fill
export const FR = '#e07f19'; // orange-frame
export const GREEN = '#7bc24f';
export const RED = '#b03a30';
export const TEAL = '#59a8c2';
export const GOLD = '#d9a441';
export const BASE = '#16212a';
export const MID = '#2b3d4a';
export const HAZE = '#51697a';
export const COOL = '#a9c1ce';
export const WARM = '#ffc98c';
export const BOUNCE = '#b96a1f';
export const SHADOW = '#0a0f13';

export function mono(ctx: CanvasRenderingContext2D, size: number) {
  ctx.font = `${size}px "JetBrains Mono", monospace`;
}
export function display(ctx: CanvasRenderingContext2D, size: number) {
  ctx.font = `bold ${size}px Agdasima, sans-serif`;
}

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  t: number;
  ttl: number;
  size: number;
  color: string;
  drag: number;
  grav: number;
};

type FloatText = {
  x: number;
  y: number;
  t: number;
  ttl: number;
  text: string;
  color: string;
  size: number;
  big: boolean; // display face instead of mono
};

export type BurstOpts = {
  color?: string;
  n?: number;
  speed?: number;
  spread?: number; // radians, centered on `angle`
  angle?: number;
  ttl?: number;
  size?: number;
  grav?: number;
};

export type TextOpts = {
  color?: string;
  size?: number;
  big?: boolean;
  ttl?: number;
};

export type Combo = {
  n: number;
  best: number;
  timer: number;
  window: number;
  step: number;
  maxMult: number;
  set(opts: { window?: number; step?: number; maxMult?: number }): void;
  add(k?: number): void;
  break(): number;
  mult(): number;
};

export type Fx = {
  /** Scale a frame's dt through the hit-stop gate: 0 while frozen. */
  tick(dt: number): number;
  readonly frozen: boolean;
  /** Freeze the game world for a beat (default 55ms). */
  freeze(s?: number): void;
  /** Kick the camera; decays on its own. Pinned under reduced motion. */
  shake(px?: number): void;
  applyShake(ctx: CanvasRenderingContext2D): void;
  burst(x: number, y: number, opts?: BurstOpts): void;
  /** One cheap trail particle (call per frame from a moving thing). */
  trail(x: number, y: number, color?: string, size?: number): void;
  /** Floating combat text: "+1", "x4 COMBO", "PERFECT". */
  text(x: number, y: number, str: string, opts?: TextOpts): void;
  /** Center-screen callout ("WAVE 2", "OVERCLOCK"). */
  announce(text: string, sub?: string, ttl?: number): void;
  combo: Combo;
  update(dt: number): void;
  draw(ctx: CanvasRenderingContext2D): void;
};

const POOL = 320;
const TEXTS = 24;

export function createFx(still: () => boolean): Fx {
  const particles: Particle[] = Array.from({ length: POOL }, () => ({
    x: 0, y: 0, vx: 0, vy: 0, t: 0, ttl: 0, size: 2,
    color: INK, drag: 0, grav: 0,
  }));
  let alive = 0;

  const texts: FloatText[] = Array.from({ length: TEXTS }, () => ({
    x: 0, y: 0, t: 0, ttl: 0, text: '', color: INK, size: 12, big: false,
  }));
  let textsAlive = 0;

  let freezeT = 0;
  let shakeMag = 0;

  const ann = { text: '', sub: '', t: 0, ttl: 0 };

  const combo: Combo = {
    n: 0,
    best: 0,
    timer: 0,
    window: 2.4,
    step: 4,
    maxMult: 8,
    set(opts) {
      if (opts.window !== undefined) this.window = opts.window;
      if (opts.step !== undefined) this.step = opts.step;
      if (opts.maxMult !== undefined) this.maxMult = opts.maxMult;
    },
    add(k = 1) {
      this.n += k;
      this.best = Math.max(this.best, this.n);
      this.timer = this.window;
    },
    break() {
      const was = this.n;
      this.n = 0;
      this.timer = 0;
      return was;
    },
    mult() {
      return Math.min(this.maxMult, 1 + Math.floor(this.n / this.step));
    },
  };

  const spawn = (
    x: number, y: number, vx: number, vy: number,
    ttl: number, size: number, color: string, drag: number, grav: number,
  ) => {
    if (alive >= POOL) return;
    const p = particles[alive++];
    p.x = x; p.y = y; p.vx = vx; p.vy = vy;
    p.t = 0; p.ttl = ttl; p.size = size; p.color = color;
    p.drag = drag; p.grav = grav;
  };

  return {
    tick(dt) {
      if (freezeT > 0) {
        freezeT -= dt;
        return 0;
      }
      return dt;
    },
    get frozen() {
      return freezeT > 0;
    },
    freeze(s = 0.055) {
      freezeT = Math.max(freezeT, Math.min(0.09, s));
    },
    shake(px = 3) {
      if (still()) return;
      shakeMag = Math.min(5, Math.max(shakeMag, px));
    },
    applyShake(ctx) {
      if (shakeMag < 0.15 || still()) return;
      ctx.translate(
        (Math.random() * 2 - 1) * shakeMag,
        (Math.random() * 2 - 1) * shakeMag,
      );
    },
    burst(x, y, opts = {}) {
      const damp = still() ? 0.3 : 1;
      const n = Math.max(1, Math.round((opts.n ?? 10) * damp));
      const speed = (opts.speed ?? 130) * (still() ? 0.4 : 1);
      const spread = opts.spread ?? Math.PI * 2;
      const angle = opts.angle ?? 0;
      for (let i = 0; i < n; i++) {
        const a = angle + (Math.random() - 0.5) * spread;
        const v = speed * (0.35 + Math.random() * 0.65);
        spawn(
          x, y, Math.cos(a) * v, Math.sin(a) * v,
          (opts.ttl ?? 0.5) * (0.7 + Math.random() * 0.5),
          opts.size ?? 2.5, opts.color ?? OC, 2.4, opts.grav ?? 60,
        );
      }
    },
    trail(x, y, color = INK3, size = 2) {
      if (still()) return;
      spawn(x, y, 0, 0, 0.3, size, color, 0, 0);
    },
    text(x, y, str, opts = {}) {
      const slot = textsAlive < TEXTS ? textsAlive++ : TEXTS - 1;
      const t = texts[slot];
      t.x = x; t.y = y; t.t = 0;
      t.ttl = opts.ttl ?? 0.8;
      t.text = str;
      t.color = opts.color ?? INK;
      t.size = opts.size ?? 13;
      t.big = opts.big ?? false;
    },
    announce(text, sub = '', ttl = 1.5) {
      ann.text = text;
      ann.sub = sub;
      ann.t = 0;
      ann.ttl = ttl;
    },
    combo,
    update(dt) {
      // particles (swap-remove keeps the pool dense, no allocation)
      for (let i = alive - 1; i >= 0; i--) {
        const p = particles[i];
        p.t += dt;
        if (p.t >= p.ttl) {
          alive--;
          if (i !== alive) {
            const last = particles[alive];
            particles[alive] = p;
            particles[i] = last;
          }
          continue;
        }
        p.vx -= p.vx * p.drag * dt;
        p.vy -= p.vy * p.drag * dt;
        p.vy += p.grav * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }
      for (let i = textsAlive - 1; i >= 0; i--) {
        const t = texts[i];
        t.t += dt;
        if (t.t >= t.ttl) {
          textsAlive--;
          if (i !== textsAlive) {
            const last = texts[textsAlive];
            texts[textsAlive] = t;
            texts[i] = last;
          }
        }
      }
      if (ann.ttl > 0) {
        ann.t += dt;
        if (ann.t >= ann.ttl) ann.ttl = 0;
      }
      shakeMag = shakeMag > 0.05 ? shakeMag * Math.exp(-8 * dt) : 0;
      if (combo.n > 0) {
        combo.timer -= dt;
        if (combo.timer <= 0) combo.break();
      }
    },
    draw(ctx) {
      for (let i = 0; i < alive; i++) {
        const p = particles[i];
        const k = 1 - p.t / p.ttl;
        ctx.globalAlpha = Math.min(1, k * 1.6);
        ctx.fillStyle = p.color;
        const s = p.size * (0.5 + k * 0.5);
        ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
      }
      ctx.globalAlpha = 1;

      const rise = still() ? 6 : 26;
      for (let i = 0; i < textsAlive; i++) {
        const t = texts[i];
        const k = t.t / t.ttl;
        ctx.globalAlpha = k > 0.55 ? 1 - (k - 0.55) / 0.45 : 1;
        if (t.big) display(ctx, t.size);
        else mono(ctx, t.size);
        ctx.fillStyle = t.color;
        const w = ctx.measureText(t.text).width;
        ctx.fillText(t.text, t.x - w / 2, t.y - rise * k);
      }
      ctx.globalAlpha = 1;

      // combo chip: one shared streak grammar across every sim
      if (combo.n >= 2) {
        const cx = W / 2;
        display(ctx, 21);
        const label = `×${combo.mult()} · ${combo.n} CHAIN`;
        const tw = ctx.measureText(label).width;
        ctx.fillStyle = OC;
        ctx.fillText(label, cx - tw / 2, 28);
        const frac = Math.max(0, combo.timer / combo.window);
        ctx.fillStyle = BASE;
        ctx.fillRect(cx - 44, 34, 88, 3);
        ctx.fillStyle = OF;
        ctx.fillRect(cx - 44, 34, 88 * frac, 3);
      }

      // announcer strip: tactical attack, long settle
      if (ann.ttl > 0) {
        const k = ann.t / ann.ttl;
        const attack = Math.min(1, ann.t / 0.14);
        const fade = k > 0.7 ? 1 - (k - 0.7) / 0.3 : 1;
        ctx.globalAlpha = attack * fade;
        const y = H * 0.3;
        const slide = still() ? 0 : (1 - attack) * 10;
        display(ctx, 34);
        ctx.fillStyle = INK;
        const tw = ctx.measureText(ann.text).width;
        ctx.fillText(ann.text, W / 2 - tw / 2, y + slide);
        ctx.fillStyle = OF;
        ctx.fillRect(W / 2 - tw / 2, y + 8 + slide, tw, 2);
        if (ann.sub) {
          mono(ctx, 11);
          ctx.fillStyle = INK2;
          const sw = ctx.measureText(ann.sub).width;
          ctx.fillText(ann.sub, W / 2 - sw / 2, y + 26 + slide);
        }
        ctx.globalAlpha = 1;
      }
    },
  };
}
