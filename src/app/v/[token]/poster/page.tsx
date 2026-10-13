import type { Metadata } from "next";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { getInvite } from "@/lib/deals/invite";
import { formatDays, formatHours } from "@/lib/specials";

export const metadata: Metadata = {
  title: "Poster",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

/**
 * A printable poster for a venue that has a live deal: its deal, and a QR code
 * to the free Wednesday email (sign-ups tagged `poster`). Reached from the
 * venue's own page link; print it or save as PDF.
 */
export default async function PosterPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invite = await getInvite(token);
  if (!invite || invite.optedOut || invite.live.length === 0) notFound();
  const deal = invite.live[0];
  const qr = await QRCode.toString("https://theubudian.life/newsletter?from=poster", {
    type: "svg",
    margin: 0,
    errorCorrectionLevel: "M",
  });
  const when = [deal.days_stated ? formatDays(deal) : null, formatHours(deal.start_time, deal.end_time)].filter(Boolean).join(" · ");

  return (
    <>
    <style>{`@media print { body:has(.poster-page) header, body:has(.poster-page) footer, body:has(.poster-page) nav { display: none !important; } }`}</style>
    <main className="poster-page mx-auto my-6 max-w-md rounded-2xl border-2 border-brand-gold/60 bg-brand-cream p-8 text-center print:my-0 print:max-w-none print:border-0 print:px-12 print:pt-20">
      <p className="text-xs font-semibold uppercase tracking-widest text-brand-terracotta print:text-lg">Deal for guests</p>
      <h1 className="mt-3 font-serif text-3xl font-medium text-brand-deep-green print:mt-6 print:text-6xl print:leading-tight">{deal.title}</h1>
      {when && <p className="mt-2 text-brand-charcoal print:mt-6 print:text-3xl">{when}</p>}
      <p className="mt-1 text-muted-foreground print:mt-3 print:text-2xl">{invite.name}</p>
      <hr className="my-6 border-brand-gold/40 print:my-12" />
      <p className="font-serif text-xl text-brand-deep-green print:text-4xl">More Ubud deals, free every Wednesday</p>
      <div className="mx-auto mt-4 h-44 w-44 print:mt-8 print:h-72 print:w-72 [&_svg]:h-full [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: qr }} />
      <p className="mt-3 text-sm text-muted-foreground print:mt-6 print:text-xl">Scan to get the week&apos;s Ubud deals and events by email. The Ubudian · theubudian.life</p>
      <p className="mt-6 text-xs text-muted-foreground print:hidden">Print this page (Ctrl/Cmd+P on a computer, or Share then Print on a phone), or save it as PDF.</p>
    </main>
    </>
  );
}
