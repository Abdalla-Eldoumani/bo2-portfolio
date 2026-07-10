"use client";

import { useEffect, useRef, type CSSProperties, type Ref } from "react";
import { cn } from "@/lib/utils/cn";

// Modal: the reusable centered native-<dialog> primitive, generalized from the
// verified NavSheet mechanics (components/ui/nav-sheet.tsx). Content-agnostic on
// purpose — children own the title/body/CTA, closeLabel names the close button —
// so Phase 11's command palette reuses THIS primitive rather than re-implementing
// the trap. Like NavSheet it AUTHORS NO CSS: the centering override, the
// ::backdrop scrim, the opacity+translateY entry, and the reduced-motion strip
// all live in app/globals.css under dialog[data-mission-modal]; this component
// only toggles `open` and applies token utilities for the panel ground/size.
//
// showModal() supplies the focus-move-in, a real focus TRAP, Escape-to-close, an
// inert background, and focus-RETURN to the trigger for free — never fought. Only
// three gaps are hand-wired, verbatim from NavSheet: (1) `open` drives
// showModal()/close() plus a body scroll-lock (document.body.style.overflow) with
// a cleanup restore; (2) the native `close` event and a backdrop click
// (event.target === dialogEl, since `closedby` is not yet Baseline in Safari)
// mirror back into onClose; (3) refs forward as a React 19 ref-as-prop (NO
// forwardRef) onto the <dialog> — an internal ref runs the mechanics, the
// optional external ref is synced through the same callback.

type ModalProps = {
  open: boolean;
  onClose: () => void;
  // aria-labelledby target (the title lives in children). When absent, ariaLabel
  // names the dialog instead — exactly one of the two should be supplied.
  titleId?: string;
  ariaLabel?: string;
  // Names the close button (no mission-specific label baked into the generic
  // primitive; Phase 11 passes its own).
  closeLabel: string;
  children: React.ReactNode;
  ref?: Ref<HTMLDialogElement>;
};

// Original three-bar close glyph (currentColor so it remaps under forced-colors);
// decorative — the button's aria-label carries the name. Reused from NavSheet.
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

export function Modal({
  open,
  onClose,
  titleId,
  ariaLabel,
  closeLabel,
  children,
  ref,
}: Readonly<ModalProps>) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Sync the internal mechanics ref and the optional external ref-as-prop onto
  // the same node (the compiler memoizes this against the stable `ref` prop).
  const setRefs = (node: HTMLDialogElement | null) => {
    dialogRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  };

  // Drive the native dialog from the `open` prop and lock/restore body scroll.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      if (!dialog.open) dialog.showModal();
      document.body.style.overflow = "hidden";
    } else {
      if (dialog.open) dialog.close();
      document.body.style.overflow = "";
    }
    return () => {
      // Defensive restore if the modal unmounts while open.
      document.body.style.overflow = "";
    };
  }, [open]);

  // Mirror native close paths (Escape, close button, backdrop click) into React.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleClose = () => onClose();
    const handleClick = (event: MouseEvent) => {
      // A click landing on the dialog box itself (never a child) is a backdrop
      // click — the panel content sits in an inner wrapper, so real clicks target
      // a descendant instead.
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
      ref={setRefs}
      data-mission-modal
      aria-labelledby={titleId}
      aria-label={titleId ? undefined : ariaLabel}
      className={cn(
        "chamfer m-auto w-[min(720px,92vw)] max-w-[720px] max-h-[85dvh]",
        "overflow-y-auto bg-steel p-0 text-ink",
      )}
      style={{ "--_c": "var(--chamfer-lg)" } as CSSProperties}
    >
      <div className="relative z-[1] flex flex-col">
        <div className="flex justify-end p-3">
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="tap-target inline-flex items-center justify-center text-ink-secondary"
          >
            <CloseGlyph />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
