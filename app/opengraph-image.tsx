import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site-config";

// The share card — the lobby identity block rendered as a 1200x630 OG image.
// Satori cannot read CSS custom properties or woff2, so scene colors are
// inlined (globals.css stays the runtime token source) and the display face
// loads from the vendored TTF copy of Agdasima 700.

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${siteConfig.name} — ${siteConfig.jobTitle}. Portfolio styled as the Black Ops 2 menu system.`;

export default async function OpenGraphImage() {
  const agdasima = await readFile(
    join(process.cwd(), "app/fonts/agdasima-latin-700-normal.ttf"),
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          backgroundImage:
            "linear-gradient(180deg, #33454f 0%, #1c2830 42%, #0a0f13 100%)",
          fontFamily: "Agdasima",
        }}
      >
        {/* warm key light + cool wash (linear — satori mangles radials) */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 820,
            height: 420,
            backgroundImage:
              "linear-gradient(115deg, rgba(255,201,140,0.34) 0%, rgba(185,106,31,0.12) 45%, rgba(0,0,0,0) 70%)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 60,
            right: 0,
            width: 640,
            height: 420,
            backgroundImage:
              "linear-gradient(295deg, rgba(169,193,206,0.20) 0%, rgba(81,105,122,0.08) 45%, rgba(0,0,0,0) 72%)",
            display: "flex",
          }}
        />

        {/* eyebrow */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginTop: 96,
            marginLeft: 84,
          }}
        >
          <div style={{ width: 44, height: 4, background: "#ff9600", display: "flex" }} />
          <div
            style={{
              fontSize: 24,
              letterSpacing: 6,
              color: "#ff9c1e",
              display: "flex",
            }}
          >
            CLASSIFIED // PERSONNEL FILE
          </div>
        </div>

        {/* name */}
        <div
          style={{
            marginLeft: 84,
            marginTop: 18,
            fontSize: 148,
            lineHeight: 0.92,
            color: "#eef3f5",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <span>{siteConfig.name.split(" ")[0].toUpperCase()}</span>
          <span>{siteConfig.name.split(" ").slice(1).join(" ").toUpperCase()}</span>
        </div>

        {/* plate bar */}
        <div
          style={{
            display: "flex",
            marginLeft: 84,
            marginTop: 34,
            border: "1px solid rgba(255,255,255,0.22)",
            backgroundColor: "rgba(8,12,15,0.45)",
          }}
        >
          <div
            style={{
              backgroundColor: "#ff9600",
              color: "#10161b",
              fontSize: 30,
              padding: "8px 24px",
              display: "flex",
            }}
          >
            {siteConfig.jobTitle.toUpperCase()}
          </div>
          <div
            style={{
              color: "#cfd9de",
              fontSize: 28,
              padding: "8px 24px",
              display: "flex",
              alignItems: "center",
            }}
          >
            CALGARY AB
          </div>
          <div
            style={{
              color: "#7bc24f",
              fontSize: 22,
              padding: "8px 24px",
              display: "flex",
              alignItems: "center",
              gap: 10,
              borderLeft: "1px solid rgba(255,255,255,0.18)",
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 10,
                background: "#7bc24f",
                display: "flex",
              }}
            />
            OPEN TO WORK
          </div>
        </div>

        {/* bottom hint strip */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 84px",
            backgroundImage:
              "linear-gradient(180deg, rgba(13,19,24,0.92), rgba(7,11,14,0.98))",
            borderTop: "1px solid rgba(255,255,255,0.12)",
            color: "#9db0ba",
            fontSize: 22,
            letterSpacing: 3,
          }}
        >
          <div style={{ display: "flex" }}>PRESS ENTER TO DEPLOY</div>
          <div style={{ display: "flex", color: "#5f7280" }}>
            SYSTEMS · COMPILERS · KERNELS · WEB
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Agdasima", data: agdasima, weight: 700, style: "normal" }],
    },
  );
}
