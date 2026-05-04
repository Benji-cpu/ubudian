import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Users } from "lucide-react";
import { SubscribeButton } from "@/components/membership/subscribe-button";
import { PricingToggle } from "@/components/membership/pricing-toggle";
import { createAdminClient } from "@/lib/supabase/admin";

const COMMUNITY_FEATURES = [
  "Browse all events (tantra, ceremonies, ecstatic dance, sound journeys, and more)",
  "Read Humans of Ubud stories and blog posts",
  "Weekly community newsletter",
  "Take the Ubud Spirit Quiz",
  "Save events to your dashboard",
];

const INSIDER_FEATURES = [
  "Everything in Community Member, plus:",
  "Members-only stories and deep dives",
  "First access to new tours and events",
  "Tour booking discounts",
  "Insider badge on your profile",
  "Support independent community media",
];

async function getActiveInsiderCount(): Promise<number> {
  try {
    const supabase = createAdminClient();
    const { count } = await supabase
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("status", "active");
    return count ?? 0;
  } catch {
    return 0;
  }
}

export default async function MembershipPage() {
  const monthlyPriceId = process.env.STRIPE_PRICE_INSIDER_MONTHLY!;
  const yearlyPriceId = process.env.STRIPE_PRICE_INSIDER_YEARLY!;

  const insiderCount = await getActiveInsiderCount();

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="text-center">
        <Badge className="mb-4 bg-brand-gold text-white">
          <Sparkles className="mr-1 h-3 w-3" />
          Membership
        </Badge>
        <h1 className="font-serif text-4xl font-bold text-brand-deep-green">
          Go Deeper with The Ubudian
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Support the platform that keeps Ubud&apos;s conscious community
          connected — and get the content nobody else sees.
        </p>
      </div>

      {/* Social proof */}
      {insiderCount > 0 && (
        <div className="mt-6 flex items-center justify-center gap-2 text-brand-deep-green">
          <Users className="h-5 w-5" />
          <span className="font-serif text-lg font-medium">
            Join {insiderCount} Insider{insiderCount !== 1 ? "s" : ""}
          </span>
        </div>
      )}

      <PricingToggle
        monthlyPriceId={monthlyPriceId}
        yearlyPriceId={yearlyPriceId}
      />

      <div className="mt-12 grid gap-8 md:grid-cols-2">
        {/* Free tier */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-xl">
              Community Member
            </CardTitle>
            <p className="text-3xl font-bold text-brand-deep-green">Free</p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {COMMUNITY_FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-deep-green" />
                  {feature}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Insider tier */}
        <Card className="relative border-brand-gold/50 shadow-lg">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <Badge className="bg-brand-gold text-white">Most Popular</Badge>
          </div>
          <CardHeader>
            <CardTitle className="font-serif text-xl">
              Ubudian Insider
            </CardTitle>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-brand-terracotta">
                $9.99
              </span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <p className="text-sm text-muted-foreground">
              or $99/year (save ~17%)
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <ul className="space-y-3">
              {INSIDER_FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-gold" />
                  {feature}
                </li>
              ))}
            </ul>
            <SubscribeButton
              priceId={monthlyPriceId}
              label="Get Insider Access"
            />
          </CardContent>
        </Card>
      </div>

      {/* Patronage framing */}
      <div className="mt-16 rounded-xl bg-brand-cream/60 px-6 py-10 text-center">
        <p className="font-serif text-xl leading-relaxed text-brand-deep-green">
          The Ubudian is independent, community-funded, and ad-free.
          <br className="hidden sm:block" /> Insider members keep it that way.
        </p>
        <p className="mt-3 text-sm text-brand-charcoal/70">
          Every membership directly supports local community journalism in Ubud.
        </p>
      </div>
    </div>
  );
}
