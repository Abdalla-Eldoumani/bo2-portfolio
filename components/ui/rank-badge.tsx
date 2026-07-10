import type { Ref } from "react";

// rank-badge: the original `rank-*` insigniaId -> escalating rank glyph resolver
// (RECORD-01) plus the education IntelMark. Server-safe (no "use client", no
// useId — a plain resolver mirroring Insignia/RankInsignia). It EXTENDS the hero
// RankInsignia vocabulary — same flat-top hex frame, same chevron/rocker
// coordinates — by rendering the TOP N primitives of the hero stack per rank; it
// never redraws the hero (rank-insignia.tsx is untouched). Every stroke is
// currentColor so the consumer tints via a text-* utility and it remaps under
// forced-colors; the consumer sizes via w-/h- (32px inactive / 48px current).
// Seniority is carried by chevron/rocker COUNT + badge SIZE, NEVER by color, so
// the progression survives forced-colors and reads for a colour-blind viewer.
// Root <svg> is aria-hidden + focusable="false" — identity is the real <h3>, not
// the crest. Original geometry only (QUAL-04): no game emblem, no traced asset,
// no icon-library path, no emoji.

// The hero's flat-top hex frame on the 48 grid (rank-insignia.tsx), reused
// verbatim so every ladder badge aligns on the shared grid.
const HEX_FRAME = "M 14 7 L 34 7 L 44 24 L 34 41 L 14 41 L 4 24 Z";

// The hero chevron stack (apex y 13/19/25, step 6) top-to-bottom + the rocker
// bar, reused verbatim. The band table renders the TOP N of this stack per rank.
const CHEVRONS = [
  "M 15 20 L 24 13 L 33 20",
  "M 15 26 L 24 19 L 33 26",
  "M 15 32 L 24 25 L 33 32",
];
const ROCKER = "M 17 37 L 31 37";

// Additive band table (RECORD-01), monotonic: more primitives = more senior.
// The current instructor adds the rocker (the full hero interior — "your lobby
// crest is your current rank"); each lower rung drops one chevron.
const BANDS: Record<string, { chevrons: number; rocker: boolean }> = {
  "rank-instructor": { chevrons: 3, rocker: true }, // 3 chevrons + rocker
  "rank-specialist": { chevrons: 3, rocker: false }, // 3 chevrons
  "rank-fellow": { chevrons: 2, rocker: false }, // 2 chevrons
  "rank-mentor": { chevrons: 1, rocker: false }, // 1 chevron
};

// Education intel/clearance interior — horizontal dossier bars, deliberately a
// document motif and NOT a chevron rank glyph, drawn in the same hex frame.
const INTEL_BARS = ["M 15 19 L 33 19", "M 15 25 L 33 25", "M 15 31 L 27 31"];

// Stroke scales with the consumer size so the whole grid stays crisp: ~2px at
// the 32px rung (viewBox 48 -> 3 * 32/48) and ~2.5px at the 48px active rung.
function RankGrid({
  ref,
  className,
  strokeWidth,
  children,
}: Readonly<{
  ref?: Ref<SVGSVGElement>;
  className?: string;
  strokeWidth: number;
  children: React.ReactNode;
}>) {
  return (
    <svg
      ref={ref}
      viewBox="0 0 48 48"
      aria-hidden="true"
      focusable="false"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinejoin="miter"
    >
      <path d={HEX_FRAME} />
      {children}
    </svg>
  );
}

export function RankBadge({
  id,
  active,
  className,
  ref,
}: Readonly<{
  id?: string;
  active?: boolean;
  className?: string;
  ref?: Ref<SVGSVGElement>;
}>) {
  const band = id ? BANDS[id] : undefined;
  return (
    <RankGrid ref={ref} className={className} strokeWidth={active ? 2.5 : 3}>
      {/* Unknown / unset id degrades to the bare hex frame — never throws, never
          blank (mirrors the Insignia neutral mark). */}
      {band ? (
        <>
          {CHEVRONS.slice(0, band.chevrons).map((d) => (
            <path key={d} d={d} />
          ))}
          {band.rocker ? <path d={ROCKER} /> : null}
        </>
      ) : null}
    </RankGrid>
  );
}

export function IntelMark({
  className,
  ref,
}: Readonly<{ className?: string; ref?: Ref<SVGSVGElement> }>) {
  return (
    <RankGrid ref={ref} className={className} strokeWidth={3}>
      {INTEL_BARS.map((d) => (
        <path key={d} d={d} />
      ))}
    </RankGrid>
  );
}
