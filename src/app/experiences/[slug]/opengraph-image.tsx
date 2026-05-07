import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";
import { SITE_NAME } from "@/lib/constants";
import type { Journey } from "@/types";

export const alt = "Ubudian Retreat";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function JourneyOgImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("journeys")
    .select("title, subtitle, summary, cover_image_url, length_days, tier, archetype_tags")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  const journey = (row ?? null) as Pick<
    Journey,
    "title" | "subtitle" | "summary" | "cover_image_url" | "length_days" | "tier" | "archetype_tags"
  > | null;

  if (!journey) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #2C4A3E 0%, #3A5F50 60%, #B85C3F 100%)",
            color: "#FAF5EC",
            fontFamily: "Georgia, serif",
            fontSize: 64,
          }}
        >
          {SITE_NAME}
        </div>
      ),
      { ...size }
    );
  }

  const tierLabel =
    journey.tier === "signature_cohort"
      ? "Signature Cohort"
      : journey.tier === "self_paced"
      ? "Insider Self-Paced"
      : "Ubud Retreat";

  const dayLabel = `${journey.length_days} ${journey.length_days === 1 ? "day" : "days"}`;
  const archetypes = (journey.archetype_tags ?? []).slice(0, 3);

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
        {/* Background image */}
        {journey.cover_image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={journey.cover_image_url}
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
        {/* Dark gradient for legibility */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(135deg, rgba(15,30,25,0.92) 0%, rgba(15,30,25,0.72) 45%, rgba(15,30,25,0.55) 100%)",
            display: "flex",
          }}
        />

        {/* Wordmark */}
        <div
          style={{
            position: "absolute",
            top: 56,
            left: 64,
            display: "flex",
            alignItems: "center",
            gap: 14,
            color: "#C9A84C",
            fontSize: 28,
            letterSpacing: 1.5,
          }}
        >
          <span style={{ display: "flex" }}>The Ubudian</span>
        </div>

        {/* Top-right meta strip */}
        <div
          style={{
            position: "absolute",
            top: 64,
            right: 64,
            display: "flex",
            gap: 16,
            alignItems: "center",
            color: "#FAF5EC",
            fontSize: 22,
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          <span style={{ display: "flex" }}>{tierLabel}</span>
          <span style={{ display: "flex", color: "#C9A84C" }}>·</span>
          <span style={{ display: "flex" }}>{dayLabel}</span>
        </div>

        {/* Title block */}
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
            {journey.title}
          </div>
          {journey.subtitle && (
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
              {journey.subtitle}
            </div>
          )}
          {archetypes.length > 0 && (
            <div
              style={{
                display: "flex",
                marginTop: 28,
                gap: 12,
              }}
            >
              {archetypes.map((tag) => (
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
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Bottom hairline */}
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
    { ...size }
  );
}
