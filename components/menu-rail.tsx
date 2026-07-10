"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { NavList } from "@/components/ui/nav-list";
import { NavSheet } from "@/components/ui/nav-sheet";
import { navigation } from "@/lib/data/navigation";
import {
  resolveActiveSection,
  type ObservedEntry,
} from "@/lib/nav/active-section";
import { deriveNav } from "@/lib/nav/live-sections";
import { activate, makeHashWriter } from "@/lib/nav/scroll";
import { siteConfig } from "@/lib/site-config";

// The app's ONE `use client` island. It server-renders exactly the no-JS
// fallback — the plain NavList rail (>=1024px, real anchors, NO tabindex) plus a
// native <details><summary>MENU</summary> disclosure (<1024px) — and gates ALL
// enhancement behind a post-mount `hydrated` flag so the SSR HTML equals the
// first client render (no hydration mismatch, no suppressHydrationWarning).
//
// After hydration it layers on: roving tabindex over LIVE anchors (arrows/Home/
// End, clamp, skip locked, Enter/Space -> controlled activate), a single
// center-band IntersectionObserver feeding the pure resolveActiveSection reducer,
// a throttled replaceState hash writer, and the mobile top bar + modal NavSheet
// replacing the <details> base. Live-vs-locked and the observed sections both
// derive from `liveIds` (deriveNav), so Phases 5-9 unlock entries with zero rail
// rework. No role=menu, no inline hex, no emoji.

const IO_OPTIONS: IntersectionObserverInit = {
  rootMargin: "-45% 0px -45% 0px",
  threshold: 0,
};

// Hydration flag without a cascading setState-in-effect: the server snapshot is
// false and the client snapshot is true, so the first client render matches the
// server render and the enhancement turns on after commit.
const HYDRATION_STORE = {
  subscribe: () => () => {},
  client: () => true,
  server: () => false,
};

// Original three-line hamburger glyph (currentColor so it remaps under
// forced-colors); decorative — the trigger/summary text carries the name.
function MenuGlyph() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
    >
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

// Paint-only press feedback: run the .hit-flash pulse on the pressed anchor. The
// globals reduced-motion block swaps the spatial scale for a <=120ms
// opacity/background flash automatically, so this stays a plain class toggle.
function flash(el: HTMLElement) {
  el.classList.remove("hit-flash");
  // Force a reflow so re-adding the class restarts the animation.
  void el.offsetWidth;
  el.classList.add("hit-flash");
  el.addEventListener("animationend", () => el.classList.remove("hit-flash"), {
    once: true,
  });
}

export function MenuRail({ liveIds }: Readonly<{ liveIds: readonly string[] }>) {
  const rows = deriveNav(navigation, liveIds);
  const liveRows = rows.filter((row) => row.live);
  const firstLiveId = liveRows[0]?.id;

  const hydrated = useSyncExternalStore(
    HYDRATION_STORE.subscribe,
    HYDRATION_STORE.client,
    HYDRATION_STORE.server,
  );

  const [activeId, setActiveId] = useState<string | undefined>(undefined);
  const [rovingId, setRovingId] = useState<string | undefined>(undefined);
  const [sheetOpen, setSheetOpen] = useState(false);

  const railRef = useRef<HTMLDivElement>(null);
  // Latest active id for the IO callback, kept off the observer's dep list so a
  // scroll update never re-subscribes the observer.
  const activeRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    activeRef.current = activeId;
  }, [activeId]);

  // Center-band scroll-spy: one observer over the live sections, projected into
  // pure ObservedEntry values for the reducer. A change-guarded, throttled
  // replaceState follows the active id.
  //
  // Deep-link resolution folds in here: seeding `prev` from a live load hash
  // means the first callback resolves that section active WITHOUT re-scrolling
  // (the UA already jumped there — RESEARCH Pitfall 3), and if the band is
  // momentarily empty the reducer keeps that seeded id.
  useEffect(() => {
    if (!hydrated) return;
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>("main section[id]"),
    ).filter((section) => liveIds.includes(section.id));
    if (sections.length === 0) return;

    const hashId = window.location.hash.replace(/^#/, "");
    if (hashId && liveIds.includes(hashId)) activeRef.current = hashId;

    const observed = new Map<string, ObservedEntry>();
    const writeHash = makeHashWriter();
    const observer = new IntersectionObserver((entries) => {
      const middle = window.innerHeight / 2;
      for (const entry of entries) {
        const rect = entry.boundingClientRect;
        observed.set(entry.target.id, {
          id: entry.target.id,
          isIntersecting: entry.isIntersecting,
          centerDistance: Math.abs(rect.top + rect.height / 2 - middle),
        });
      }
      // Pass entries in DOM order so the reducer's tie-break stays deterministic.
      const ordered = sections
        .map((section) => observed.get(section.id))
        .filter((entry): entry is ObservedEntry => entry !== undefined);
      const next = resolveActiveSection(ordered, activeRef.current);
      if (next) {
        // Write the hash only on a real change (throttled, Safari-safe); React
        // bails out of the redundant setActiveId when the id is unchanged.
        if (next !== activeRef.current) writeHash(next);
        setActiveId(next);
      }
    }, IO_OPTIONS);

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [hydrated, liveIds]);

  const anchorFor = (id: string) =>
    railRef.current?.querySelector<HTMLElement>(`a[data-nav-id="${id}"]`) ??
    null;

  // Roving keyboard model over LIVE anchors only: arrows/Home/End move focus
  // (clamped at the ends, locked rows never in the list), Enter/Space run the
  // controlled activation with press feedback.
  const onRailKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (liveRows.length === 0) return;
    const current = rovingId ?? activeId ?? firstLiveId;
    const index = liveRows.findIndex((row) => row.id === current);
    if (index === -1) return;

    const move = (nextIndex: number) => {
      event.preventDefault();
      const nextId = liveRows[nextIndex].id;
      setRovingId(nextId);
      anchorFor(nextId)?.focus();
    };

    switch (event.key) {
      case "ArrowDown":
      case "ArrowRight":
        move(Math.min(index + 1, liveRows.length - 1));
        break;
      case "ArrowUp":
      case "ArrowLeft":
        move(Math.max(index - 1, 0));
        break;
      case "Home":
        move(0);
        break;
      case "End":
        move(liveRows.length - 1);
        break;
      case "Enter":
      case " ":
      case "Spacebar": {
        event.preventDefault();
        const el = anchorFor(liveRows[index].id);
        if (el) flash(el);
        activate(liveRows[index].id);
        break;
      }
      default:
        break;
    }
  };

  // Pointer press feedback on the down-event; controlled activation on release
  // (click) so a slide-off before release aborts (WCAG 2.5.2).
  const onRailPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const anchor = (event.target as HTMLElement).closest<HTMLElement>(
      "a[data-nav-id]",
    );
    if (anchor) flash(anchor);
  };

  const onRailClick = (event: React.MouseEvent<HTMLDivElement>) => {
    // Keyboard-synthesised clicks (detail 0) are already handled in keydown.
    if (event.detail === 0) return;
    const anchor = (event.target as HTMLElement).closest<HTMLElement>(
      "a[data-nav-id]",
    );
    const id = anchor?.dataset.navId;
    if (!id) return;
    event.preventDefault();
    activate(id);
  };

  // Sheet activation: controlled scroll then close the sheet (covers a pointer
  // click and a keyboard Enter, since the sheet carries no roving keydown).
  const onSheetActivate = (event: React.MouseEvent<HTMLDivElement>) => {
    const anchor = (event.target as HTMLElement).closest<HTMLElement>(
      "a[data-nav-id]",
    );
    const id = anchor?.dataset.navId;
    if (!id) return;
    event.preventDefault();
    activate(id);
    setSheetOpen(false);
  };

  // Pre-hydration: no roving (natural tab order), no active accent — identical to
  // the server render and the no-JS experience.
  const listActiveId = hydrated ? activeId : undefined;
  const listRovingId = hydrated
    ? (rovingId ?? activeId ?? firstLiveId)
    : undefined;
  const currentLabel =
    rows.find((row) => row.id === activeId)?.label ?? liveRows[0]?.label ?? "";

  return (
    <>
      {/* Desktop rail (>=1024px): fixed 280px steel column, line-strong right
          divider. NavList supplies the <nav aria-label="Sections"> landmark, so
          this wrapper stays a plain container (no nested nav). */}
      <div
        ref={railRef}
        onKeyDown={onRailKeyDown}
        onPointerDown={onRailPointerDown}
        onClick={onRailClick}
        className="hidden lg:fixed lg:left-0 lg:top-0 lg:flex lg:h-dvh lg:w-[280px] lg:flex-col lg:border-r lg:border-line-strong lg:bg-steel"
      >
        <div className="px-4 pt-6 pb-8 font-label text-stat-label uppercase tracking-[0.08em] text-ink-secondary">
          {siteConfig.callsign}
        </div>
        <NavList
          rows={rows}
          activeId={listActiveId}
          rovingId={listRovingId}
          className="pb-6"
        />
      </div>

      {/* Mobile nav (<1024px). Pre-hydration/no-JS: a native <details> disclosure
          exposing every live anchor. Post-hydration: a 56px sticky top bar whose
          trigger opens the modal NavSheet. */}
      <div className="lg:hidden">
        {!hydrated ? (
          <details className="border-b border-line-faint bg-steel">
            <summary className="tap-target flex list-none items-center gap-2 px-4 font-label text-stat-label uppercase tracking-[0.08em] text-ink-secondary">
              <MenuGlyph />
              Menu
            </summary>
            <NavList rows={rows} className="pb-4" />
          </details>
        ) : (
          <>
            <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-line-faint bg-steel px-4">
              <span className="truncate font-display text-body font-bold uppercase leading-[1.2] tracking-[0.04em] text-ink">
                {currentLabel}
              </span>
              <button
                type="button"
                onClick={() => setSheetOpen(true)}
                aria-label="Open sections"
                aria-haspopup="dialog"
                aria-expanded={sheetOpen}
                aria-controls="nav-sheet"
                className="tap-target -mr-2 inline-flex items-center gap-2 font-label text-stat-label uppercase tracking-[0.08em] text-ink-secondary"
              >
                <MenuGlyph />
                Menu
              </button>
            </header>
            <div id="nav-sheet">
              <NavSheet open={sheetOpen} onClose={() => setSheetOpen(false)}>
                <div onPointerDown={onRailPointerDown} onClick={onSheetActivate}>
                  <NavList rows={rows} activeId={listActiveId} />
                </div>
              </NavSheet>
            </div>
          </>
        )}
      </div>
    </>
  );
}
