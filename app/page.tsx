import { Panel } from "@/components/ui/panel";
import { Selector } from "@/components/ui/selector";
import { HitMarker } from "@/components/ui/hit-marker";
import { HexGrid } from "@/components/ui/hex-grid";
import { Scanline } from "@/components/ui/scanline";
import { siteConfig } from "@/lib/site-config";

// Foundation proof surface: mounts the four font utilities, the aria-hidden
// decorative overlays, and the three visible primitives so the design-system
// substrate renders and is browser-verifiable end to end. Server Component with
// no client JS — the selector shows its static active state and the hit-marker
// is paint-only. Temporary substrate proof, replaced by the real lobby-hero
// section. Accent lands on one element per viewport: the active selector row.

const PROOF_SELECTOR = [
  { label: "Overview", subtitle: "Foundation substrate" },
  { label: "Primitives", subtitle: "Panel, selector, marker" },
  { label: "Overlays", subtitle: "Hex-grid, scanline" },
] as const;

export default function Home() {
  return (
    <main className="relative min-h-dvh bg-void">
      <HexGrid className="text-line-strong" />
      <Scanline />

      <div className="relative z-10 mx-auto w-full max-w-5xl px-5 py-16 sm:px-8 sm:py-24">
        <p className="font-label text-label uppercase tracking-[0.08em] text-ink-secondary">
          Design-system substrate
        </p>
        <h1 className="mt-3 text-balance font-display text-h2 uppercase leading-[1.1] tracking-[0.04em] text-ink sm:text-h1 lg:text-display">
          {siteConfig.name}
        </h1>
        <p className="mt-4 max-w-[68ch] font-body text-ink-secondary">
          Foundation proof surface. The design-system substrate — fonts, tokens,
          decorative overlays, and the core primitives — mounted end to end for
          browser verification.
        </p>

        <div className="mt-12 grid gap-6 sm:mt-16 sm:grid-cols-2">
          <div className="grid grid-cols-2 gap-3">
            <Panel>
              <div className="flex flex-col gap-2 p-4 sm:p-5">
                <span className="font-label text-stat-label uppercase tracking-[0.08em] text-ink-secondary">
                  Primitives
                </span>
                <span className="font-mono text-h3 tabular-nums text-ink">05</span>
              </div>
            </Panel>
            <Panel active>
              <div className="flex flex-col gap-2 p-4 sm:p-5">
                <span className="font-label text-stat-label uppercase tracking-[0.08em] text-ink-secondary">
                  Typefaces
                </span>
                <span className="font-mono text-h3 tabular-nums text-ink">04</span>
              </div>
            </Panel>
          </div>

          <Panel className="sm:row-span-2">
            <div className="p-3">
              <Selector
                variant="nav"
                activeIndex={0}
                items={PROOF_SELECTOR}
                aria-label="Foundation proof selector"
              />
            </div>
          </Panel>

          <HitMarker>
            <Panel chamfer="sm">
              <div className="flex flex-col gap-1 p-4">
                <span className="font-display text-lead uppercase tracking-[0.04em] text-ink">
                  Hit marker
                </span>
                <span className="font-body text-data text-ink-secondary">
                  Paint-only press feedback.
                </span>
              </div>
            </Panel>
          </HitMarker>
        </div>
      </div>
    </main>
  );
}
