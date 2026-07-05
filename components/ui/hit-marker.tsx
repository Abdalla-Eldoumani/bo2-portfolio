import type { ComponentPropsWithRef } from "react";
import { cn } from "@/lib/utils/cn";

// Hit-marker: BO2's paint-only click-feedback pulse — the 90ms scale 1 -> 0.97 -> 1
// keyframe from .hit-flash + --dur-hit (app/globals.css). Authored here; first WIRED
// to interaction in Phase 4. It is paint only: Phase 1 adds NO pointer or press
// handler, and the parent drives `pulsing` to run the pulse for one keyframe cycle.
// When wired in Phase 4 the wrapper opts into .tap-target (>=44px on coarse pointers)
// and the pulse VISUAL may fire on the down-event while the real activation runs on
// the up-event (release / click), so sliding off before release aborts it (WCAG 2.5.2
// pointer cancellation). The scale is spatial, so the global reduced-motion rule
// neutralizes it; the <=120ms opacity/background flash swap the spec calls for arrives
// with the Phase-4 wiring, in globals.css. ref is a normal React 19 prop; no hex.

type HitMarkerProps = {
  pulsing?: boolean;
} & ComponentPropsWithRef<"div">;

export function HitMarker({
  pulsing = false,
  className,
  children,
  ref,
  ...rest
}: Readonly<HitMarkerProps>) {
  return (
    <div ref={ref} className={cn(className, pulsing && "hit-flash")} {...rest}>
      {children}
    </div>
  );
}
