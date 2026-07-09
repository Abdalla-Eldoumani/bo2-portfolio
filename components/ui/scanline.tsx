import type { Ref } from "react";
import { cn } from "@/lib/utils/cn";

// Scanline: the static 1px hero-surface scanline. Decorative only — the root is
// aria-hidden and inherits pointer-events:none from .scanline-overlay
// (app/globals.css), which is also the single source for the repeating-linear-gradient,
// the 3% opacity ceiling, the no-drift static render, the below-768px removal, and the
// reduced-motion removal; none of that is re-declared here. No hex literal — the
// gradient color flows from the token .scanline-overlay reads in globals.css.
// Usage: mount on the hero-lobby surface ONLY (one scanline field per view); Phase 1
// authors the primitive and a later phase mounts it.

export function Scanline({
  className,
  ref,
}: Readonly<{ className?: string; ref?: Ref<HTMLDivElement> }>) {
  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn("scanline-overlay absolute inset-0", className)}
    />
  );
}
