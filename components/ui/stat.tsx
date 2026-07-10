import type { ReactNode, Ref } from "react";
import { cn } from "@/lib/utils/cn";

// Scoreboard stat cell: a <dt> (Saira label) over a <dd> (mono tabular value),
// the DESIGN_SYSTEM "label 11px over value mono" stat block. Server-safe (no
// "use client", no useId; ref-as-prop) — many cells mount per view, none needs a
// unique id. The section composes cells into its own <dl> grid; Stat renders the
// term/description PAIR (wrapped in a <div>, the HTML5-valid dl grouping element,
// matching combat-record's <dl> register), never the grid itself.
//
// `marquee` is the scoreboard SCORE lead: value steps to text-h2 / 700 /
// --color-accent (the section's ONE orange). The accent is reinforced by SIZE
// (34 vs 26px) + WEIGHT (700) so the "this is the headline" meaning survives
// forced-colors when the color drops. Every other cell is text-h3 / 700 /
// --color-ink. Values are tabular-nums so the numerals align across the grid.

export function Stat({
  label,
  value,
  marquee,
  className,
  ref,
}: Readonly<{
  label: string;
  value: ReactNode;
  marquee?: boolean;
  className?: string;
  ref?: Ref<HTMLDivElement>;
}>) {
  return (
    <div ref={ref} className={cn("flex flex-col gap-1 p-4", className)}>
      <dt className="font-label text-stat-label uppercase tracking-[0.08em] text-ink-secondary">
        {label}
      </dt>
      <dd
        className={cn(
          "font-mono font-bold leading-[1.1] tabular-nums",
          marquee ? "text-h2 text-accent" : "text-h3 text-ink",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
