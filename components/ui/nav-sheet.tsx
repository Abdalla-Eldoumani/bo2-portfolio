"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils/cn";

// Native-<dialog> mobile sheet for the menu-rail island (plan 04-04). It wraps a
// <dialog data-nav-sheet> and does nothing but toggle `open`: the slide-in
// (translateX(-100%) -> 0), the ::backdrop scrim, the @starting-style entry, and
// the reduced-motion transform-strip are ALL authored in app/globals.css (plan
// 02) against the data-nav-sheet attribute — this component AUTHORS NO CSS, it
// only applies token utilities for the panel ground/size/layout.
//
// showModal() gives us focus-move-in, a real focus TRAP, Escape-to-close, an
// inert background, and focus-RETURN to the trigger for free. Only three gaps are
// hand-wired: (1) backdrop click -> close (a click whose target is the dialog box
// itself, i.e. outside the panel content, since `closedby` is not yet Baseline in
// Safari); (2) body scroll-lock on open (pairs with the globals
// scrollbar-gutter: stable so locking does not shift layout); (3) mirroring the
// dialog's native close/cancel back into React state via onClose.

type NavSheetProps = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

// Original three-bar close glyph (currentColor so it remaps under forced-colors);
// decorative — the button's aria-label carries the name.
function CloseGlyph() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function NavSheet({ open, onClose, children }: Readonly<NavSheetProps>) {
  const ref = useRef<HTMLDialogElement>(null);

  // Drive the native dialog from the `open` prop and lock/restore body scroll.
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open) {
      if (!dialog.open) dialog.showModal();
      document.body.style.overflow = "hidden";
    } else {
      if (dialog.open) dialog.close();
      document.body.style.overflow = "";
    }
    return () => {
      // Defensive restore if the sheet unmounts while open.
      document.body.style.overflow = "";
    };
  }, [open]);

  // Mirror native close paths (Escape, close button, backdrop click) into React.
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const handleClose = () => onClose();
    const handleClick = (event: MouseEvent) => {
      // A click landing on the dialog box itself (never a child) is a backdrop
      // click — the panel content sits in an inner wrapper, so real menu clicks
      // target a descendant instead.
      if (event.target === dialog) onClose();
    };
    dialog.addEventListener("close", handleClose);
    dialog.addEventListener("click", handleClick);
    return () => {
      dialog.removeEventListener("close", handleClose);
      dialog.removeEventListener("click", handleClick);
    };
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      data-nav-sheet
      aria-label="Sections"
      className={cn(
        "fixed inset-y-0 left-0 m-0 h-dvh max-h-none w-[min(360px,80vw)] max-w-none",
        "bg-steel p-0 text-ink",
      )}
    >
      <div className="flex h-full flex-col border-r border-line-strong">
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-line-faint px-4">
          <span className="font-label text-stat-label uppercase tracking-[0.08em] text-ink-secondary">
            Sections
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sections"
            className="tap-target -mr-2 inline-flex items-center justify-center text-ink-secondary"
          >
            <CloseGlyph />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto py-6">{children}</div>
      </div>
    </dialog>
  );
}
