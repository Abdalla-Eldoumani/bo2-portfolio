"use client";

import { useEffect, useState, useSyncExternalStore, type CSSProperties } from "react";
import { Modal } from "@/components/ui/modal";
import { Insignia } from "@/components/ui/insignia";

// MissionDetail — the section's SINGLE `use client` leaf. Cards + grid stay
// Server; this leaf owns the detail-modal state (which project is open, or null)
// and enhances the server <details> briefing bases into ONE focus-trapped Modal
// (RESEARCH Pitfall 2: never 8 dialogs). With JavaScript off it renders nothing
// interactive and the server <details> bases carry the full briefing (SYS-03).
//
// The `hydrated` flag reads through useSyncExternalStore (server snapshot false,
// client true) — NOT setState-in-effect (React Compiler's
// react-hooks/set-state-in-effect forbids it; this mirrors menu-rail). Only
// post-hydration does the leaf intercept the briefing triggers: it suppresses
// the native <details> disclosure (preventDefault) and opens the modal instead,
// so the briefing never DOUBLE-renders (Pitfall 1). React Compiler is ON — no
// hand useCallback/useMemo, no ref read/write during render.

type Briefing = {
  name: string;
  fullDescription: string;
  tech: readonly string[];
  metrics: string | null;
  live: string | null;
  github: string | null;
  insigniaId: string;
};

// Hydration flag without a cascading setState-in-effect: the server snapshot is
// false and the client snapshot true, so the first client render matches the
// server render and the enhancement turns on after commit (menu-rail pattern).
const HYDRATION_STORE = {
  subscribe: () => () => {},
  client: () => true,
  server: () => false,
};

// Steel chip footprint (a secondary real link inside the modal), mirroring the
// grid deploy chip.
const STEEL_CHIP: CSSProperties = {
  "--_c": "var(--chamfer-sm)",
  "--_edge": "var(--color-line-strong)",
  "--_fill": "var(--color-panel)",
} as CSSProperties;

const DISABLED_CHIP: CSSProperties = {
  "--_c": "var(--chamfer-sm)",
  "--_edge": "var(--color-line-faint)",
  "--_fill": "var(--color-panel)",
} as CSSProperties;

// The modal's ONE orange: an accent-on-transparent CTA that fills --color-accent
// with --color-void text on hover (the hero/skip-link CTA precedent). The hover
// fill flips --_fill (the .chamfer::before reads it) via an arbitrary variant;
// no new global CSS.
const ACCENT_CTA: CSSProperties = {
  "--_c": "var(--chamfer-sm)",
  "--_edge": "var(--color-accent)",
  "--_fill": "var(--color-void)",
} as CSSProperties;

function LockGlyph() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="5" y="11" width="14" height="9" rx="1.5" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

// The modal's primary CTA (the one orange). External URLs carry target=_blank +
// rel=noopener noreferrer (T-06-03).
function AccentCta({ href, label }: Readonly<{ href: string; label: string }>) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group chamfer press-flash tap-target inline-flex items-center px-6 py-3 hover:[--_fill:var(--color-accent)]"
      style={ACCENT_CTA}
    >
      <span className="relative z-[1] font-display text-button uppercase tracking-[0.04em] text-accent group-hover:text-void">
        {label}
      </span>
    </a>
  );
}

function SteelCta({ href, label }: Readonly<{ href: string; label: string }>) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="chamfer press-flash tap-target inline-flex items-center px-4 py-2"
      style={STEEL_CHIP}
    >
      <span className="relative z-[1] font-display text-button uppercase tracking-[0.04em] text-ink">
        {label}
      </span>
    </a>
  );
}

function DisabledChip({ label }: Readonly<{ label: string }>) {
  return (
    <span
      aria-disabled="true"
      className="chamfer inline-flex items-center px-4 py-2"
      style={DISABLED_CHIP}
    >
      <span className="relative z-[1] inline-flex items-center gap-2 font-label text-stat-label uppercase tracking-[0.08em] text-ink-muted">
        <LockGlyph />
        {label}
      </span>
    </span>
  );
}

// Modal deploy row: the primary real link (live first, else source) is the
// accent CTA; the remaining real link is a steel chip; each '#' sentinel is a
// designed disabled chip. If neither exists (Self-Checkout) the modal carries no
// orange.
function ModalLinks({ project }: Readonly<{ project: Briefing }>) {
  const hasLive = project.live !== null && project.live !== "#";
  const hasSource = project.github !== null && project.github !== "#";
  const primary = hasLive ? "live" : hasSource ? "source" : null;
  return (
    <div className="flex flex-wrap gap-2">
      {hasLive ? (
        primary === "live" ? (
          <AccentCta href={project.live as string} label="Deploy" />
        ) : (
          <SteelCta href={project.live as string} label="Deploy" />
        )
      ) : (
        <DisabledChip label="No Deployment" />
      )}
      {hasSource ? (
        primary === "source" ? (
          <AccentCta href={project.github as string} label="Source" />
        ) : (
          <SteelCta href={project.github as string} label="Source" />
        )
      ) : (
        <DisabledChip label="Source Classified" />
      )}
    </div>
  );
}

export function MissionDetail({
  projects,
}: Readonly<{ projects: readonly Briefing[] }>) {
  const hydrated = useSyncExternalStore(
    HYDRATION_STORE.subscribe,
    HYDRATION_STORE.client,
    HYDRATION_STORE.server,
  );
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // Post-hydration: demote the server <details> bases. Every activation of a
  // briefing summary (pointer or keyboard — both fire a click on <summary>) is
  // intercepted (preventDefault suppresses the native disclosure toggle) and
  // opens the ONE modal for that project. Any base left open pre-hydration is
  // collapsed so its content never double-renders alongside the modal.
  useEffect(() => {
    if (!hydrated) return;
    document
      .querySelectorAll<HTMLDetailsElement>("details[data-briefing-details]")
      .forEach((details) => {
        details.open = false;
      });
    const onClick = (event: MouseEvent) => {
      const trigger = (event.target as HTMLElement).closest<HTMLElement>(
        "[data-briefing-trigger]",
      );
      if (!trigger) return;
      event.preventDefault();
      const index = Number(trigger.dataset.briefingTrigger);
      if (Number.isNaN(index)) return;
      setOpenIndex(index);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [hydrated]);

  const project = openIndex !== null ? projects[openIndex] : null;

  return (
    <Modal
      open={openIndex !== null}
      onClose={() => setOpenIndex(null)}
      titleId="mission-briefing-title"
      closeLabel="Close mission briefing"
    >
      {project ? (
        <div className="flex flex-col gap-5 px-5 pb-6 sm:px-8 sm:pb-8">
          <div className="flex items-center gap-2">
            <Insignia
              id={project.insigniaId}
              className="h-6 w-6 shrink-0 text-ink-secondary"
            />
            <h2
              id="mission-briefing-title"
              className="font-display text-h3 uppercase tracking-[0.04em] text-ink"
            >
              {project.name}
            </h2>
          </div>

          <p className="max-w-[68ch] font-body text-body leading-[1.6] text-ink-secondary">
            {project.fullDescription}
          </p>

          <div>
            <p className="font-label text-stat-label uppercase tracking-[0.08em] text-ink-secondary">
              Attachments
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {project.tech.map((name) => (
                <span
                  key={name}
                  className="chamfer inline-flex"
                  style={{ "--_c": "var(--chamfer-sm)" } as CSSProperties}
                >
                  <span className="relative z-[1] flex items-center border-l-[3px] border-ink-muted px-4 py-2 font-display text-body uppercase tracking-[0.04em] text-ink">
                    {name}
                  </span>
                </span>
              ))}
            </div>
          </div>

          {project.metrics ? (
            <div>
              <p className="font-label text-stat-label uppercase tracking-[0.08em] text-ink-secondary">
                Combat Record
              </p>
              <p className="mt-1 font-mono text-button leading-[1.4] tabular-nums text-ink">
                {project.metrics}
              </p>
            </div>
          ) : null}

          <ModalLinks project={project} />
        </div>
      ) : null}
    </Modal>
  );
}
