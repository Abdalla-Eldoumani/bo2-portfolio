import type { Ref } from "react";

// Insignia: the original insigniaId -> monochrome glyph resolver. Every project in
// lib/data/projects.ts carries a string insigniaId (no icon-library import, by
// design — lib/data/CLAUDE.md); this maps the eight ids to original inline
// geometry drawn on the 24 grid. It is the per-card mission mark AND the no-image
// placeholder centerpiece (MISSION-04). Every stroke is currentColor so the
// consumer tints it via a text-* utility and it remaps under forced-colors; the
// consumer sizes it via a size-*/w-/h- utility. The root <svg> is aria-hidden and
// focusable="false" — the glyph is decorative flavor, the card name/<h3> carries
// identity. Server-safe: no "use client", no useId (a plain resolver; many marks
// mount per view but none needs a unique id, mirroring RankInsignia/HexGrid). An
// unknown id falls back to a neutral hex mark — the resolver never throws and
// never renders blank. Original geometry only (QUAL-04): no traced game emblem,
// no icon-library path data, no emoji.

// Neutral fallback: a flat-top hex mark on the 24 grid, drawn for any id outside
// the known eight so a data typo degrades to a deliberate mark, never a blank.
const FALLBACK = <path d="M12 3 19 7.5V16.5L12 21 5 16.5V7.5Z" />;

const GLYPHS: Record<string, React.ReactNode> = {
  // Rack: two stacked server units, each with a status tick at the left face.
  server: (
    <>
      <rect x="4" y="4" width="16" height="7" rx="1" />
      <path d="M7 7.5h.01" />
      <rect x="4" y="13" width="16" height="7" rx="1" />
      <path d="M7 16.5h.01" />
    </>
  ),
  // Bolt: a single angular lightning stroke (performance mark).
  zap: <path d="M13 3 5 13h6l-2 8 11-11h-6z" />,
  // Calculator: a chamfer-less body with a readout bar over a 3x2 key field.
  calculator: (
    <>
      <rect x="6" y="3" width="12" height="18" rx="1.5" />
      <path d="M9 7h6" />
      <path d="M9.5 12h.01M12 12h.01M14.5 12h.01M9.5 16h.01M12 16h.01M14.5 16h.01" />
    </>
  ),
  // Shield: a crest outline enclosing an inset check.
  shield: (
    <>
      <path d="M12 3 20 6v5c0 5-4 8.5-8 10-4-1.5-8-5-8-10V6z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  // Star: a five-point mark on the 24 grid (featured / AI mark).
  star: (
    <path d="M12 3 14.6 9 21 9.5 16 14 17.6 20.5 12 17 6.4 20.5 8 14 3 9.5 9.4 9z" />
  ),
  // Gamepad: a rounded controller body with a d-pad cross and two action pips.
  gamepad: (
    <>
      <rect x="3" y="8" width="18" height="9" rx="4.5" />
      <path d="M7 12v2M6 13h2" />
      <path d="M15.5 12h.01M17.5 14h.01" />
    </>
  ),
  // Cpu: a chip die with an inner core and eight edge pins.
  cpu: (
    <>
      <rect x="7" y="7" width="10" height="10" rx="1" />
      <path d="M10 10h4v4h-4z" />
      <path d="M9.5 4v3M14.5 4v3M9.5 17v3M14.5 17v3M4 9.5h3M4 14.5h3M17 9.5h3M17 14.5h3" />
    </>
  ),
  // Cart: a shopping-cart silhouette over two wheels.
  cart: (
    <>
      <path d="M4 5h2l1.6 9.5h9l1.6-7H7" />
      <path d="M9 19h.01M17 19h.01" />
    </>
  ),
};

export function Insignia({
  id,
  className,
  ref,
}: Readonly<{ id: string; className?: string; ref?: Ref<SVGSVGElement> }>) {
  return (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {GLYPHS[id] ?? FALLBACK}
    </svg>
  );
}
