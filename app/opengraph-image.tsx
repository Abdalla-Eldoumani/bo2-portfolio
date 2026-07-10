import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site-config";

// Route-generated OG card: an original placeholder, no committed binary and no
// game asset. Satori (the ImageResponse renderer) cannot read CSS custom
// properties, so the brand colors are inlined as literals here; globals.css
// stays the runtime token source (scene-shadow #0A0F13 background, ink #EEF3F5 text).
export const alt = `${siteConfig.name} portfolio`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
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
          padding: "0 80px",
          textAlign: "center",
          fontSize: 90,
          fontWeight: 700,
          letterSpacing: "0.04em",
          lineHeight: 1.1,
        }}
      >
        {siteConfig.name.toUpperCase()}
      </div>
    ),
    { ...size },
  );
}
