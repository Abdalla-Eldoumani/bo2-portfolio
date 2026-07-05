import type { Ref } from "react";
import { cn } from "@/lib/utils/cn";

// Hex-grid: an original, in-project honeycomb texture — the faint background layer
// subordinate to the chamfer language (DESIGN_SYSTEM Shape language). Decorative
// only: the root is aria-hidden and inherits pointer-events:none + the 3% opacity
// ceiling from .hex-overlay (app/globals.css); it is static with no drift. The tile
// is a flat-top hexagon ~40px flat-to-flat, 1px stroke in currentColor with no fill,
// so the consumer tints it via `color` (a faint ink token) and never a hex literal.
// A rectangular unit cell (two hexagons) drawn in userSpaceOnUse repeats without a
// visible seam past 1920px. Original geometry; no game asset. One hex surface per view.

// Flat-top hexagon of side S: the flat-to-flat span is S*sqrt(3) = 40px (the cell).
// COL is the horizontal center spacing (1.5 S); the rectangular unit cell that tiles
// the honeycomb is 3 S wide by 40 tall and holds two hexagons.
const S = 40 / Math.sqrt(3);
const HALF = S / 2;
const APO = 20; // apothem: half the flat-to-flat span
const COL = S * 1.5;
const TILE_W = S * 3;
const TILE_H = APO * 2;

// Corner hexagon (its other three quadrants are drawn by the neighbouring tiles) plus
// the fully-inside hexagon offset half a row — together the periodic honeycomb.
const HEX_TILE = [
  `M ${-S} 0 L ${-HALF} ${-APO} L ${HALF} ${-APO} L ${S} 0 L ${HALF} ${APO} L ${-HALF} ${APO} Z`,
  `M ${HALF} ${APO} L ${S} 0 L ${COL + HALF} 0 L ${COL + S} ${APO} L ${COL + HALF} ${TILE_H} L ${S} ${TILE_H} Z`,
].join(" ");

export function HexGrid({
  className,
  ref,
}: Readonly<{ className?: string; ref?: Ref<HTMLDivElement> }>) {
  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn("hex-overlay absolute inset-0", className)}
    >
      <svg className="block h-full w-full">
        <defs>
          <pattern
            id="bo2-hex-tile"
            width={TILE_W}
            height={TILE_H}
            patternUnits="userSpaceOnUse"
          >
            <path d={HEX_TILE} fill="none" stroke="currentColor" strokeWidth={1} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#bo2-hex-tile)" />
      </svg>
    </div>
  );
}
