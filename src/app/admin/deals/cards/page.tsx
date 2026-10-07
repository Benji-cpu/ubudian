import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { isAdmin } from "@/lib/auth";
import { cardVenues, shortName } from "@/lib/deals/outreach";
import { VisitedButton } from "./visited-button";

export const metadata = { title: "Walk-in cards — Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/**
 * Printable cards, four to an A4 page: each venue's name and a QR code to its own
 * private page (/v/<token>). Print, cut, and hand one over on a walk.
 */
export default async function CardsPage({ searchParams }: { searchParams: Promise<{ area?: string }> }) {
  if (!(await isAdmin())) redirect("/");
  const { area } = await searchParams;
  if (!area) redirect("/admin/deals/outreach");
  const venues = await cardVenues(area);
  const cards = await Promise.all(
    venues.map(async (v) => ({
      ...v,
      qr: await QRCode.toString(`https://theubudian.life/v/${v.invite_token}`, { type: "svg", margin: 0, errorCorrectionLevel: "M" }),
    }))
  );

  return (
    <div>
      <style>{`@media print { header, nav, aside, footer, .no-print { display: none !important; } .card { break-inside: avoid; } @page { size: A4; margin: 10mm; } }`}</style>
      <p className="no-print mb-4 text-sm text-muted-foreground">
        {cards.length} cards for {area}. Print (four to a page), cut, hand one over. Then tap &ldquo;Mark visited&rdquo; under that card.
      </p>
      <div className="grid grid-cols-1 gap-4 print:grid-cols-2 sm:grid-cols-2">
        {cards.map((c) => (
          <div key={c.id} className="card flex h-[135mm] flex-col justify-between rounded-xl border-2 border-[#2C4A3E]/30 bg-white p-6 text-[#2C4A3E]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#B85C3F]">The Ubudian</p>
              <p className="mt-2 font-serif text-2xl leading-tight">{shortName(c.name)}</p>
              <p className="mt-1 text-sm">Ubud&rsquo;s food and wellness deals website. Your page is ready. Scan with your phone camera to add your deal.</p>
            </div>
            <div className="mx-auto w-36" dangerouslySetInnerHTML={{ __html: c.qr }} />
            <div className="text-sm">
              <p>Deals of 25% or more off, for food and wellness (not drinks). Free, no commission.</p>
              <p>Promo diskon 25% atau lebih, untuk makanan dan wellness (bukan minuman). Gratis, tanpa komisi.</p>
              <p className="mt-1 text-xs">theubudian.life</p>
              <p className="mt-1 font-medium">Questions? theubudianlife@gmail.com</p>
              <VisitedButton venueId={c.id} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
