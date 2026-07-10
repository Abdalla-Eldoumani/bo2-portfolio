"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Modal } from "@/components/ui/modal";
import { navigation } from "@/lib/data/navigation";
import { cn } from "@/lib/utils/cn";

// CommandPalette (SYS-02) — a small "use client" leaf mounted ONCE in the root
// layout after {children}, the deliberate cash-in of the Phase-6 Modal reuse
// contract. A global Cmd+K / Ctrl+K listener opens the Phase-6 <Modal> VERBATIM
// (open/onClose/titleId/closeLabel — no new dialog CSS, no fork); the Modal's
// native showModal() supplies the focus-move-in, focus-trap, Escape-close, inert
// background, and focus-RETURN to the trigger for free.
//
// No hydration flag is needed (unlike menu-rail / mission-detail): the palette
// intercepts no server base — it is purely additive. SSR and the first client
// render both emit <Modal open={false}> (a closed <dialog>), so there is no
// mismatch. The keydown listener only matters post-hydration. React Compiler is
// ON and strict — no hand useCallback/useMemo, no setState in an effect body
// (setOpen fires inside the keydown handler, an event callback, not the effect
// body).
//
// The palette's ONE orange = the single focused row's accent left tick + label
// (one row focused at a time; showModal() moves focus to row 1). The ZOMBIES
// MODE state is carried by a text token + aria-pressed, never a second accent.

// The GO TO rows are ROOT-anchored (`/${item.href}` → `/#id`) so a section jump
// works from /resume and the 404 too, not only from home — the palette is
// mounted globally. RESUME is a real page route. Labels come from navigation.ts
// (never re-hardcoded) and are uppercased in CSS.
const goToRows = navigation.map((item) => ({
  label: item.label,
  hint: item.subtitle,
  href: `/${item.href}`,
}));

// Shared row register: mono 14px, the terminal console face; a hover/focus wash
// (--color-panel-hover) + a 3px accent left tick + the label shifting to accent
// — the nav-selector cue, expressed with CSS utilities only (no new global CSS).
// The tick pairs with the global 2px :focus-visible outline (a non-color cue
// that survives forced-colors; the label is also the persistent identifier).
const ROW = cn(
  "tap-target flex w-full items-center gap-3 border-l-[3px] border-transparent px-4 py-3",
  "font-mono text-button leading-[1.4] text-ink transition-colors",
  "hover:border-accent hover:bg-panel-hover hover:text-accent",
  "focus-visible:border-accent focus-visible:bg-panel-hover focus-visible:text-accent",
);

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [zombies, setZombies] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k")) {
        return;
      }
      // Do not hijack Cmd+K inside an editable context (T-11-01): an input,
      // textarea, or contentEditable surface keeps the browser/app default.
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.isContentEditable ||
          /^(input|textarea|select)$/i.test(target.tagName))
      ) {
        return;
      }
      event.preventDefault();
      // Idempotent open: pressing Cmd+K while already open is a no-op (the guard
      // "against firing while open" — setOpen(true) does not re-toggle).
      setOpen(true);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Client-only attribute flip from the deliberate command (T-11-02): no
  // storage, no input — reload resets. toggleAttribute returns the presence
  // after toggling, which drives aria-pressed + the text token.
  const toggleZombies = () => {
    const next = document.documentElement.toggleAttribute("data-zombies");
    setZombies(next);
  };

  const close = () => setOpen(false);

  return (
    <Modal
      open={open}
      onClose={close}
      titleId="console-title"
      closeLabel="Close console"
    >
      <div className="flex flex-col gap-6 px-5 pb-6 sm:px-8 sm:pb-8">
        <div className="flex flex-col gap-1">
          <h2
            id="console-title"
            className="font-display text-h3 uppercase tracking-[0.04em] text-ink"
          >
            Console
          </h2>
          <p className="font-label text-stat-label uppercase tracking-[0.08em] text-ink-secondary">
            Quick Nav — Cmd/Ctrl + K
          </p>
        </div>

        <nav aria-label="Console">
          <ul className="flex flex-col divide-y divide-line-faint">
            {goToRows.map((row) => (
              <li key={row.href}>
                <Link href={row.href} onClick={close} className={ROW}>
                  <span aria-hidden="true" className="text-ink-muted">
                    &gt;
                  </span>
                  <span className="uppercase">{row.label}</span>
                  <span className="ml-auto text-data text-ink-muted">
                    {row.hint}
                  </span>
                </Link>
              </li>
            ))}
            <li>
              <Link href="/resume" onClick={close} className={ROW}>
                <span aria-hidden="true" className="text-ink-muted">
                  &gt;
                </span>
                <span className="uppercase">Resume</span>
              </Link>
            </li>
            <li>
              <button
                type="button"
                onClick={toggleZombies}
                aria-pressed={zombies}
                className={ROW}
              >
                <span aria-hidden="true" className="text-ink-muted">
                  &gt;
                </span>
                <span className="uppercase">Zombies Mode</span>
                <span
                  className={cn(
                    "ml-auto text-data tabular-nums",
                    zombies ? "text-ink" : "text-ink-muted",
                  )}
                >
                  {zombies ? "ON" : "OFF"}
                </span>
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </Modal>
  );
}
