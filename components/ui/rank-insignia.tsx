import type { Ref } from "react";

// Rank-insignia: the original hero crest — a flat-top hexagonal frame enclosing
// an additive chevron-and-bar heraldry group, drawn as geometry only (no game
// emblem, no traced asset, no raster). Decorative flavor: the SVG sets
// aria-hidden internally because identity is carried by the real <h1>/field
// values, not the crest. Steel only — every stroke is currentColor so the
// consumer tints it via a `text-*` utility (spec: --color-ink-secondary; orange
// is spent on the deploy CTA, never here) and the crest remaps under
// forced-colors. Sized by the consumer via a w-/h- utility (72-96px hero scale).
// No useId (a static-or-no id keeps this a Server Component; one crest mounts).
// Coordinates sit on whole units of the 48 grid for crispness. Phase 7 (RECORD-01)
// extends this primitive into the five-band per-rank kit rather than redrawing.

// Flat-top hex frame on the 48 grid: top/bottom edges horizontal, points left
// and right at the vertical center (y=24). All whole units.
const HEX_FRAME =
  "M 14 7 L 34 7 L 44 24 L 34 41 L 14 41 L 4 24 Z";

// Additive heraldry: three nested up-chevrons (apex y 13/19/25, step 6) over a
// single rocker bar. Original angular geometry, miter joins for the chamfer feel.
const CHEVRONS = [
  "M 15 20 L 24 13 L 33 20",
  "M 15 26 L 24 19 L 33 26",
  "M 15 32 L 24 25 L 33 32",
].join(" ");
const ROCKER = "M 17 37 L 31 37";

export function RankInsignia({
  className,
  ref,
}: Readonly<{ className?: string; ref?: Ref<SVGSVGElement> }>) {
  return (
    <svg
      ref={ref}
      viewBox="0 0 48 48"
      aria-hidden="true"
      focusable="false"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1}
      strokeLinejoin="miter"
    >
      <path d={HEX_FRAME} />
      <path d={CHEVRONS} />
      <path d={ROCKER} />
    </svg>
  );
}
