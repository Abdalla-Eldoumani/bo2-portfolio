import { HexGrid } from "@/components/ui/hex-grid";
import { Scanline } from "@/components/ui/scanline";
import { RankInsignia } from "@/components/ui/rank-insignia";
import { siteConfig } from "@/lib/site-config";
import { bio } from "@/lib/data/bio";

// Lobby calling card (#lobby) — the full-viewport hero and the page's single
// <h1>. Server Component: no "use client", no client JS. The gamertag carries
// .boot-slice (a pure-CSS one-shot whose no-animation frame IS the resting
// state, so reduced-motion lands it instantly). Decorative overlays are
// aria-hidden and sit behind the z-10 content column; the deploy prompt is the
// LAST flex child in normal flow (never fixed/absolute) so an iOS address-bar
// collapse shrinks the column without clipping it (HERO-03). Orange is spent on
// exactly one element here — the deploy CTA — so the insignia stays steel.

const callsign = siteConfig.callsign;

export function LobbyHero() {
  return (
    <section
      id="lobby"
      aria-labelledby="lobby-heading"
      className="hero-fill relative flex flex-col overflow-hidden bg-void"
    >
      {/* Decorative layers: aria-hidden (set internally), absolute inset-0,
          behind the z-10 content. Scanline auto-removes <768px + reduced-motion. */}
      <HexGrid className="text-line-strong" />
      <Scanline />

      {/* Identity block: vertically centered in the flex-1 region, within the
          1200px content constant, single column with no overflow at 320px. */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-5 py-16">
        {/* Grouped rhythm, not a uniform gap: name+role read as one unit (24px),
            the meta pair sits a step further (32px), status hangs off the meta
            group (16px). All values on the spacing rungs. */}
        <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center text-center">
          <RankInsignia className="h-[72px] w-[72px] text-ink-secondary" />

          <h1
            id="lobby-heading"
            className="boot-slice mt-8 text-balance font-display text-[clamp(2.125rem,8vw,6rem)] uppercase leading-[1.05] tracking-[0.04em] text-ink"
          >
            {siteConfig.name}
          </h1>

          <p className="mt-6 font-display text-lead uppercase tracking-[0.04em] text-ink-secondary sm:text-h3">
            {siteConfig.jobTitle}
          </p>

          <div className="mt-8 flex flex-col items-center gap-2 sm:flex-row sm:gap-4">
            <span className="font-label text-label uppercase tracking-[0.08em] text-ink-secondary">
              {bio.station}
            </span>
            <span className="font-mono text-data tabular-nums text-ink-secondary">
              {callsign}
            </span>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <span
              aria-hidden="true"
              className="h-2 w-2 rounded-full bg-online"
            />
            <span className="font-label text-stat-label uppercase tracking-[0.08em] text-ink-secondary">
              Active
            </span>
          </div>
        </div>
      </div>

      {/* Deploy prompt: in-flow LAST flex child (no fixed/absolute). Static
          presentational markup this phase — the Enter/tap wiring lands with the
          Phase-4 rail. The single orange element in this viewport. */}
      <div className="relative z-10 flex justify-center px-5 pb-8 sm:pb-12">
        <span
          className="tap-target chamfer inline-flex items-center px-6 py-3"
          style={
            {
              "--_c": "var(--chamfer-sm)",
              "--_edge": "var(--color-accent)",
              "--_fill": "var(--color-void)",
            } as React.CSSProperties
          }
        >
          <span className="relative z-[1] inline-flex items-center gap-2 font-label text-data uppercase tracking-[0.08em] text-accent">
            <svg
              aria-hidden="true"
              viewBox="0 0 8 8"
              className="h-2 w-2 fill-current"
            >
              <path d="M1 0 L7 4 L1 8 Z" />
            </svg>
            Press Enter / Tap to Deploy
          </span>
        </span>
      </div>
    </section>
  );
}
