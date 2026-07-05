import type { ComponentPropsWithRef } from "react";
import { cn } from "@/lib/utils/cn";

// Moving selector: BO2's selection-is-a-move treatment as one primitive with
// four per-surface variants. Selection always pairs an accent color with a
// non-color cue that survives forced-colors mode, so it never leans on the
// accent glow alone: a 400->700 weight bump for nav/header (text weight always
// renders), a currentColor chevron for tile (remaps to a system color), and a
// real border box for grid (borders remap). Rows are real <button>s inside
// nav+list semantics (never role=menu) and opt into the .tap-target size floor
// (>=44px coarse / >=24px fine, from globals.css). The accent indicator carries
// .moving-selector so Phase 4 can animate the move on input; Phase 1 renders the
// static [data-active] state only, so this stays a Server Component with no
// client JS. Selection motion, reduced-motion, and the focus ring all live in
// app/globals.css and are not re-declared here.

type SelectorItem = { label: string; subtitle?: string };
type SelectorVariant = "nav" | "tile" | "grid" | "header";

type SelectorProps = {
  items: readonly SelectorItem[];
  activeIndex?: number;
  variant?: SelectorVariant;
} & ComponentPropsWithRef<"nav">;

const LIST_LAYOUT: Record<SelectorVariant, string> = {
  nav: "flex flex-col",
  tile: "flex flex-col gap-1",
  grid: "grid grid-cols-2 gap-3",
  header: "flex",
};

const BASE_ROW =
  "tap-target relative flex w-full items-center font-display uppercase tracking-[0.04em]";

const ROW_CLASS: Record<SelectorVariant, string> = {
  nav: "gap-3 px-3 text-left",
  tile: "justify-between gap-3 py-3 pl-4 pr-3 text-left",
  grid: "flex-col items-start gap-1 border-2 p-4 text-left",
  header: "justify-center px-4 text-center",
};

const ACTIVE_CLASS: Record<SelectorVariant, string> = {
  nav: "text-accent font-bold",
  tile: "bg-panel-hover text-ink",
  grid: "border-accent text-accent",
  header: "text-accent font-bold",
};

const INACTIVE_CLASS: Record<SelectorVariant, string> = {
  nav: "text-ink",
  tile: "text-ink",
  grid: "border-transparent text-ink",
  header: "text-ink",
};

const SUBTITLE = "font-label text-label tracking-[0.08em] text-ink-secondary";

// Accent indicator: the .moving-selector element that carries the accent color
// visual and (in Phase 4) the transform move. grid has no separate indicator —
// its border box is the selection surface.
function Indicator({
  variant,
  isActive,
}: Readonly<{ variant: SelectorVariant; isActive: boolean }>) {
  if (variant === "grid") return null;
  const shape =
    variant === "nav"
      ? "h-5 w-[3px] shrink-0"
      : variant === "tile"
        ? "absolute left-0 top-0 h-full w-[3px]"
        : "absolute inset-x-0 bottom-0 h-[3px]";
  return (
    <span
      aria-hidden
      className={cn(
        "moving-selector",
        shape,
        isActive ? "bg-accent" : "bg-transparent",
      )}
    />
  );
}

// Right-pointing chevron for the active tile: an inline currentColor SVG so it
// remaps under forced-colors and carries selection without the accent fill.
function Chevron() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="size-4 shrink-0 text-accent"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

function SelectorRow({
  item,
  variant,
  isActive,
}: Readonly<{ item: SelectorItem; variant: SelectorVariant; isActive: boolean }>) {
  return (
    <button
      type="button"
      data-active={isActive ? "" : undefined}
      aria-current={isActive ? "true" : undefined}
      className={cn(
        BASE_ROW,
        ROW_CLASS[variant],
        isActive ? ACTIVE_CLASS[variant] : INACTIVE_CLASS[variant],
      )}
    >
      <Indicator variant={variant} isActive={isActive} />
      <span className="flex min-w-0 flex-col">
        <span className="truncate">{item.label}</span>
        {item.subtitle && <span className={SUBTITLE}>{item.subtitle}</span>}
      </span>
      {variant === "tile" && isActive && <Chevron />}
    </button>
  );
}

export function Selector({
  items,
  activeIndex = 0,
  variant = "nav",
  className,
  "aria-label": ariaLabel,
  ref,
  ...rest
}: Readonly<SelectorProps>) {
  return (
    <nav ref={ref} aria-label={ariaLabel ?? "Selector"} className={className} {...rest}>
      <ul className={LIST_LAYOUT[variant]}>
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="min-w-0">
            <SelectorRow
              item={item}
              variant={variant}
              isActive={index === activeIndex}
            />
          </li>
        ))}
      </ul>
    </nav>
  );
}
