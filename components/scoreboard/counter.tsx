'use client';

import { useEffect, useRef, useState } from 'react';

/*
  Counter tile numeral: rolls 0 → value over --dur-counter (800ms) on first
  paint. Reduced motion (or JS off — the value is server-rendered as the
  fallback) renders the final value instantly.
*/

export function Counter({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;

    const reduce = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    if (reduce || value === 0) return;

    const start = performance.now();
    const dur = 800;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      // ease-out: fast start, settle at the end.
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(eased * value));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <>{display}</>;
}
