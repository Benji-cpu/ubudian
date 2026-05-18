import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LeadStatusActions } from "@/components/admin/lead-status-actions";
import type { SponsorLead, SponsorLeadStatus } from "@/types";

const STATUS_LABEL: Record<SponsorLeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  converted: "Converted",
  dismissed: "Dismissed",
};

const STATUS_VARIANT: Record<SponsorLeadStatus, "default" | "secondary" | "outline"> = {
  new: "default",
  contacted: "secondary",
  converted: "outline",
  dismissed: "outline",
};

export default async function SponsorLeadsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sponsor_leads")
    .select("*")
    .order("status", { ascending: true })
    .order("created_at", { ascending: false });
  const leads = (data ?? []) as SponsorLead[];

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Partner Leads</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Inquiries from the public /partners pitch page. Mark as
            contacted → converted once you onboard them into{" "}
            <Link href="/admin/sponsors" className="underline">
              Partners
            </Link>
            .
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/sponsors">All Partners</Link>
        </Button>
      </div>

      <div className="mt-8 space-y-4">
        {leads.length === 0 ? (
          <div className="rounded-md border border-dashed border-brand-gold/30 p-12 text-center text-sm text-muted-foreground">
            No leads yet. The form sits at{" "}
            <Link href="/partners" className="underline">
              /partners
            </Link>
            .
          </div>
        ) : (
          leads.map((lead) => (
            <article
              key={lead.id}
              className="rounded-md border bg-card p-5 shadow-sm"
            >
              <header className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-serif text-xl text-brand-deep-green">
                    {lead.business_name}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {lead.contact_name && `${lead.contact_name} · `}
                    <a
                      href={`mailto:${lead.contact_email}`}
                      className="text-brand-deep-green underline decoration-brand-gold/30 underline-offset-2"
                    >
                      {lead.contact_email}
                    </a>
                    {lead.contact_whatsapp && (
                      <>
                        {" · "}
                        <a
                          href={`https://wa.me/${lead.contact_whatsapp.replace(/[^\d]/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand-deep-green underline decoration-brand-gold/30 underline-offset-2"
                        >
                          WhatsApp
                        </a>
                      </>
                    )}
                    {lead.website_url && (
                      <>
                        {" · "}
                        <a
                          href={lead.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand-deep-green underline decoration-brand-gold/30 underline-offset-2"
                        >
                          Website
                        </a>
                      </>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={STATUS_VARIANT[lead.status]}>
                    {STATUS_LABEL[lead.status]}
                  </Badge>
                  {lead.tier_interest && (
                    <Badge variant="outline" className="capitalize">
                      {lead.tier_interest}
                    </Badge>
                  )}
                </div>
              </header>

              {lead.message && (
                <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                  {lead.message}
                </p>
              )}

              <footer className="mt-4 flex flex-wrap items-center gap-3 border-t pt-3">
                <p className="text-xs text-muted-foreground">
                  {new Date(lead.created_at).toLocaleString("en-GB", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
                <div className="flex-1" />
                <LeadStatusActions leadId={lead.id} status={lead.status} />
                <Button asChild size="sm" variant="outline">
                  <Link
                    href={`/admin/sponsors/new?from_lead=${lead.id}&name=${encodeURIComponent(lead.business_name)}&email=${encodeURIComponent(lead.contact_email)}${
                      lead.tier_interest && lead.tier_interest !== "unsure"
                        ? `&tier=${lead.tier_interest}`
                        : ""
                    }`}
                  >
                    Create partner →
                  </Link>
                </Button>
              </footer>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
