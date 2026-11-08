import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const timetableOgSize = { width: 1200, height: 630 };

interface TimetableCardProps {
  /** Top right, e.g. "Ubud tonight". */
  eyebrow: string;
  headline: string;
  /** The date or dates, in gold italic, e.g. "Monday 9 Nov". */
  dates: string;
  /** e.g. "19 gatherings still to come". */
  line?: string | null;
  /** Bottom right, e.g. "theubudian.life/ubud-tonight". */
  footer: string;
}

/**
 * The link preview for the dated timetable pages, in the brand style of the
 * venue deal cards (`deals/[slug]/opengraph-image.tsx`): deep green, gold,
 * Lora from `public/fonts`.
 */
export async function renderTimetableOg({ eyebrow, headline, dates, line, footer }: TimetableCardProps) {
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
          justifyContent: "space-between",
          background: "#2C4A3E",
          fontFamily: "Lora",
          padding: "56px 72px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "baseline", color: "#C9A84C" }}>
            <span style={{ display: "flex", fontStyle: "italic", fontSize: 56, lineHeight: 1, marginRight: 14 }}>u</span>
            <span style={{ display: "flex", fontSize: 34, letterSpacing: -0.5 }}>The Ubudian</span>
          </div>
          <div
            style={{
              display: "flex",
              color: "rgba(250,245,236,0.78)",
              fontSize: 22,
              letterSpacing: 3,
              textTransform: "uppercase",
            }}
          >
            {eyebrow}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: headline.length > 26 ? 76 : 88, lineHeight: 1.06, color: "#FAF5EC", maxWidth: 1056 }}>
            {headline}
          </div>
          <div style={{ display: "flex", marginTop: 22, fontSize: 52, lineHeight: 1.2, fontStyle: "italic", color: "#C9A84C" }}>
            {dates}
          </div>
          {line ? (
            <div style={{ display: "flex", marginTop: 30 }}>
              <div
                style={{
                  display: "flex",
                  border: "2px solid rgba(201,168,76,0.8)",
                  color: "#FAF5EC",
                  fontSize: 28,
                  padding: "6px 22px",
                  borderRadius: 999,
                }}
              >
                {line}
              </div>
            </div>
          ) : null}
        </div>

        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ display: "flex", flexGrow: 1, height: 2, background: "rgba(201,168,76,0.45)", marginRight: 24 }} />
          <div style={{ display: "flex", color: "rgba(250,245,236,0.78)", fontSize: 26 }}>{footer}</div>
        </div>
      </div>
    ),
    {
      ...timetableOgSize,
      fonts: [
        { name: "Lora", data: italic, style: "italic", weight: 500 },
        { name: "Lora", data: roman, style: "normal", weight: 500 },
      ],
    }
  );
}
