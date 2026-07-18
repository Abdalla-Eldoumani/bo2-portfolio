import {
  type Fx,
  W,
  H,
  INK2,
  INK3,
  OC,
  OH,
  OF,
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
  RUST HTTP SERVER · LOAD BALANCER — serve the queues, hold p99 under
  10ms. Traffic spikes are telegraphed before they land. Serving the same
  lane twice inside a beat is a cache hit (bonus + extra drain). A queue
  hitting 24 trips that lane's circuit breaker: locked and red for 1.5s,
  then half the load sheds. Crossing 40 served scales out a fourth node —
  the ↑ key and a fourth tap zone come online, advertised on the legend.
*/

const BREAK_AT = 24;

type Lane = {
  q: number;
  lock: number; // circuit-breaker lockout remaining
  lastServe: number; // for the cache-hit beat
  armed: boolean; // near-miss tracking above 20
};

export function loadBalancer(fx: Fx, veteran = false): Game {
  const evs: SimEvent[] = [];
  fx.combo.set({ window: 2.2, step: 2, maxMult: 4 });
  // veteran mode runs hotter: touchier breakers under heavier traffic
  const breakAt = veteran ? 18 : BREAK_AT;
  const s = {
    lanes: [
      { q: 0, lock: 0, lastServe: -9, armed: false },
      { q: 0, lock: 0, lastServe: -9, armed: false },
      { q: 0, lock: 0, lastServe: -9, armed: false },
      { q: 0, lock: 0, lastServe: -9, armed: false },
    ] as Lane[],
    n: 3,
    t: 0,
    next: 0.5,
    pts: 0,
    served: 0,
    cacheHits: 0,
    breakers: 0,
    shed: 0,
    peakQ: 0,
    under10: 0,
    burst: null as null | { lane: number; tele: number; left: number; drip: number },
    burstNext: 5,
    burstsAbsorbed: 0,
  };
  const latency = () => Math.max(...s.lanes.slice(0, s.n).map((l) => l.q)) * 1.3;

  const laneGeom = () => {
    const gap = s.n === 3 ? 40 : 26;
    const lw = s.n === 3 ? 150 : 122;
    const total = s.n * lw + (s.n - 1) * gap;
    const x0 = (W - total) / 2;
    return { lw, gap, x0 };
  };

  const trip = (lane: Lane, i: number) => {
    lane.lock = 1.5;
    lane.armed = false;
    s.breakers += 1;
    evs.push({ kind: 'hazard', label: 'CIRCUIT OPEN' });
    fx.shake(4);
    fx.freeze(0.05);
    const { lw, gap, x0 } = laneGeom();
    fx.burst(x0 + i * (lw + gap) + lw / 2, H - 140, { color: RED, n: 16, speed: 200 });
    fx.announce('CIRCUIT OPEN', `NODE ${i + 1} SHEDDING LOAD`);
  };

  const serve = (i: number) => {
    if (i >= s.n) return;
    const lane = s.lanes[i];
    if (lane.lock > 0) return; // breaker owns the lane
    const take = Math.min(3, lane.q);
    lane.q -= take;
    s.served += take;
    s.pts += take;
    const beat = s.t - lane.lastServe < 0.45;
    lane.lastServe = s.t;
    // cache hit: a second serve inside the beat, against real load only
    const extra = Math.min(2, lane.q);
    if (take > 0 && beat && extra > 0) {
      lane.q -= extra;
      s.served += extra;
      s.pts += extra + 2;
      s.cacheHits += 1;
      fx.combo.add();
      const { lw, gap, x0 } = laneGeom();
      const cx = x0 + i * (lw + gap) + lw / 2;
      fx.text(cx, H - 150, 'CACHE HIT +2', { color: OH });
      fx.burst(cx, H - 130, { color: OH, n: 8, speed: 130 });
      evs.push({ kind: 'perfect', label: 'CACHE HIT' });
    }
  };

  return {
    update(dt, input) {
      s.t += dt;
      s.next -= dt;
      const rate =
        Math.max(0.24, 0.5 - s.t * 0.011) * (s.n === 4 ? 0.8 : 1) * (veteran ? 0.8 : 1);
      if (s.next <= 0) {
        s.next = rate;
        // breaker-locked lanes shed inbound work instead of queueing it
        const open = s.lanes.slice(0, s.n).map((l, i) => ({ l, i })).filter((e) => e.l.lock <= 0);
        if (open.length > 0) {
          const pick = open[Math.floor(Math.random() * open.length)];
          pick.l.q += 1;
        } else {
          s.shed += 1;
        }
      }

      // telegraphed traffic spikes
      if (s.burst) {
        const b = s.burst;
        if (b.tele > 0) {
          b.tele -= dt;
        } else if (b.left > 0) {
          b.drip -= dt;
          if (b.drip <= 0) {
            b.drip = 0.09;
            if (s.lanes[b.lane].lock <= 0) s.lanes[b.lane].q += 1;
            else s.shed += 1;
            b.left -= 1;
          }
        } else {
          s.burst = null;
        }
      } else {
        s.burstNext -= dt;
        if (s.burstNext <= 0) {
          s.burstNext = 4.5 + Math.random() * 2.5;
          const lane = Math.floor(Math.random() * s.n);
          s.burst = { lane, tele: 1.1, left: 10 + Math.floor(Math.random() * 4), drip: 0 };
          fx.announce('BURST INBOUND', `NODE ${lane + 1} — BRACE`);
          evs.push({ kind: 'milestone', label: 'BURST' });
        }
      }

      for (let i = 0; i < s.n; i++) {
        const lane = s.lanes[i];
        const wasLocked = lane.lock > 0;
        lane.lock = Math.max(0, lane.lock - dt);
        // reclose: the breaker sheds half the queue on the way back in
        if (wasLocked && lane.lock === 0) lane.q = Math.min(lane.q, 12);
        if (lane.lock === 0 && lane.q >= breakAt) trip(lane, i);
        if (!lane.armed && lane.lock <= 0 && lane.q >= 20) lane.armed = true;
        if (lane.armed && lane.q <= 15) {
          lane.armed = false;
          const { lw, gap, x0 } = laneGeom();
          evs.push({
            kind: 'near-miss',
            label: 'BREAKER AVOIDED',
            x: x0 + i * (lw + gap) + lw / 2,
            y: 80,
          });
        }
        s.peakQ = Math.max(s.peakQ, lane.q);
      }

      if (input.pressed.includes('ArrowLeft')) serve(0);
      if (input.pressed.includes('ArrowDown')) serve(1);
      if (input.pressed.includes('ArrowRight')) serve(2);
      if (input.pressed.includes('ArrowUp')) serve(3);
      if (input.tap) serve(Math.min(s.n - 1, Math.floor((input.tap.x / W) * s.n)));

      if (latency() <= 10) s.under10 += dt;

      if (s.n === 3 && s.served >= 40) {
        s.n = 4;
        fx.announce('SCALE OUT', 'NODE 4 ONLINE — ↑ SERVES IT');
        evs.push({ kind: 'milestone', label: 'SCALE OUT' });
      }
    },

    draw(ctx) {
      ctx.fillStyle = SHADOW;
      ctx.fillRect(0, 0, W, H);
      const { lw, gap, x0 } = laneGeom();
      const keys = ['←', '↓', '→', '↑'];
      for (let i = 0; i < s.n; i++) {
        const lane = s.lanes[i];
        const x = x0 + i * (lw + gap);
        const locked = lane.lock > 0;
        ctx.strokeStyle = locked ? RED : MID;
        ctx.lineWidth = locked ? 2 : 1;
        ctx.strokeRect(x, 40, lw, H - 140);
        if (locked) {
          ctx.globalAlpha = 0.12;
          ctx.fillStyle = RED;
          ctx.fillRect(x, 40, lw, H - 140);
          ctx.globalAlpha = 1;
          mono(ctx, 10);
          ctx.fillStyle = RED;
          ctx.fillText('CIRCUIT OPEN', x + lw / 2 - 36, H / 2 - 30);
          ctx.fillText(`${lane.lock.toFixed(1)}s`, x + lw / 2 - 12, H / 2 - 14);
        }
        const cols = s.n === 3 ? 4 : 3;
        const dotGap = s.n === 3 ? 30 : 32;
        for (let d = 0; d < Math.min(lane.q, breakAt); d++) {
          ctx.fillStyle = d > 16 ? RED : d > 8 ? OC : INK2;
          const col = d % cols;
          const row = Math.floor(d / cols);
          ctx.beginPath();
          ctx.arc(x + (s.n === 3 ? 30 : 24) + col * dotGap, H - 130 - row * 24, 7, 0, Math.PI * 2);
          ctx.fill();
        }
        display(ctx, 22);
        ctx.fillStyle = locked ? RED : INK2;
        ctx.fillText(keys[i], x + lw / 2 - 7, H - 66);
        mono(ctx, 11);
        ctx.fillStyle = INK3;
        ctx.fillText(`N${i + 1} · ${lane.q}`, x + 8, 58);
        // beat window: serving again right now is a cache hit
        if (s.t - lane.lastServe < 0.55 && !locked) {
          ctx.fillStyle = OH;
          ctx.fillRect(x, 36, lw * (1 - (s.t - lane.lastServe) / 0.55), 2);
        }
        // burst telegraph
        if (s.burst && s.burst.lane === i && s.burst.tele > 0) {
          ctx.globalAlpha = s.burst.tele % 0.3 < 0.15 ? 0.95 : 0.4;
          mono(ctx, 11);
          ctx.fillStyle = OH;
          ctx.fillText('▼ BURST', x + lw / 2 - 24, 34);
          ctx.globalAlpha = 1;
        }
      }
      const lat = latency();
      mono(ctx, 13);
      ctx.fillStyle = lat > 10 ? RED : GREEN;
      ctx.fillText(`p99 ${lat.toFixed(1)}ms ${lat > 10 ? '· DEGRADED' : '· HEALTHY'}`, 40, H - 24);
      ctx.fillStyle = BASE;
      ctx.fillRect(220, H - 36, 320, 14);
      ctx.fillStyle = lat > 10 ? RED : OF;
      ctx.fillRect(220, H - 36, Math.min(320, (lat / 20) * 320), 14);
      ctx.strokeStyle = INK3;
      ctx.beginPath();
      ctx.moveTo(220 + 160, H - 40);
      ctx.lineTo(220 + 160, H - 18);
      ctx.stroke();
    },

    score: () => s.pts,
    hud: () => `SERVED ${s.served} · p99 ${latency().toFixed(1)}MS${s.n === 4 ? ' · 4 NODES' : ''}`,
    events: () => evs,
    onRoundEnd: (): RoundStats => ({
      display: [
        { label: 'REQUESTS SERVED', value: String(s.served) },
        { label: 'CACHE HITS', value: String(s.cacheHits) },
        { label: 'BREAKERS TRIPPED', value: String(s.breakers) },
        { label: 'p99 HELD UNDER 10MS', value: `${Math.round((s.under10 / Math.max(0.01, s.t)) * 100)}%` },
      ],
      tallies: {
        served: s.served,
        cacheHits: s.cacheHits,
        breakers: s.breakers,
        shed: s.shed,
        peakQ: s.peakQ,
        under10Pct: Math.round((s.under10 / Math.max(0.01, s.t)) * 100),
        bestStreak: fx.combo.best,
        scaledOut: s.n === 4 ? 1 : 0,
      },
    }),
  };
}
