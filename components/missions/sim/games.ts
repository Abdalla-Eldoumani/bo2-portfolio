/*
  FIELD SIM game registry — one 20-second score-attack toy per op, each
  symbolizing what the project actually does. Pure canvas-2D, palette
  tokens only, one-hand controls, mouse/touch equivalents for every key.

  Contract: createGame(slug, w, h) → { update(dt, input), draw(ctx),
  score(), hud() }. The harness owns the clock, HUD chrome and lifecycle;
  games stay deterministic-simple and never touch the DOM.
*/

import {
  W,
  H,
  mono,
  display,
  INK,
  INK2,
  INK3,
  OC,
  OF,
  FR,
  GREEN,
  RED,
  BASE,
  MID,
  SHADOW,
} from '@/components/missions/sim/fx';

export type SimInput = {
  held: boolean; // primary held (Space / pointer down)
  pressed: string[]; // keys pressed this frame: 'Enter','ArrowLeft',… + 'Tap'
  tap: { x: number; y: number } | null; // canvas-space tap this frame
};

/*
  Medal-worthy moments games report to the harness (drained per frame).
  The harness turns them into SFX and career-meta tallies. Convention:
  an event carrying x/y also gets default floating text from the harness;
  a game that draws its own feedback emits the event without coordinates.
*/
export type SimEventKind =
  | 'perfect' // dead-center / flawless action
  | 'near-miss' // grazed a hazard or an edge and lived
  | 'streak' // streak milestone reached (value = length)
  | 'hazard' // hazard survived or cleared
  | 'combo-break' // streak lost (value = length lost)
  | 'milestone'; // escalation beat (wave, phase shift, scale-out)

export type SimEvent = {
  kind: SimEventKind;
  label?: string;
  value?: number;
  x?: number;
  y?: number;
};

/** Debrief payload: display lines for the human, tallies for the meta. */
export type RoundStats = {
  display: { label: string; value: string }[];
  tallies: Record<string, number>;
};

export type Game = {
  update(dt: number, input: SimInput): void;
  draw(ctx: CanvasRenderingContext2D): void;
  score(): number;
  hud(): string; // right-side HUD readout
  events?(): SimEvent[]; // drained by the harness every frame
  onRoundEnd?(): RoundStats; // richer debrief + meta-layer stats
};

export const SIM_META: Record<
  string,
  { title: string; brief: string; controls: string }
> = {
  peregrine: {
    title: 'FALCON DASH',
    brief: 'Hold to climb, release to dive. Thread the gates — every gate feeds the multiplier toward ×28.',
    controls: 'HOLD SPACE / HOLD POINTER — CLIMB',
  },
  aeos: {
    title: 'KERNEL BOOT',
    brief: 'Commit each boot stage while the marker crosses the orange window. EL2 to desktop, no panics.',
    controls: '↵ / TAP — COMMIT STAGE',
  },
  'aarch64-playground': {
    title: 'SINGLE STEP',
    brief: 'Retire each instruction as it enters the execute slot. Early or late flushes the pipeline.',
    controls: '↵ / TAP — STEP',
  },
  qala: {
    title: 'EFFECT CHECK',
    brief: 'The compiler asks: is this expression pure, or does it do io? Judge it before it lands.',
    controls: '← PURE · → IO (TAP LEFT / RIGHT)',
  },
  'rust-http-server': {
    title: 'LOAD BALANCER',
    brief: 'Serve the three queues and hold p99 under 10ms. Queues grow; latency follows the deepest one.',
    controls: '← ↓ → / TAP A LANE — SERVE',
  },
  dossier: {
    title: 'REDACTION PASS',
    brief: 'The scanner walks the page. Stamp every SECRET line while the cursor is on it. Zero leaks.',
    controls: '↵ / TAP — REDACT',
  },
  dust: {
    title: 'DIG SITE',
    brief: 'An artifact is buried in the grid. Warmer tiles are closer. Dig it out, then the next one.',
    controls: 'ARROWS + ↵ / TAP A TILE — DIG',
  },
  'budget-buddy': {
    title: 'MARKET RUN',
    brief: 'One position, one ticker. Buy the dips, sell the rips, book the profit before the bell.',
    controls: '↵ / TAP — BUY / SELL',
  },
};

/* ── PEREGRINE · FALCON DASH ─────────────────────────────────────────── */
function falconDash(): Game {
  const s = {
    y: H / 2, vy: 0, t: 0, gates: 0, mult: 1, flash: 0,
    gatesArr: [] as { x: number; cy: number; r: number; hit: boolean }[],
    next: 1.2,
  };
  const ridge = (x: number) =>
    H - 60 - 40 * Math.sin((x + s.t * 140) / 130) - 18 * Math.sin((x + s.t * 140) / 47);
  return {
    update(dt, input) {
      s.t += dt;
      const speed = 150 + Math.min(s.t * 16, 170);
      s.vy += (input.held ? -680 : 620) * dt;
      s.vy = Math.max(-270, Math.min(310, s.vy));
      s.y += s.vy * dt;
      if (s.y < 22) { s.y = 22; s.vy = 0; }
      const floor = ridge(120) - 10;
      if (s.y > floor) { s.y = floor; s.vy = -130; s.flash = 0.25; s.mult = Math.max(1, s.mult / 2); }
      s.next -= dt;
      if (s.next <= 0) {
        s.next = 1.0;
        s.gatesArr.push({ x: W + 30, cy: 46 + Math.random() * (H - 165), r: 34, hit: false });
      }
      for (const g of s.gatesArr) {
        g.x -= speed * dt;
        if (!g.hit && g.x < 130 && g.x > 108 && Math.abs(s.y - g.cy) < g.r) {
          g.hit = true; s.gates += 1; s.mult = Math.min(28, 1 + s.gates * 1.5);
        }
      }
      while (s.gatesArr.length && s.gatesArr[0].x < -40) s.gatesArr.shift();
      s.flash = Math.max(0, s.flash - dt);
    },
    draw(ctx) {
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#33454f'); grad.addColorStop(1, SHADOW);
      ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = SHADOW;
      ctx.beginPath(); ctx.moveTo(0, H);
      for (let x = 0; x <= W; x += 16) ctx.lineTo(x, ridge(x));
      ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = FR; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.85;
      ctx.beginPath();
      for (let x = 0; x <= W; x += 16) {
        const yy = ridge(x);
        if (x === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
      }
      ctx.stroke(); ctx.globalAlpha = 1;
      for (const g of s.gatesArr) {
        ctx.strokeStyle = g.hit ? GREEN : OC; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(g.x, g.cy, g.r, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.save();
      ctx.translate(120, s.y);
      ctx.rotate(Math.max(-0.4, Math.min(0.5, s.vy / 420)));
      ctx.fillStyle = s.flash > 0 ? RED : INK;
      ctx.beginPath();
      ctx.moveTo(17, 0); ctx.lineTo(-12, -9); ctx.lineTo(-5, 0); ctx.lineTo(-12, 9);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    },
    score: () => s.gates,
    hud: () => `SPEED ×${s.mult.toFixed(1)} · GATES ${s.gates}`,
  };
}

/* ── AEOS · KERNEL BOOT ──────────────────────────────────────────────── */
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
function kernelBoot(): Game {
  const s = { stage: 0, pos: 0, dir: 1, speed: 1.15, booted: 0, flash: 0, ok: 0 };
  const winW = () => Math.max(0.09, 0.24 - s.booted * 0.014);
  return {
    update(dt, input) {
      s.pos += s.dir * s.speed * dt;
      if (s.pos > 1) { s.pos = 1; s.dir = -1; }
      if (s.pos < 0) { s.pos = 0; s.dir = 1; }
      s.flash = Math.max(0, s.flash - dt);
      s.ok = Math.max(0, s.ok - dt);
      if (input.pressed.includes('Enter') || input.tap) {
        const inWin = Math.abs(s.pos - 0.5) < winW() / 2;
        if (inWin) {
          s.booted += 1; s.stage = (s.stage + 1) % BOOT_STAGES.length;
          s.speed = Math.min(2.2, s.speed + 0.09); s.ok = 0.3;
        } else {
          s.flash = 0.3;
        }
      }
    },
    draw(ctx) {
      ctx.fillStyle = SHADOW; ctx.fillRect(0, 0, W, H);
      // boot log
      mono(ctx, 13);
      for (let i = 0; i < BOOT_STAGES.length; i++) {
        const done = i < s.stage || s.booted >= BOOT_STAGES.length;
        ctx.fillStyle = i === s.stage ? INK : done ? GREEN : INK3;
        ctx.fillText(`${done ? '[ OK ]' : i === s.stage ? '[ .. ]' : '[    ]'}  ${BOOT_STAGES[i]}`, 40, 60 + i * 26);
      }
      // timing bar
      const bx = 40, bw = W - 80, by = H - 74;
      ctx.fillStyle = BASE; ctx.fillRect(bx, by, bw, 18);
      const ww = winW() * bw;
      ctx.fillStyle = s.flash > 0 ? RED : OF;
      ctx.globalAlpha = s.flash > 0 ? 0.7 : 1;
      ctx.fillRect(bx + bw / 2 - ww / 2, by, ww, 18);
      ctx.globalAlpha = 1;
      ctx.fillStyle = s.ok > 0 ? GREEN : INK;
      const mx = bx + s.pos * bw;
      ctx.fillRect(mx - 2, by - 5, 4, 28);
      mono(ctx, 11);
      ctx.fillStyle = INK3;
      ctx.fillText('COMMIT INSIDE THE ORANGE WINDOW', bx, by + 40);
    },
    score: () => s.booted,
    hud: () => `STAGES ${s.booted} · CLOCK ×${s.speed.toFixed(2)}`,
  };
}

/* ── AARCH64 · SINGLE STEP ───────────────────────────────────────────── */
const INSTRS = ['ADD X0, X0, #1', 'LDR X1, [SP]', 'SUBS X2, X2, #4', 'STR X0, [X19]', 'CBZ X2, done', 'MOV X8, #93', 'BL printf', 'RET'];
function singleStep(): Game {
  const s = {
    items: [] as { x: number; text: string }[],
    next: 0, retired: 0, combo: 0, flush: 0, pc: 0x4000,
    regs: [0, 0, 0, 0],
  };
  const SLOT_X = 150; const SPEED0 = 120;
  return {
    update(dt, input) {
      const speed = SPEED0 + Math.min(s.retired * 6, 140);
      s.next -= dt;
      if (s.next <= 0) {
        s.next = 1.15 - Math.min(0.5, s.retired * 0.02);
        s.items.push({ x: W + 40, text: INSTRS[Math.floor(Math.random() * INSTRS.length)] });
      }
      for (const it of s.items) it.x -= speed * dt;
      s.flush = Math.max(0, s.flush - dt);
      const head = s.items[0];
      if (input.pressed.includes('Enter') || input.tap) {
        if (head && Math.abs(head.x - SLOT_X) < 34) {
          s.items.shift();
          s.retired += 1; s.combo += 1; s.pc += 4;
          s.regs[s.retired % 4] += Math.floor(1 + Math.random() * 9);
        } else {
          s.combo = 0; s.flush = 0.35; s.items.length = 0;
        }
      }
      if (head && head.x < 40) { s.items.shift(); s.combo = 0; s.flush = 0.25; }
    },
    draw(ctx) {
      ctx.fillStyle = SHADOW; ctx.fillRect(0, 0, W, H);
      // execute slot
      ctx.strokeStyle = s.flush > 0 ? RED : OF; ctx.lineWidth = 2;
      ctx.strokeRect(SLOT_X - 36, H / 2 - 26, 72, 52);
      mono(ctx, 10); ctx.fillStyle = INK3;
      ctx.fillText('EXECUTE', SLOT_X - 24, H / 2 - 34);
      // pipeline
      mono(ctx, 14);
      for (const it of s.items) {
        const inSlot = Math.abs(it.x - SLOT_X) < 34;
        ctx.fillStyle = inSlot ? OC : INK2;
        ctx.fillText(it.text, it.x - 30, H / 2 + 5);
      }
      // registers
      mono(ctx, 13);
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = INK3;
        ctx.fillText(`X${i}`, 48 + i * 160, H - 60);
        ctx.fillStyle = INK;
        ctx.fillText(`0x${s.regs[i].toString(16).padStart(4, '0')}`, 84 + i * 160, H - 60);
      }
      ctx.fillStyle = INK3; mono(ctx, 12);
      ctx.fillText(`PC 0x${s.pc.toString(16)}`, 48, 50);
      ctx.fillStyle = s.flush > 0 ? RED : INK3;
      if (s.flush > 0) ctx.fillText('PIPELINE FLUSH', SLOT_X + 60, 50);
    },
    score: () => s.retired,
    hud: () => `RETIRED ${s.retired} · COMBO ${s.combo}`,
  };
}

/* ── QALA · EFFECT CHECK ─────────────────────────────────────────────── */
const SNIPPETS: { code: string; io: boolean }[] = [
  { code: 'print("salaam")', io: true },
  { code: 'let y = x * 2', io: false },
  { code: 'file.read("cfg")', io: true },
  { code: 'fn add(a, b) = a + b', io: false },
  { code: 'net.send(pkt)', io: true },
  { code: 'let n = len(xs)', io: false },
  { code: 'clock.now()', io: true },
  { code: 'map(xs, square)', io: false },
  { code: 'rand()', io: true },
  { code: 'sort(ys)', io: false },
];
function effectCheck(): Game {
  const s = {
    card: null as null | { code: string; io: boolean; y: number },
    ok: 0, bad: 0, feedback: 0, feedbackGood: true, speed: 60,
  };
  const spawn = () => {
    s.card = { ...SNIPPETS[Math.floor(Math.random() * SNIPPETS.length)], y: 40 };
  };
  spawn();
  const judge = (io: boolean) => {
    if (!s.card) return;
    const right = s.card.io === io;
    if (right) { s.ok += 1; s.speed = Math.min(190, s.speed + 7); }
    else s.bad += 1;
    s.feedback = 0.35; s.feedbackGood = right;
    spawn();
  };
  return {
    update(dt, input) {
      if (s.card) {
        s.card.y += s.speed * dt;
        if (s.card.y > H - 96) { s.bad += 1; s.feedback = 0.35; s.feedbackGood = false; spawn(); }
      }
      s.feedback = Math.max(0, s.feedback - dt);
      if (input.pressed.includes('ArrowLeft')) judge(false);
      else if (input.pressed.includes('ArrowRight')) judge(true);
      else if (input.tap) judge(input.tap.x > W / 2);
    },
    draw(ctx) {
      ctx.fillStyle = SHADOW; ctx.fillRect(0, 0, W, H);
      // halves
      ctx.fillStyle = MID; ctx.globalAlpha = 0.14;
      ctx.fillRect(0, 0, W / 2, H); ctx.globalAlpha = 0.1;
      ctx.fillRect(W / 2, 0, W / 2, H); ctx.globalAlpha = 1;
      display(ctx, 24);
      ctx.fillStyle = GREEN; ctx.fillText('IS PURE  ←', 60, H - 40);
      ctx.fillStyle = OC; ctx.fillText('→  IS IO', W - 170, H - 40);
      ctx.strokeStyle = INK3; ctx.setLineDash([4, 6]);
      ctx.beginPath(); ctx.moveTo(W / 2, 20); ctx.lineTo(W / 2, H - 70); ctx.stroke();
      ctx.setLineDash([]);
      if (s.card) {
        const cw = 300;
        ctx.fillStyle = BASE;
        ctx.fillRect(W / 2 - cw / 2, s.card.y - 22, cw, 44);
        ctx.strokeStyle = s.feedback > 0 ? (s.feedbackGood ? GREEN : RED) : FR;
        ctx.lineWidth = 2;
        ctx.strokeRect(W / 2 - cw / 2, s.card.y - 22, cw, 44);
        mono(ctx, 15); ctx.fillStyle = INK;
        const tw = ctx.measureText(s.card.code).width;
        ctx.fillText(s.card.code, W / 2 - tw / 2, s.card.y + 5);
      }
    },
    score: () => s.ok,
    hud: () => `COMPILED ${s.ok} · ERRORS ${s.bad}`,
  };
}

/* ── RUST HTTP SERVER · LOAD BALANCER ────────────────────────────────── */
function loadBalancer(): Game {
  const s = { q: [0, 0, 0], served: 0, next: 0.5, over: 0, t: 0 };
  const latency = () => Math.max(...s.q) * 1.3;
  const serve = (lane: number) => {
    const take = Math.min(3, s.q[lane]);
    s.q[lane] -= take; s.served += take;
  };
  return {
    update(dt, input) {
      s.t += dt;
      s.next -= dt;
      const rate = 0.5 - Math.min(0.3, s.t * 0.012);
      if (s.next <= 0) {
        s.next = rate;
        s.q[Math.floor(Math.random() * 3)] += 1;
      }
      if (input.pressed.includes('ArrowLeft')) serve(0);
      if (input.pressed.includes('ArrowDown')) serve(1);
      if (input.pressed.includes('ArrowRight')) serve(2);
      if (input.tap) serve(Math.min(2, Math.floor((input.tap.x / W) * 3)));
      s.over = latency() > 10 ? s.over + dt : 0;
    },
    draw(ctx) {
      ctx.fillStyle = SHADOW; ctx.fillRect(0, 0, W, H);
      const laneW = 150;
      const keys = ['←', '↓', '→'];
      for (let i = 0; i < 3; i++) {
        const x = W / 2 + (i - 1) * (laneW + 40) - laneW / 2;
        ctx.strokeStyle = MID; ctx.lineWidth = 1;
        ctx.strokeRect(x, 40, laneW, H - 140);
        // queue dots
        for (let d = 0; d < Math.min(s.q[i], 24); d++) {
          ctx.fillStyle = d > 16 ? RED : d > 8 ? OC : INK2;
          const col = d % 4, row = Math.floor(d / 4);
          ctx.beginPath();
          ctx.arc(x + 30 + col * 30, H - 130 - row * 26, 7, 0, Math.PI * 2);
          ctx.fill();
        }
        display(ctx, 22); ctx.fillStyle = INK2;
        ctx.fillText(keys[i], x + laneW / 2 - 7, H - 66);
        mono(ctx, 11); ctx.fillStyle = INK3;
        ctx.fillText(`Q${i} · ${s.q[i]}`, x + 8, 58);
      }
      // latency meter
      const lat = latency();
      mono(ctx, 13);
      ctx.fillStyle = lat > 10 ? RED : GREEN;
      ctx.fillText(`p99 ${lat.toFixed(1)}ms ${lat > 10 ? '· DEGRADED' : '· HEALTHY'}`, 40, H - 24);
      ctx.fillStyle = BASE; ctx.fillRect(220, H - 36, 320, 14);
      ctx.fillStyle = lat > 10 ? RED : OF;
      ctx.fillRect(220, H - 36, Math.min(320, (lat / 20) * 320), 14);
      ctx.strokeStyle = INK3;
      ctx.beginPath(); ctx.moveTo(220 + 160, H - 40); ctx.lineTo(220 + 160, H - 18); ctx.stroke();
    },
    score: () => s.served,
    hud: () => `SERVED ${s.served} · p99 ${latency().toFixed(1)}MS`,
  };
}

/* ── DOSSIER · REDACTION PASS ────────────────────────────────────────── */
function redactionPass(): Game {
  const mk = () => Array.from({ length: 9 }, () => Math.random() < 0.38);
  const s = {
    secret: mk(), redacted: [] as number[], leaks: 0, done: 0,
    cursor: 0, speed: 55, page: 1,
  };
  const rowY = (i: number) => 58 + i * 30;
  return {
    update(dt, input) {
      s.cursor += s.speed * dt;
      const row = Math.floor((s.cursor - 44) / 30);
      if (input.pressed.includes('Enter') || input.tap) {
        if (row >= 0 && row < 9 && s.secret[row] && !s.redacted.includes(row)) {
          s.redacted.push(row); s.done += 1;
        }
      }
      if (s.cursor > rowY(9) + 10) {
        // page turn: count leaks
        s.secret.forEach((sec, i) => {
          if (sec && !s.redacted.includes(i)) s.leaks += 1;
        });
        s.secret = mk(); s.redacted = []; s.cursor = 0;
        s.page += 1; s.speed = Math.min(120, s.speed + 7);
      }
    },
    draw(ctx) {
      ctx.fillStyle = SHADOW; ctx.fillRect(0, 0, W, H);
      // paper
      ctx.fillStyle = '#e9e6dd';
      ctx.fillRect(90, 24, W - 180, H - 60);
      mono(ctx, 12);
      for (let i = 0; i < 9; i++) {
        const y = rowY(i);
        const redacted = s.redacted.includes(i);
        if (redacted) {
          ctx.fillStyle = '#111';
          ctx.fillRect(120, y - 12, W - 250, 18);
        } else {
          ctx.fillStyle = s.secret[i] ? '#8a4200' : '#555';
          const label = s.secret[i] ? '■ SECRET // ' : '';
          ctx.fillText(`${label}${'▬'.repeat(s.secret[i] ? 18 : 26)}`, 120, y + 2);
        }
      }
      // scanner cursor
      const cy = Math.min(H - 40, 24 + s.cursor);
      ctx.fillStyle = OF; ctx.globalAlpha = 0.85;
      ctx.fillRect(90, cy, W - 180, 3);
      ctx.globalAlpha = 1;
      mono(ctx, 11);
      ctx.fillStyle = INK3;
      ctx.fillText(`PAGE ${s.page}`, 92, H - 16);
      ctx.fillStyle = s.leaks > 0 ? RED : GREEN;
      ctx.fillText(`LEAKS ${s.leaks}`, 170, H - 16);
    },
    score: () => s.done,
    hud: () => `REDACTED ${s.done} · LEAKS ${s.leaks}`,
  };
}

/* ── DUST · DIG SITE ─────────────────────────────────────────────────── */
function digSite(): Game {
  const COLS = 9, ROWS = 4;
  const s = {
    ax: 0, ay: 0, dug: new Set<string>(), found: 0,
    cx: 4, cy: 2, cooldown: 0,
  };
  const place = () => {
    s.ax = Math.floor(Math.random() * COLS);
    s.ay = Math.floor(Math.random() * ROWS);
    s.dug.clear();
  };
  place();
  const cell = (x: number, y: number) => `${x},${y}`;
  const dist = (x: number, y: number) => Math.abs(x - s.ax) + Math.abs(y - s.ay);
  const dig = (x: number, y: number) => {
    if (s.cooldown > 0 || s.dug.has(cell(x, y))) return;
    s.cooldown = 0.45;
    s.dug.add(cell(x, y));
    if (x === s.ax && y === s.ay) { s.found += 1; place(); }
  };
  const TILE = 64, OX = (W - COLS * TILE) / 2, OY = 46;
  return {
    update(dt, input) {
      s.cooldown = Math.max(0, s.cooldown - dt);
      if (input.pressed.includes('ArrowLeft')) s.cx = (s.cx + COLS - 1) % COLS;
      if (input.pressed.includes('ArrowRight')) s.cx = (s.cx + 1) % COLS;
      if (input.pressed.includes('ArrowUp')) s.cy = (s.cy + ROWS - 1) % ROWS;
      if (input.pressed.includes('ArrowDown')) s.cy = (s.cy + 1) % ROWS;
      if (input.pressed.includes('Enter')) dig(s.cx, s.cy);
      if (input.tap) {
        const x = Math.floor((input.tap.x - OX) / TILE);
        const y = Math.floor((input.tap.y - OY) / TILE);
        if (x >= 0 && x < COLS && y >= 0 && y < ROWS) { s.cx = x; s.cy = y; dig(x, y); }
      }
    },
    draw(ctx) {
      ctx.fillStyle = '#1a1510'; ctx.fillRect(0, 0, W, H);
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          const px = OX + x * TILE, py = OY + y * TILE;
          const dugHere = s.dug.has(cell(x, y));
          if (dugHere) {
            const d = dist(x, y);
            // heat: closer = warmer
            ctx.fillStyle = d === 0 ? OC : d <= 2 ? '#8a5a20' : d <= 4 ? '#4a3d28' : '#241e15';
          } else {
            ctx.fillStyle = '#2a231a';
          }
          ctx.fillRect(px + 2, py + 2, TILE - 4, TILE - 4);
          if (dugHere && dist(x, y) === 0) {
            display(ctx, 20); ctx.fillStyle = SHADOW;
            ctx.fillText('◆', px + TILE / 2 - 7, py + TILE / 2 + 7);
          }
        }
      }
      // cursor
      ctx.strokeStyle = OF; ctx.lineWidth = 2;
      ctx.strokeRect(OX + s.cx * TILE + 2, OY + s.cy * TILE + 2, TILE - 4, TILE - 4);
      mono(ctx, 11); ctx.fillStyle = '#8a7f6b';
      ctx.fillText('WARMER TILES = CLOSER · EACH DIG PINGS THE SITE', OX, H - 18);
    },
    score: () => s.found,
    hud: () => `ARTIFACTS ${s.found} · DIGS ${s.dug.size}`,
  };
}

/* ── BUDGET BUDDY · MARKET RUN ───────────────────────────────────────── */
function marketRun(): Game {
  const s = {
    prices: [100] as number[], holding: false, entry: 0, cash: 0,
    trades: [] as { i: number; price: number; buy: boolean }[],
  };
  let acc = 0;
  return {
    update(dt, input) {
      acc += dt;
      while (acc > 0.1) {
        acc -= 0.1;
        const last = s.prices[s.prices.length - 1];
        const drift = (Math.random() - 0.485) * 3.2;
        s.prices.push(Math.max(60, Math.min(150, last + drift)));
        if (s.prices.length > 130) s.prices.shift();
      }
      if (input.pressed.includes('Enter') || input.tap) {
        const price = s.prices[s.prices.length - 1];
        if (!s.holding) { s.holding = true; s.entry = price; }
        else { s.holding = false; s.cash += price - s.entry; }
        s.trades.push({ i: s.prices.length - 1, price, buy: s.holding });
        if (s.trades.length > 12) s.trades.shift();
      }
    },
    draw(ctx) {
      ctx.fillStyle = SHADOW; ctx.fillRect(0, 0, W, H);
      const x0 = 50, x1 = W - 40, y0 = 50, y1 = H - 90;
      const px = (i: number) => x0 + (i / 129) * (x1 - x0);
      const py = (p: number) => y1 - ((p - 60) / 90) * (y1 - y0);
      // grid
      ctx.strokeStyle = MID; ctx.globalAlpha = 0.35; ctx.lineWidth = 1;
      for (let gy = 0; gy <= 3; gy++) {
        ctx.beginPath(); ctx.moveTo(x0, y0 + (gy * (y1 - y0)) / 3);
        ctx.lineTo(x1, y0 + (gy * (y1 - y0)) / 3); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      // price line
      ctx.strokeStyle = OC; ctx.lineWidth = 2;
      ctx.beginPath();
      s.prices.forEach((p, i) => {
        if (i === 0) ctx.moveTo(px(i), py(p)); else ctx.lineTo(px(i), py(p));
      });
      ctx.stroke();
      const last = s.prices[s.prices.length - 1];
      // holding band
      if (s.holding) {
        const pl = last - s.entry;
        ctx.fillStyle = pl >= 0 ? GREEN : RED; ctx.globalAlpha = 0.18;
        const ey = py(s.entry), ly = py(last);
        ctx.fillRect(x0, Math.min(ey, ly), x1 - x0, Math.abs(ey - ly) || 2);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = INK3; ctx.setLineDash([4, 5]);
        ctx.beginPath(); ctx.moveTo(x0, ey); ctx.lineTo(x1, ey); ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.fillStyle = INK;
      ctx.beginPath(); ctx.arc(px(s.prices.length - 1), py(last), 4, 0, Math.PI * 2); ctx.fill();
      mono(ctx, 13);
      ctx.fillStyle = INK2;
      ctx.fillText(`PRICE $${last.toFixed(2)}`, x0, 34);
      ctx.fillStyle = s.holding ? OC : INK3;
      ctx.fillText(s.holding ? `HOLDING FROM $${s.entry.toFixed(2)} — ↵ SELL` : '↵ BUY', x0 + 170, 34);
      const pl = s.cash + (s.holding ? last - s.entry : 0);
      display(ctx, 26);
      ctx.fillStyle = pl >= 0 ? GREEN : RED;
      ctx.fillText(`P/L ${pl >= 0 ? '+' : ''}$${pl.toFixed(2)}`, x0, H - 40);
    },
    score: () => Math.round(s.cash + (s.holding ? s.prices[s.prices.length - 1] - s.entry : 0)),
    hud: () => (s.holding ? 'POSITION: LONG' : 'POSITION: FLAT'),
  };
}

export function createGame(slug: string): Game {
  switch (slug) {
    case 'peregrine': return falconDash();
    case 'aeos': return kernelBoot();
    case 'aarch64-playground': return singleStep();
    case 'qala': return effectCheck();
    case 'rust-http-server': return loadBalancer();
    case 'dossier': return redactionPass();
    case 'dust': return digSite();
    case 'budget-buddy': return marketRun();
    default: return falconDash();
  }
}

export const SIM_W = W;
export const SIM_H = H;
