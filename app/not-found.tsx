import Link from "next/link";

// The 404 disconnect screen (SYS-01) — a standalone Server render modelled on
// BO2's understated "Connection Interrupted". No rail (the lobby rail is not
// mounted here, like /resume), and NO `metadata` export: Next App Router forbids
// metadata on a global not-found (it renders inside the root layout), so the
// screen inherits the layout default title/OG. The layout still wraps it with the
// skip-link + fonts + JSON-LD, so this screen exposes the <main id="main-content"
// tabIndex={-1}> the skip-link targets.
//
// Register: mostly monochrome, one orange (the RECONNECT link home), red only as
// a restrained thread (the broken-hex glyph's inner core) — never a full-screen
// wash (the one-competing-element rule). The disconnect glyph is ORIGINAL inline
// geometry (QUAL-04, no game asset), aria-hidden; the real <h1> carries the
// message. Vertical rhythm per UI-SPEC: symbol -> 24px -> h1 -> 8px -> status ->
// 8px -> sub-copy -> 32px -> CTA.

// Original broken-hex disconnect glyph: a flat-top hex frame split at the top
// edge (the "severed link") with a small --color-danger inner core (the red
// thread). Decorative — aria-hidden + focusable="false"; the <h1> names the
// state. Strokes are currentColor so the frame inherits --color-ink-secondary
// from the consumer and remaps under forced-colors; the core path tints itself
// --color-danger via its own text-* class (color cascades to currentColor).
function DisconnectGlyph() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 48 48"
      className="h-14 w-14 text-ink-secondary"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M 21 10 L 14 10 L 4 24 L 14 38 L 34 38 L 44 24 L 34 10 L 27 10" />
      <path
        className="text-danger"
        d="M 24 21 L 27 24 L 24 27 L 21 24 Z"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}

export default function NotFound() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="hero-fill flex items-center justify-center bg-void px-5 py-16"
    >
      <div className="mx-auto flex w-full max-w-[520px] flex-col items-center text-center">
        <DisconnectGlyph />

        <h1 className="boot-slice mt-6 font-display text-h2 uppercase leading-[1.2] tracking-[0.04em] text-ink sm:text-h1">
          Connection Interrupted
        </h1>

        <p className="mt-2 font-mono text-data uppercase tabular-nums leading-[1.4] text-ink-muted">
          ERR 404 — Route Not Found
        </p>

        <p className="mt-2 max-w-[68ch] font-body text-body leading-[1.6] text-ink-secondary">
          The route you requested is off the network. Reconnect to return to the
          lobby.
        </p>

        {/* The screen's ONE orange: an accent-on-transparent chip that fills
            --color-accent with --color-void text on hover (the skip-link/deploy
            precedent — no new global CSS). <Link> renders a real <a href="/"> so
            it works with JS off (SYS-03). */}
        <Link
          href="/"
          className="group chamfer press-flash tap-target mt-8 inline-flex hover:[--_fill:var(--color-accent)]"
          style={
            {
              "--_c": "var(--chamfer-sm)",
              "--_edge": "var(--color-accent)",
              "--_fill": "var(--color-void)",
            } as React.CSSProperties
          }
        >
          <span className="relative z-[1] inline-flex items-center px-6 py-3 font-display text-button uppercase tracking-[0.04em] text-accent group-hover:text-void">
            Reconnect
          </span>
        </Link>
      </div>
    </main>
  );
}
