import {
  type Fx,
  W,
  H,
  OC,
  OF,
  GREEN,
  mono,
  display,
} from '@/components/missions/sim/fx';
import type {
  Game,
  RoundStats,
  SimEvent,
} from '@/components/missions/sim/contract';

/*
  DUST · DIG SITE — artifacts are buried in a decaying net. Every dig
  pings a sonar ring whose expansion speed encodes distance (fast means
  close) and stains the tile with heat. Dug tiles slowly collapse and
  refill, signal jams hide the heat for three seconds forcing memory
  play, and once you have proven yourself two artifacts run at once.
*/

// The ruined-net ground register (matches the shipped sim's sepia dig site).
const GROUND = '#1a1510';
const SOIL = '#2a231a';
const HEAT_NEAR = '#8a5a20';
const HEAT_MID = '#4a3d28';
const HEAT_FAR = '#241e15';
const JAMMED = '#35322c';
const TEXT_DIM = '#8a7f6b';

const COLS = 9;
const ROWS = 4;
const TILE = 64;
const OX = (W - COLS * TILE) / 2;
const OY = 46;
const REFILL_S = 6;

type Ring = { x: number; y: number; r: number; speed: number; life: number; d: number };

export function digSite(fx: Fx, veteran = false): Game {
  const evs: SimEvent[] = [];
  fx.combo.set({ window: 9, step: 1, maxMult: 3 });
  // veteran mode runs hotter: fast silt, long jams
  const refillS = veteran ? REFILL_S / 1.4 : REFILL_S;
  const s = {
    artifacts: [] as { x: number; y: number }[],
    dug: new Map<string, { d: number; t: number }>(),
    rings: [] as Ring[],
    found: 0,
    pts: 0,
    digs: 0,
    digsSinceFind: 0,
    cleanExtracts: 0,
    blindExtracts: 0,
    cx: 4,
    cy: 2,
    cooldown: 0,
    jam: 0,
    jamNext: 8,
    jams: 0,
    t: 0,
  };

  const key = (x: number, y: number) => `${x},${y}`;
  const bury = () => {
    let x = 0, y = 0, tries = 0;
    do {
      x = Math.floor(Math.random() * COLS);
      y = Math.floor(Math.random() * ROWS);
      tries += 1;
    } while (
      tries < 40 &&
      (s.dug.has(key(x, y)) || s.artifacts.some((a) => a.x === x && a.y === y))
    );
    s.artifacts.push({ x, y });
  };
  bury();

  const nearest = (x: number, y: number) =>
    Math.min(...s.artifacts.map((a) => Math.abs(x - a.x) + Math.abs(y - a.y)));

  const dig = (x: number, y: number) => {
    if (s.cooldown > 0) return;
    const k = key(x, y);
    if (s.dug.has(k)) return;
    s.cooldown = 0.4;
    s.digs += 1;
    s.digsSinceFind += 1;
    const d = nearest(x, y);
    s.dug.set(k, { d, t: 0 });
    const px = OX + x * TILE + TILE / 2;
    const py = OY + y * TILE + TILE / 2;
    // sonar: expansion speed encodes distance — fast means close
    if (s.rings.length >= 7) s.rings.shift();
    s.rings.push({ x: px, y: py, r: 6, speed: Math.max(45, 230 - d * 26), life: 0.9, d });

    const hit = s.artifacts.findIndex((a) => a.x === x && a.y === y);
    if (hit >= 0) {
      s.artifacts.splice(hit, 1);
      s.found += 1;
      s.pts += 3;
      fx.combo.add();
      fx.freeze(0.055);
      fx.shake(3);
      fx.burst(px, py, { color: OC, n: 18, speed: 200 });
      fx.text(px, py - 20, '+3 ARTIFACT', { color: OC, size: 14, big: true });
      if (s.digsSinceFind <= 5) {
        s.pts += 2;
        s.cleanExtracts += 1;
        evs.push({ kind: 'perfect', label: 'CLEAN EXTRACT' });
        fx.text(px, py - 40, 'CLEAN EXTRACT +2', { color: GREEN });
      }
      if (s.jam > 0) {
        s.blindExtracts += 1;
        evs.push({ kind: 'hazard', label: 'BLIND EXTRACT' });
        fx.text(px, py - 58, 'BLIND EXTRACT', { color: TEXT_DIM });
      }
      s.digsSinceFind = 0;
      bury();
      if (s.found === 2) {
        bury();
        fx.announce('DUAL SIGNAL', 'TWO ARTIFACTS LIVE');
        evs.push({ kind: 'milestone', label: 'DUAL SIGNAL' });
      }
    } else if (d === 1) {
      evs.push({ kind: 'near-miss', label: 'CLOSE', x: px, y: py - 16 });
    }
  };

  return {
    update(dt, input) {
      s.t += dt;
      s.cooldown = Math.max(0, s.cooldown - dt);

      for (const [k, v] of s.dug) {
        v.t += dt;
        if (v.t >= refillS) s.dug.delete(k);
      }
      for (let i = s.rings.length - 1; i >= 0; i--) {
        const r = s.rings[i];
        r.r += r.speed * dt;
        r.life -= dt;
        if (r.life <= 0) s.rings.splice(i, 1);
      }

      if (s.jam > 0) {
        s.jam = Math.max(0, s.jam - dt);
      } else {
        s.jamNext -= dt;
        if (s.jamNext <= 0) {
          s.jamNext = 7 + Math.random() * 3;
          s.jam = veteran ? 4.5 : 3;
          s.jams += 1;
          fx.announce('SIGNAL JAM', 'HEAT MASKED — DIG FROM MEMORY');
          evs.push({ kind: 'milestone', label: 'JAM' });
        }
      }

      if (input.pressed.includes('ArrowLeft')) s.cx = (s.cx + COLS - 1) % COLS;
      if (input.pressed.includes('ArrowRight')) s.cx = (s.cx + 1) % COLS;
      if (input.pressed.includes('ArrowUp')) s.cy = (s.cy + ROWS - 1) % ROWS;
      if (input.pressed.includes('ArrowDown')) s.cy = (s.cy + 1) % ROWS;
      if (input.pressed.includes('Enter')) dig(s.cx, s.cy);
      if (input.tap) {
        const x = Math.floor((input.tap.x - OX) / TILE);
        const y = Math.floor((input.tap.y - OY) / TILE);
        if (x >= 0 && x < COLS && y >= 0 && y < ROWS) {
          s.cx = x;
          s.cy = y;
          dig(x, y);
        }
      }
    },

    draw(ctx) {
      ctx.fillStyle = GROUND;
      ctx.fillRect(0, 0, W, H);
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          const px = OX + x * TILE;
          const py = OY + y * TILE;
          const entry = s.dug.get(key(x, y));
          if (entry) {
            if (s.jam > 0) {
              ctx.fillStyle = JAMMED;
            } else {
              const d = entry.d;
              ctx.fillStyle = d === 0 ? OC : d <= 2 ? HEAT_NEAR : d <= 4 ? HEAT_MID : HEAT_FAR;
            }
            ctx.fillRect(px + 2, py + 2, TILE - 4, TILE - 4);
            // collapse: the pit silts back up as it ages
            const age = entry.t / refillS;
            if (age > 0.4) {
              ctx.globalAlpha = (age - 0.4) / 0.6;
              ctx.fillStyle = SOIL;
              ctx.fillRect(px + 2, py + 2, TILE - 4, TILE - 4);
              ctx.globalAlpha = 1;
            }
          } else {
            ctx.fillStyle = SOIL;
            ctx.fillRect(px + 2, py + 2, TILE - 4, TILE - 4);
          }
        }
      }

      // sonar rings
      for (const r of s.rings) {
        ctx.globalAlpha = Math.max(0, r.life) * 0.9;
        ctx.strokeStyle = s.jam > 0 ? JAMMED : r.d <= 2 ? OC : r.d <= 4 ? HEAT_NEAR : TEXT_DIM;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // cursor
      ctx.strokeStyle = OF;
      ctx.lineWidth = 2;
      ctx.strokeRect(OX + s.cx * TILE + 2, OY + s.cy * TILE + 2, TILE - 4, TILE - 4);

      mono(ctx, 11);
      ctx.fillStyle = TEXT_DIM;
      ctx.fillText('FAST PING = CLOSE · TILES SILT BACK UP', OX, H - 18);
      if (s.jam > 0) {
        display(ctx, 15);
        ctx.fillStyle = TEXT_DIM;
        ctx.fillText(`JAMMED ${s.jam.toFixed(1)}s`, W - OX - 96, H - 16);
      }
    },

    score: () => s.pts,
    hud: () =>
      `ARTIFACTS ${s.found} · DIGS ${s.digs}${s.artifacts.length === 2 ? ' · DUAL' : ''}`,
    events: () => evs,
    onRoundEnd: (): RoundStats => ({
      display: [
        { label: 'ARTIFACTS RECOVERED', value: String(s.found) },
        { label: 'CLEAN EXTRACTS', value: String(s.cleanExtracts) },
        { label: 'BLIND EXTRACTS', value: String(s.blindExtracts) },
        { label: 'TOTAL DIGS', value: String(s.digs) },
      ],
      tallies: {
        artifacts: s.found,
        digs: s.digs,
        cleanExtracts: s.cleanExtracts,
        blindExtracts: s.blindExtracts,
        jams: s.jams,
        bestStreak: fx.combo.best,
      },
    }),
  };
}
