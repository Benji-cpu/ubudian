"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, ExternalLink } from "lucide-react";
import type { SponsorTier } from "@/types";

interface Props {
  sponsorId: string;
  tier: SponsorTier;
  tierLabel: string;
  tierPriceLabel: string;
  hasSubscription: boolean;
  subscriptionStatus: string | null;
}

export function SponsorSubscribeRow({
  sponsorId,
  tier,
  tierLabel,
  tierPriceLabel,
  hasSubscription,
  subscriptionStatus,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    setError(null);
    setLoading(true);
    const res = await fetch("/api/checkout/sponsorship", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sponsor_id: sponsorId, tier }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Could not start checkout.");
      setLoading(false);
      return;
    }
    const { url } = await res.json();
    window.location.href = url;
  }

  async function openPortal() {
    setError(null);
    setLoading(true);
    const res = await fetch("/api/billing/sponsor-portal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sponsor_id: sponsorId }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Could not open billing portal.");
      setLoading(false);
      return;
    }
    const { url } = await res.json();
    window.location.href = url;
  }

  return (
    <div className="rounded-md border border-brand-gold/20 bg-brand-cream/30 p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm">
            <strong>{tierLabel}</strong> · {tierPriceLabel}
          </p>
          {hasSubscription ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Stripe subscription{" "}
              <span className="font-medium text-foreground">{subscriptionStatus}</span>.
              Manage billing, update card, or cancel via the customer portal.
            </p>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">
              You&apos;re not on a recurring subscription yet. Start one here, or keep
              the manual-invoice arrangement if you&apos;ve been billed directly.
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasSubscription ? (
            <Button onClick={openPortal} disabled={loading} variant="outline">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <ExternalLink className="mr-2 h-4 w-4" />
              Manage billing
            </Button>
          ) : (
            <Button onClick={startCheckout} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Start subscription
            </Button>
          )}
        </div>
      </div>
      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
    </div>
  );
}
