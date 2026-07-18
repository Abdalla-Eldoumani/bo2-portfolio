import {
  type Fx,
  W,
  H,
  INK,
  INK2,
  INK3,
  OC,
  OH,
  GREEN,
  RED,
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
  BUDGET BUDDY · MARKET RUN — one position, one ticker. News is
  telegraphed as a headline before the move lands: read it, position,
  profit. Volatility regimes rotate every seven seconds, every trade
  costs a fee so spam-clicking bleeds, and holding SPACE runs 2×
  leverage — both directions.
*/

const FEE = 0.4;

type Regime = { name: string; drift: number; vol: number };
const REGIMES: Regime[] = [
  { name: 'CALM', drift: 0, vol: 1.1 },
  { name: 'CHOPPY', drift: 0, vol: 2.7 },
  { name: 'TRENDING UP', drift: 0.5, vol: 1.4 },
  { name: 'TRENDING DOWN', drift: -0.5, vol: 1.4 },
];

type News = { headline: string; move: number };
const NEWS_UP = [
  'EARNINGS BEAT — GUIDANCE RAISED',
  'RATE CUT WHISPERS SPREAD',
  'SURPRISE BUYBACK ANNOUNCED',
];
const NEWS_DOWN = [
  'REGULATOR OPENS PROBE',
  'CFO RESIGNS OVERNIGHT',
  'GUIDANCE SLASHED AT THE BELL',
];

export function marketRun(fx: Fx, veteran = false): Game {
  const evs: SimEvent[] = [];
  fx.combo.set({ window: 9, step: 2, maxMult: 3 });
  // veteran mode runs hotter: wild tape, fat fees
  const fee = veteran ? FEE * 1.5 : FEE;
  const s = {
    prices: [100] as number[],
    holding: false,
    entry: 0,
    posPl: 0,
    posLow: 0,
    cash: 0,
    fees: 0,
    trades: 0,
    bestTrade: 0,
    worstTrade: 0,
    cleanExits: 0,
    newsRides: 0,
    marks: [] as { i: number; price: number; buy: boolean }[],
    regime: REGIMES[0],
    regimeT: 7,
    news: null as null | (News & { tele: number; steps: number }),
    newsNext: 5,
    lev: false,
    t: 0,
  };
  let acc = 0;

  const price = () => s.prices[s.prices.length - 1];

  const step = () => {
    const last = price();
    let d =
      s.regime.drift + (Math.random() - 0.5) * 2 * s.regime.vol * (veteran ? 1.35 : 1);
    if (s.news && s.news.tele <= 0 && s.news.steps > 0) {
      d += s.news.move / 9;
      s.news.steps -= 1;
      if (s.news.steps === 0) {
        if (s.holding && s.posPl > 0) {
          s.newsRides += 1;
          evs.push({ kind: 'hazard', label: 'NEWS RIDE' });
        }
        s.news = null;
      }
    }
    const next = Math.max(60, Math.min(150, last + d));
    if (s.holding) {
      s.posPl += (next - last) * (s.lev ? 2 : 1);
      s.posLow = Math.min(s.posLow, s.posPl);
    }
    s.prices.push(next);
    if (s.prices.length > 130) {
      s.prices.shift();
      for (const m of s.marks) m.i -= 1;
      while (s.marks.length && s.marks[0].i < 0) s.marks.shift();
    }
  };

  const trade = () => {
    const p = price();
    s.fees += fee;
    s.trades += 1;
    if (!s.holding) {
      s.holding = true;
      s.entry = p;
      s.posPl = -fee;
      s.posLow = 0;
    } else {
      s.holding = false;
      const net = s.posPl - fee;
      s.cash += net;
      s.bestTrade = Math.max(s.bestTrade, net);
      s.worstTrade = Math.min(s.worstTrade, net);
      if (net > 0) {
        fx.combo.add();
        fx.text(W - 120, 60, `+$${net.toFixed(2)}`, { color: GREEN });
        if (net >= 8) {
          s.cleanExits += 1;
          evs.push({ kind: 'perfect', label: 'CLEAN EXIT' });
          fx.burst(W - 120, 76, { color: GREEN, n: 12, speed: 150 });
        }
        if (s.posLow <= -4) {
          evs.push({ kind: 'near-miss', label: 'RECOVERED', x: W - 120, y: 92 });
        }
      } else {
        fx.text(W - 120, 60, `−$${Math.abs(net).toFixed(2)}`, { color: RED });
        const broken = fx.combo.break();
        if (broken >= 2) evs.push({ kind: 'combo-break', value: broken });
      }
    }
    s.marks.push({ i: s.prices.length - 1, price: p, buy: s.holding });
    if (s.marks.length > 12) s.marks.shift();
  };

  return {
    update(dt, input) {
      s.t += dt;
      s.lev = input.held;
      acc += dt;
      while (acc > 0.1) {
        acc -= 0.1;
        step();
      }

      s.regimeT -= dt;
      if (s.regimeT <= 0) {
        s.regimeT = 7;
        const next = REGIMES[Math.floor(Math.random() * REGIMES.length)];
        if (next.name !== s.regime.name) {
          s.regime = next;
          fx.announce(`REGIME: ${next.name}`);
          evs.push({ kind: 'milestone', label: next.name });
        }
      }

      if (s.news) {
        if (s.news.tele > 0) s.news.tele -= dt;
      } else {
        s.newsNext -= dt;
        if (s.newsNext <= 0) {
          s.newsNext = 6 + Math.random() * 3;
          const up = Math.random() < 0.5;
          const pool = up ? NEWS_UP : NEWS_DOWN;
          s.news = {
            headline: pool[Math.floor(Math.random() * pool.length)],
            move: (up ? 1 : -1) * (13 + Math.random() * 7),
            tele: 1.4,
            steps: 9,
          };
        }
      }

      if (input.pressed.includes('Enter') || input.tap) trade();
    },

    draw(ctx) {
      ctx.fillStyle = SHADOW;
      ctx.fillRect(0, 0, W, H);
      const x0 = 50, x1 = W - 40, y0 = 78, y1 = H - 90;
      const px = (i: number) => x0 + (i / 129) * (x1 - x0);
      const py = (p: number) => y1 - ((p - 60) / 90) * (y1 - y0);
      ctx.strokeStyle = MID;
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = 1;
      for (let gy = 0; gy <= 3; gy++) {
        ctx.beginPath();
        ctx.moveTo(x0, y0 + (gy * (y1 - y0)) / 3);
        ctx.lineTo(x1, y0 + (gy * (y1 - y0)) / 3);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // news ticker strip (below the harness HUD line)
      if (s.news) {
        const flash = s.news.tele > 0 && s.news.tele % 0.34 < 0.17;
        mono(ctx, 12);
        ctx.fillStyle = flash ? OH : s.news.tele > 0 ? INK2 : OC;
        ctx.fillText(`NEWS // ${s.news.headline}`, x0, 44);
      } else {
        mono(ctx, 11);
        ctx.fillStyle = INK3;
        ctx.fillText(`REGIME: ${s.regime.name} · TRADE FEE $${fee.toFixed(2)}`, x0, 44);
      }

      ctx.strokeStyle = OC;
      ctx.lineWidth = 2;
      ctx.beginPath();
      s.prices.forEach((p, i) => {
        if (i === 0) ctx.moveTo(px(i), py(p));
        else ctx.lineTo(px(i), py(p));
      });
      ctx.stroke();
      const last = price();

      for (const m of s.marks) {
        ctx.fillStyle = m.buy ? GREEN : RED;
        ctx.beginPath();
        ctx.moveTo(px(m.i), py(m.price) + (m.buy ? 8 : -8));
        ctx.lineTo(px(m.i) - 5, py(m.price) + (m.buy ? 16 : -16));
        ctx.lineTo(px(m.i) + 5, py(m.price) + (m.buy ? 16 : -16));
        ctx.closePath();
        ctx.fill();
      }

      if (s.holding) {
        const pl = s.posPl;
        ctx.fillStyle = pl >= 0 ? GREEN : RED;
        ctx.globalAlpha = 0.18;
        const ey = py(s.entry), ly = py(last);
        ctx.fillRect(x0, Math.min(ey, ly), x1 - x0, Math.abs(ey - ly) || 2);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = INK3;
        ctx.setLineDash([4, 5]);
        ctx.beginPath();
        ctx.moveTo(x0, ey);
        ctx.lineTo(x1, ey);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.arc(px(s.prices.length - 1), py(last), 4, 0, Math.PI * 2);
      ctx.fill();

      mono(ctx, 13);
      ctx.fillStyle = INK2;
      ctx.fillText(`PRICE $${last.toFixed(2)}`, x0, 64);
      ctx.fillStyle = s.holding ? OC : INK3;
      ctx.fillText(
        s.holding ? `HOLDING FROM $${s.entry.toFixed(2)} — ↵ SELL` : '↵ BUY',
        x0 + 150,
        64,
      );
      if (s.lev) {
        ctx.fillStyle = OH;
        ctx.fillText('LEV ×2', x0 + 400, 64);
      }
      const pl = s.cash + (s.holding ? s.posPl : 0);
      display(ctx, 26);
      ctx.fillStyle = pl >= 0 ? GREEN : RED;
      ctx.fillText(`P/L ${pl >= 0 ? '+' : '−'}$${Math.abs(pl).toFixed(2)}`, x0, H - 40);
      mono(ctx, 11);
      ctx.fillStyle = INK3;
      ctx.fillText(`FEES $${s.fees.toFixed(2)} · TRADES ${s.trades}`, x0 + 220, H - 44);
    },

    score: () => Math.round(s.cash + (s.holding ? s.posPl : 0)),
    hud: () => `${s.holding ? 'POSITION: LONG' : 'POSITION: FLAT'}${s.lev ? ' · LEV ×2' : ''}`,
    events: () => evs,
    onRoundEnd: (): RoundStats => {
      const pl = s.cash + (s.holding ? s.posPl : 0);
      return {
        display: [
          { label: 'CLOSING P/L', value: `${pl >= 0 ? '+' : '−'}$${Math.abs(pl).toFixed(2)}` },
          { label: 'TRADES', value: String(s.trades) },
          { label: 'FEES PAID', value: `$${s.fees.toFixed(2)}` },
          { label: 'BEST TRADE', value: `+$${s.bestTrade.toFixed(2)}` },
        ],
        tallies: {
          pl: Math.round(pl),
          trades: s.trades,
          cleanExits: s.cleanExits,
          newsRides: s.newsRides,
          bestTrade: Math.round(s.bestTrade),
          bestStreak: fx.combo.best,
        },
      };
    },
  };
}
