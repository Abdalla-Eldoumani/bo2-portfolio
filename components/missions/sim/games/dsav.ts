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
  DSAV · SORT SPRINT — you are the comparator. The scan walks each
  adjacent pair exactly like the visualizer animates it: comparing pair
  lit, your call — KEEP or SWAP. A full clean pass turns the array
  green and deals a bigger one. Two arrays in, the MERGE WAVE starts
  dealing sorted halves and your two buttons become "take left head"
  and "take right head". Same colors the visualizer uses: comparing,
  swapping, sorted.
*/

type Mode = 'scan' | 'merge';

export function sortSprint(fx: Fx, veteran = false): Game {
  const evs: SimEvent[] = [];
  fx.combo.set({ window: 4, step: 4, maxMult: 3 });

  const s = {
    mode: 'scan' as Mode,
    bars: [] as number[],
    i: 0, // comparing index (pair i, i+1)
    clock: 0,
    clockMax: 1.5,
    pts: 0,
    decisions: 0,
    correct: 0,
    wrong: 0,
    arrays: 0,
    merges: 0,
    size: 5,
    swapFlash: 0, // brief orange on the pair after a swap
    sortedFlash: 0, // green sweep on completion
    // merge wave state
    left: [] as number[],
    right: [] as number[],
    out: [] as number[],
    feedback: 0,
    feedbackGood: true,
  };

  const rand = (n: number) => Math.floor(Math.random() * n);

  const windowFor = () =>
    Math.max(veteran ? 0.65 : 0.8, (veteran ? 1.25 : 1.5) - s.decisions * 0.02);

  const dealArray = () => {
    s.mode = 'scan';
    const n = Math.min(8, s.size + (veteran ? 1 : 0));
    const vals = Array.from({ length: n }, (_, k) => k + 1);
    // shuffle until not already sorted
    do {
      for (let k = vals.length - 1; k > 0; k--) {
        const j = rand(k + 1);
        [vals[k], vals[j]] = [vals[j], vals[k]];
      }
    } while (vals.every((v, k) => k === 0 || vals[k - 1] <= v));
    s.bars = vals;
    s.i = 0;
    s.clockMax = windowFor();
    s.clock = s.clockMax;
  };

  const dealMerge = () => {
    s.mode = 'merge';
    const n = 4 + Math.min(2, s.merges);
    const pool = Array.from({ length: n * 2 }, (_, k) => k + 1);
    for (let k = pool.length - 1; k > 0; k--) {
      const j = rand(k + 1);
      [pool[k], pool[j]] = [pool[j], pool[k]];
    }
    s.left = pool.slice(0, n).sort((a, b) => a - b);
    s.right = pool.slice(n).sort((a, b) => a - b);
    s.out = [];
    s.clockMax = windowFor() + 0.2;
    s.clock = s.clockMax;
  };

  const isSorted = () => s.bars.every((v, k) => k === 0 || s.bars[k - 1] <= v);

  const advanceScan = () => {
    s.i += 1;
    if (s.i >= s.bars.length - 1) {
      if (isSorted()) {
        s.arrays += 1;
        s.pts += 5;
        s.sortedFlash = 0.7;
        fx.freeze();
        fx.announce('SORTED', `ARRAY ${s.arrays} LOCKED GREEN`);
        fx.burst(W / 2, H / 2, { color: GREEN, n: 16, speed: 170 });
        evs.push({ kind: 'milestone', label: 'SORTED' });
        s.size = Math.min(8, s.size + 1);
        if (s.arrays >= 2 && s.arrays % 2 === 0) dealMerge();
        else dealArray();
        return;
      }
      s.i = 0; // next bubble pass
    }
    s.clockMax = windowFor();
    s.clock = s.clockMax;
  };

  const judgeScan = (saidSwap: boolean | null) => {
    const a = s.bars[s.i];
    const b = s.bars[s.i + 1];
    const shouldSwap = a > b;
    s.decisions += 1;
    const right = saidSwap !== null && saidSwap === shouldSwap;
    s.feedback = 0.3;
    s.feedbackGood = right;
    if (right) {
      s.correct += 1;
      const gained = fx.combo.mult();
      s.pts += gained;
      fx.combo.add();
      fx.text(barX(s.i) + 20, barTop(Math.max(a, b)) - 12, `+${gained}`, { color: OC });
      if (s.clock / s.clockMax > 0.7) evs.push({ kind: 'perfect', label: 'SNAP CALL' });
    } else {
      s.wrong += 1;
      s.pts = Math.max(0, s.pts - 1);
      const broken = fx.combo.break();
      if (broken >= 3) evs.push({ kind: 'combo-break', value: broken });
      fx.shake(2.5);
      fx.text(barX(s.i) + 20, 70, saidSwap === null ? 'TIMED OUT −1' : shouldSwap ? 'NEEDED SWAP −1' : 'WAS ORDERED −1', { color: RED });
      evs.push({ kind: 'hazard', label: 'MISCOMPARE' });
    }
    // the array takes YOUR action — a bad comparator breaks the sort
    if (saidSwap === true) {
      [s.bars[s.i], s.bars[s.i + 1]] = [s.bars[s.i + 1], s.bars[s.i]];
      s.swapFlash = 0.25;
      fx.burst(barX(s.i + 1), barTop(s.bars[s.i + 1]), { color: OC, n: 6, speed: 90 });
    }
    advanceScan();
  };

  const judgeMerge = (tookLeft: boolean | null) => {
    if (s.left.length === 0 || s.right.length === 0) return;
    const shouldLeft = s.left[0] <= s.right[0];
    s.decisions += 1;
    const right = tookLeft !== null && tookLeft === shouldLeft;
    s.feedback = 0.3;
    s.feedbackGood = right;
    if (right) {
      s.correct += 1;
      const gained = fx.combo.mult();
      s.pts += gained;
      fx.combo.add();
    } else {
      s.wrong += 1;
      const broken = fx.combo.break();
      if (broken >= 3) evs.push({ kind: 'combo-break', value: broken });
      fx.shake(2.5);
      fx.text(W / 2, H / 2 - 40, tookLeft === null ? 'TIMED OUT' : 'WRONG HEAD', { color: RED });
      evs.push({ kind: 'hazard', label: 'WRONG HEAD' });
    }
    // the merge takes the smaller head regardless, like the visualizer
    s.out.push(shouldLeft ? (s.left.shift() as number) : (s.right.shift() as number));
    if (s.left.length === 0 || s.right.length === 0) {
      s.out.push(...s.left, ...s.right);
      s.left = [];
      s.right = [];
      s.merges += 1;
      s.pts += 4;
      fx.freeze();
      fx.announce('MERGED', 'HALVES FOLDED IN ORDER');
      fx.burst(W / 2, H - 110, { color: GREEN, n: 14, speed: 150 });
      evs.push({ kind: 'streak', label: 'MERGED', value: s.merges });
      dealArray();
      return;
    }
    s.clockMax = windowFor() + 0.2;
    s.clock = s.clockMax;
  };

  const barX = (k: number) => {
    const bw = Math.min(64, (W - 120) / s.bars.length);
    const total = s.bars.length * bw;
    return (W - total) / 2 + k * bw;
  };
  const barTop = (v: number) => 250 - v * 20;

  dealArray();

  return {
    update(dt, input) {
      s.feedback = Math.max(0, s.feedback - dt);
      s.swapFlash = Math.max(0, s.swapFlash - dt);
      s.sortedFlash = Math.max(0, s.sortedFlash - dt);
      s.clock -= dt;
      if (s.clock <= 0) {
        if (s.mode === 'scan') judgeScan(null);
        else judgeMerge(null);
        return;
      }
      const left = input.pressed.includes('ArrowLeft');
      const right = input.pressed.includes('ArrowRight');
      const tapLeft = input.tap ? input.tap.x < W / 2 : null;
      if (s.mode === 'scan') {
        // ← keep, → swap
        if (left) judgeScan(false);
        else if (right) judgeScan(true);
        else if (tapLeft !== null) judgeScan(!tapLeft);
      } else {
        // ← take left head, → take right head
        if (left) judgeMerge(true);
        else if (right) judgeMerge(false);
        else if (tapLeft !== null) judgeMerge(tapLeft);
      }
    },

    draw(ctx) {
      ctx.fillStyle = SHADOW;
      ctx.fillRect(0, 0, W, H);

      if (s.mode === 'scan') {
        const bw = Math.min(64, (W - 120) / s.bars.length);
        s.bars.forEach((v, k) => {
          const x = barX(k);
          const top = barTop(v);
          const comparing = k === s.i || k === s.i + 1;
          const sortedAll = s.sortedFlash > 0;
          ctx.fillStyle = sortedAll
            ? GREEN
            : comparing
              ? s.swapFlash > 0 && (k === s.i || k === s.i + 1) ? OC : OH
              : BASE;
          ctx.fillRect(x + 3, top, bw - 6, 250 - top + 40);
          ctx.strokeStyle = comparing ? OH : 'rgba(255,255,255,0.14)';
          ctx.strokeRect(x + 3, top, bw - 6, 250 - top + 40);
          mono(ctx, 11);
          ctx.fillStyle = comparing ? SHADOW : INK3;
          ctx.fillText(String(v), x + bw / 2 - 4, top + 16);
        });
        // comparator cursor
        const cx = barX(s.i) + Math.min(64, (W - 120) / s.bars.length);
        display(ctx, 15);
        ctx.fillStyle = OH;
        ctx.fillText('▼ COMPARING', cx - 46, 64);
        display(ctx, 20);
        ctx.fillStyle = GREEN;
        ctx.fillText('← KEEP', 60, H - 44);
        ctx.fillStyle = OC;
        ctx.fillText('SWAP →', W - 150, H - 44);
      } else {
        mono(ctx, 10);
        ctx.fillStyle = INK2;
        ctx.fillText('MERGE WAVE — TAKE THE SMALLER HEAD', W / 2 - 118, 66);
        const drawRow = (vals: number[], y: number, headLit: boolean, label: string) => {
          mono(ctx, 9);
          ctx.fillStyle = INK3;
          ctx.fillText(label, 70, y - 10);
          vals.forEach((v, k) => {
            const x = 70 + k * 46;
            ctx.fillStyle = k === 0 && headLit ? OH : BASE;
            ctx.fillRect(x, y, 40, 34);
            ctx.strokeStyle = k === 0 && headLit ? OH : 'rgba(255,255,255,0.14)';
            ctx.strokeRect(x, y, 40, 34);
            mono(ctx, 13);
            ctx.fillStyle = k === 0 && headLit ? SHADOW : INK;
            ctx.fillText(String(v), x + 14, y + 22);
          });
        };
        drawRow(s.left, 100, true, 'LEFT (←)');
        drawRow(s.right, 160, true, 'RIGHT (→)');
        // output row
        mono(ctx, 9);
        ctx.fillStyle = GREEN;
        ctx.fillText('OUT', 70, 230);
        s.out.forEach((v, k) => {
          const x = 70 + k * 40;
          ctx.fillStyle = GREEN;
          ctx.globalAlpha = 0.8;
          ctx.fillRect(x, 240, 34, 30);
          ctx.globalAlpha = 1;
          mono(ctx, 12);
          ctx.fillStyle = SHADOW;
          ctx.fillText(String(v), x + 11, 260);
        });
      }

      // decision clock
      const frac = Math.max(0, s.clock / s.clockMax);
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.fillRect(W / 2 - 70, H - 26, 140, 4);
      ctx.fillStyle = frac < 0.3 ? RED : FR;
      ctx.fillRect(W / 2 - 70, H - 26, 140 * frac, 4);
    },

    score: () => s.pts,
    hud: () =>
      `SORTED ${s.arrays} · MERGED ${s.merges} · CALLS ${s.correct}/${s.decisions}`,
    events: () => evs,
    onRoundEnd: (): RoundStats => {
      const acc = s.decisions > 0 ? Math.round((s.correct / s.decisions) * 100) : 0;
      return {
        display: [
          { label: 'ARRAYS SORTED', value: String(s.arrays) },
          { label: 'MERGES', value: String(s.merges) },
          { label: 'CALL ACCURACY', value: `${acc}%` },
          { label: 'WRONG CALLS', value: String(s.wrong) },
        ],
        tallies: {
          decisions: s.decisions,
          correct: s.correct,
          wrong: s.wrong,
          arrays: s.arrays,
          merges: s.merges,
          bestStreak: fx.combo.best,
        },
      };
    },
  };
}
