import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site-config";

// Route-generated apple-touch icon: the same original monogram scaled up, no
// committed binary. Satori cannot read CSS custom properties, so brand colors
// are inlined here; globals.css stays the runtime token source
// (scene-shadow #0A0F13, ink #EEF3F5).
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const initials = siteConfig.name
  .split(" ")
  .map((word) => word[0])
  .join("");

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0A0F13",
          color: "#EEF3F5",
          fontSize: 96,
          fontWeight: 700,
          letterSpacing: "0.04em",
        }}
      >
        {initials}
      </div>
    ),
    { ...size },
  );
}
