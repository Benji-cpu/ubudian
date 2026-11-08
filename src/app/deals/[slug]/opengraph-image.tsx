import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { dealTitle } from "@/lib/email/weekly-deals";
import { getLiveSpecials } from "@/lib/specials/queries";
import { dealsForVenue, leadDeal, savingPercent } from "@/lib/specials/deal-page";

export const alt = "A deal in Ubud, on The Ubudian";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function clip(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}

/** The link preview for a venue page: the venue, its lead offer and the saving, in the brand style of the root image. */
export default async function DealOgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const fontsDir = join(process.cwd(), "public", "fonts");
  const [italic, roman, live] = await Promise.all([
    readFile(join(fontsDir, "Lora-Italic.ttf")),
    readFile(join(fontsDir, "Lora-Medium.ttf")),
    getLiveSpecials(),
  ]);

  const deals = dealsForVenue(live, slug);
  const lead = leadDeal(deals);
  // An unknown or lapsed slug still gets a branded card rather than a broken image.
  const venue = clip(lead?.venue_name ?? "Ubud deals", 60);
  const offer = clip(lead ? dealTitle(lead) : "Real savings at Ubud cafés, spas and classes", 90);
  const pct = lead ? savingPercent(lead.price_idr, lead.normal_price_idr) : null;
  const more = Math.max(0, deals.length - 1);

  const venueSize = venue.length > 34 ? 66 : venue.length > 22 ? 78 : 92;
  const offerSize = offer.length > 60 ? 38 : offer.length > 38 ? 44 : 52;

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
            Ubud deal
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: venueSize, lineHeight: 1.06, color: "#FAF5EC", maxWidth: 1056 }}>
            {venue}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 22,
              fontSize: offerSize,
              lineHeight: 1.2,
              fontStyle: "italic",
              color: "#C9A84C",
              maxWidth: 1056,
            }}
          >
            {offer}
          </div>
          {pct !== null || more > 0 ? (
            <div style={{ display: "flex", marginTop: 30 }}>
              {pct !== null ? (
                <div
                  style={{
                    display: "flex",
                    background: "#C9A84C",
                    color: "#2C4A3E",
                    fontSize: 28,
                    padding: "8px 24px",
                    borderRadius: 999,
                    marginRight: 16,
                  }}
                >
                  {`Save ${pct}%`}
                </div>
              ) : null}
              {more > 0 ? (
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
                  {`+ ${more} more ${more === 1 ? "deal" : "deals"}`}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ display: "flex", flexGrow: 1, height: 2, background: "rgba(201,168,76,0.45)", marginRight: 24 }} />
          <div style={{ display: "flex", color: "rgba(250,245,236,0.78)", fontSize: 26 }}>theubudian.life/deals</div>
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
