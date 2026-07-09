import type { ComponentPropsWithRef, CSSProperties } from "react";
import { cn } from "@/lib/utils/cn";

// Chamfer panel: the Safari-safe chamfered surface every section builds on.
// The visible edge is the 1px reveal between the .chamfer box (border color)
// and its inset ::before fill, both defined in app/globals.css. WebKit skips
// borders on clip-path'd boxes, so this component never sets a border utility;
// forced-colors degrades the clip to a real system-color border in globals.css.
// `active` upgrades the edge to line-strong + the inner top highlight through
// .chamfer[data-active]; `chamfer` picks the corner-cut size by feeding the
// --_c custom property the class reads. The ::before fill is absolutely
// positioned and would paint over in-flow text, so content sits in a positioned
// wrapper that stacks above it.

type PanelProps = {
  active?: boolean;
  chamfer?: "sm" | "lg";
} & ComponentPropsWithRef<"div">;

export function Panel({
  active,
  chamfer = "lg",
  className,
  style,
  children,
  ref,
  ...rest
}: Readonly<PanelProps>) {
  return (
    <div
      ref={ref}
      data-active={active ? "" : undefined}
      className={cn("chamfer", className)}
      style={
        {
          "--_c": chamfer === "sm" ? "var(--chamfer-sm)" : "var(--chamfer-lg)",
          ...style,
        } as CSSProperties
      }
      {...rest}
    >
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}
