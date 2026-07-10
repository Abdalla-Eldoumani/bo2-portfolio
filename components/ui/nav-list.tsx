import { cn } from "@/lib/utils/cn";

// Presentational 7-entry navigation list — the dumb markup the desktop rail and
// the mobile sheet (plan 04) both compose. No "use client", no state, no roving
// logic: it becomes a Client Component only at consumption inside the island.
// It extends the Selector `nav` visual language (accent .moving-selector tick +
// 400->700 weight bump) but renders real <a href="#id"> anchors instead of
// <button>s, so with JS off the live rows are native in-page links (never
// role=menu). Live-vs-LOCKED is decided upstream by lib/nav/live-sections
// deriveNav and passed in as the `live` flag — this component never hardcodes
// which sections exist. Roving tabindex (promoting one live anchor to 0) is the
// island's job; NavList only defaults every live anchor to -1 and exposes the
// data-nav-id / data-live hooks. Every state carries a non-color cue that
// survives forced-colors: active = weight bump + aria-current; locked = "LOCKED"
// text + lock glyph + aria-disabled.

export type NavRow = {
  id: string;
  label: string;
  subtitle: string;
  href: string;
  live: boolean;
};

type NavListProps = {
  rows: readonly NavRow[];
  activeId?: string;
  className?: string;
};

// Shared row shell: the .tap-target floor, the 16px x / 8px y density, and the
// leading 3px tick slot both live and locked rows align against.
const ROW_BASE =
  "tap-target relative flex w-full items-center gap-3 px-4 py-2 text-left";

const LABEL =
  "truncate font-display text-lead uppercase leading-[1.2] tracking-[0.04em]";

const SUBTITLE =
  "truncate font-label text-stat-label uppercase tracking-[0.08em] text-ink-secondary";

// Original padlock glyph (currentColor so it remaps under forced-colors and
// inherits the locked row's ink-muted); decorative, the "LOCKED" text carries
// the state.
function LockGlyph() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="size-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="5" y="11" width="14" height="9" rx="1" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function LiveRow({
  row,
  isActive,
}: Readonly<{ row: NavRow; isActive: boolean }>) {
  return (
    <a
      href={row.href}
      data-nav-id={row.id}
      data-live=""
      tabIndex={-1}
      aria-current={isActive ? "true" : undefined}
      className={cn(ROW_BASE, isActive ? "text-accent font-bold" : "text-ink")}
    >
      <span
        aria-hidden
        className={cn(
          "moving-selector h-5 w-[3px] shrink-0",
          isActive ? "bg-accent" : "bg-transparent",
        )}
      />
      <span className="flex min-w-0 flex-col">
        <span className={LABEL}>{row.label}</span>
        <span className={SUBTITLE}>{row.subtitle}</span>
      </span>
    </a>
  );
}

function LockedRow({ row }: Readonly<{ row: NavRow }>) {
  return (
    <span
      aria-disabled="true"
      className={cn(ROW_BASE, "text-ink-muted")}
    >
      {/* Alignment spacer matching the live tick width; carries no accent and is
          not the moving-selector — locked rows never take the active indicator. */}
      <span aria-hidden className="w-[3px] shrink-0" />
      <span className="min-w-0 flex-1">
        <span className={LABEL}>{row.label}</span>
      </span>
      <span className="inline-flex shrink-0 items-center gap-1 font-label text-stat-label uppercase tracking-[0.08em]">
        <LockGlyph />
        Locked
      </span>
    </span>
  );
}

export function NavList({ rows, activeId, className }: Readonly<NavListProps>) {
  return (
    <nav aria-label="Sections" className={className}>
      <ul className="flex flex-col">
        {rows.map((row) => (
          <li key={row.id} className="min-w-0">
            {row.live ? (
              <LiveRow row={row} isActive={row.id === activeId} />
            ) : (
              <LockedRow row={row} />
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
