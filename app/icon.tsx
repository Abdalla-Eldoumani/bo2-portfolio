import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site-config";

// Route-generated favicon: an original monogram, no committed binary. Satori
// cannot read CSS custom properties, so brand colors are inlined here;
// globals.css stays the runtime token source (void #060809, ink #E8ECEF).
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

const initials = siteConfig.name
  .split(" ")
  .map((word) => word[0])
  .join("");

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#060809",
          color: "#E8ECEF",
          fontSize: 18,
          fontWeight: 700,
          letterSpacing: "0.02em",
        }}
      >
        {initials}
      </div>
    ),
    { ...size },
  );
}
