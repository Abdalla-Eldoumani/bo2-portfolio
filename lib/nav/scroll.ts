// Client scroll/hash helpers for the menu-rail island (plan 04-04) and the
// deploy CTA's controlled activation. These are DOM-using (window/history/
// document), so — unlike the pure lib/nav modules — they are NOT node-unit-
// tested; they are verified at the browser gate. No "use client" directive: the
// importing island owns the client boundary, and a plain module stays importable
// without pulling in jsdom for a Vitest run.

/**
 * Whether the OS requests reduced motion at the moment of the call. Read live
 * (never cached) so a mid-session OS toggle is honored on the next activation.
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Controlled in-page activation of a section by id (a rail row or the deploy
 * CTA). No-op when the target is absent so a locked / not-yet-mounted section
 * stays graceful (the reducer contract). Otherwise scroll it into view — instant
 * under reduced motion, smooth otherwise, honoring the CSS scroll-margin-top —
 * then write the hash via replaceState (no scroll-jump, no history spam; never
 * `location.hash =`), then move focus to the section heading (which carries
 * tabindex=-1) so keyboard and screen-reader users land inside the destination
 * instead of being left behind in the rail.
 */
export function activate(targetId: string): void {
  const el = document.getElementById(targetId);
  if (!el) return;
  el.scrollIntoView({
    behavior: prefersReducedMotion() ? "auto" : "smooth",
    block: "start",
  });
  history.replaceState(null, "", "#" + targetId);
  const heading = el.querySelector<HTMLElement>("h1, h2");
  // preventScroll: focus() otherwise performs its own instant scroll, which
  // stomps the smooth scrollIntoView above on every activation.
  heading?.focus({ preventScroll: true });
}

/**
 * Build a trailing-throttled hash writer for scroll-driven active-section
 * updates. It calls replaceState at most about once per `ms` and only when the
 * id actually differs from the current location.hash. The change-guard plus the
 * throttle keep total writes under Safari's ~100-per-30s history ceiling — above
 * it Safari throws SecurityError and then disables ALL later history writes, so a
 * try/catch is not enough (RESEARCH Pitfall 2). Never uses `location.hash =`,
 * which scroll-jumps and spams the history stack.
 */
export function makeHashWriter(ms = 300): (id: string) => void {
  let last = 0;
  let pending: string | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const flush = () => {
    if (pending !== null && "#" + pending !== location.hash) {
      history.replaceState(null, "", "#" + pending);
    }
    last = Date.now();
    pending = null;
    timer = null;
  };

  return (id: string) => {
    pending = id;
    const wait = Math.max(0, ms - (Date.now() - last));
    if (timer === null) timer = setTimeout(flush, wait);
  };
}
