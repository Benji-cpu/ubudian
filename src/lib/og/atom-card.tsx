import { ImageResponse } from "next/og";

export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

interface AtomOgProps {
  kindLabel: string;
  title: string;
  subtitle?: string | null;
  cover?: string | null;
  tags?: string[];
}

/**
 * Shared OG image renderer for practitioner / place / partner detail pages.
 * Mirrors the guide opengraph-image with a swapped kind label (top-right).
 */
export function renderAtomOg({
  kindLabel,
  title,
  subtitle,
  cover,
  tags,
}: AtomOgProps) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          background: "#2C4A3E",
          fontFamily: "Georgia, serif",
        }}
      >
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt=""
            width={1200}
            height={630}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        )}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(135deg, rgba(15,30,25,0.92) 0%, rgba(15,30,25,0.72) 45%, rgba(15,30,25,0.55) 100%)",
            display: "flex",
          }}
        />

        <div
          style={{
            position: "absolute",
            top: 56,
            left: 64,
            display: "flex",
            alignItems: "center",
            color: "#C9A84C",
            fontSize: 28,
            letterSpacing: 1.5,
          }}
        >
          <span style={{ display: "flex" }}>The Ubudian</span>
        </div>

        <div
          style={{
            position: "absolute",
            top: 64,
            right: 64,
            display: "flex",
            color: "#FAF5EC",
            fontSize: 22,
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          <span style={{ display: "flex" }}>{kindLabel}</span>
        </div>

        <div
          style={{
            position: "absolute",
            left: 64,
            right: 64,
            bottom: 88,
            display: "flex",
            flexDirection: "column",
            color: "#FAF5EC",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 84,
              lineHeight: 1.05,
              fontWeight: 500,
              color: "#FAF5EC",
              maxWidth: 1000,
            }}
          >
            {title}
          </div>
          {subtitle && (
            <div
              style={{
                display: "flex",
                marginTop: 18,
                fontSize: 30,
                fontStyle: "italic",
                color: "rgba(250,245,236,0.88)",
                maxWidth: 980,
              }}
            >
              {subtitle}
            </div>
          )}
          {tags && tags.length > 0 && (
            <div style={{ display: "flex", marginTop: 28, gap: 12 }}>
              {tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  style={{
                    display: "flex",
                    border: "1px solid rgba(201,168,76,0.8)",
                    color: "#C9A84C",
                    padding: "6px 16px",
                    borderRadius: 999,
                    fontSize: 20,
                    letterSpacing: 1,
                    textTransform: "capitalize",
                  }}
                >
                  {tag.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          )}
        </div>

        <div
          style={{
            position: "absolute",
            left: 64,
            right: 64,
            bottom: 56,
            height: 2,
            background: "rgba(201,168,76,0.45)",
            display: "flex",
          }}
        />
      </div>
    ),
    { ...ogSize },
  );
}
