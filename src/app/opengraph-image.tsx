import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { SITE_DESCRIPTION } from "@/lib/constants";

export const alt = "The Ubudian — Ubud's Conscious Community";
export const size = { width: 1200, height: 1200 };
export const contentType = "image/png";

export default async function RootOgImage() {
  const fontsDir = join(process.cwd(), "public", "fonts");
  const [italic, roman] = await Promise.all([
    readFile(join(fontsDir, "Lora-Italic.ttf")),
    readFile(join(fontsDir, "Lora-Medium.ttf")),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#2C4A3E",
          fontFamily: "Lora",
          padding: 100,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: 640,
            height: 640,
            borderRadius: 120,
            border: "4px solid rgba(201,168,76,0.55)",
            background: "#2C4A3E",
          }}
        >
          <div
            style={{
              display: "flex",
              width: 150,
              height: 3,
              background: "rgba(201,168,76,0.7)",
              marginBottom: 28,
            }}
          />
          <div
            style={{
              display: "flex",
              fontStyle: "italic",
              fontSize: 440,
              lineHeight: 1,
              color: "#C9A84C",
            }}
          >
            u
          </div>
          <div
            style={{
              display: "flex",
              width: 150,
              height: 3,
              background: "rgba(201,168,76,0.7)",
              marginTop: 28,
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 84,
            fontSize: 104,
            color: "#C9A84C",
            letterSpacing: -1,
          }}
        >
          The Ubudian
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 28,
            fontSize: 30,
            color: "rgba(250,245,236,0.78)",
            letterSpacing: 0.4,
            maxWidth: 980,
            textAlign: "center",
            fontStyle: "italic",
          }}
        >
          {SITE_DESCRIPTION}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Lora", data: italic, style: "italic", weight: 500 },
        { name: "Lora", data: roman, style: "normal", weight: 500 },
      ],
    }
  );
}
