import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles } from "lucide-react";
import { SubscribeButton } from "@/components/membership/subscribe-button";
import { PricingToggle } from "@/components/membership/pricing-toggle";

const COMMUNITY_FEATURES = [
  "Browse all events — ceremonies, workshops, sound journeys, and more",
  "Read Humans of Ubud stories & blog posts",
  "Weekly community newsletter",
  "Take the Ubud Spirit Quiz",
  "Save events to your calendar",
];

const INSIDER_FEATURES = [
  "Everything in Community, plus:",
  "Members-only stories & deep dives",
  "Insider badge on your profile",
];

export default function MembershipPage() {
  const monthlyPriceId = process.env.STRIPE_PRICE_INSIDER_MONTHLY!;
  const yearlyPriceId = process.env.STRIPE_PRICE_INSIDER_YEARLY!;

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
          Support the platform, get members-only content, and help keep Ubud&apos;s community connected.
        </p>
      </div>

      <PricingToggle
        monthlyPriceId={monthlyPriceId}
        yearlyPriceId={yearlyPriceId}
      />

      <div className="mt-12 grid gap-8 md:grid-cols-2">
        {/* Free tier */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-xl">Community Member</CardTitle>
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
            <CardTitle className="font-serif text-xl">Ubudian Insider</CardTitle>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-brand-terracotta">$9.99</span>
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
            <SubscribeButton priceId={monthlyPriceId} label="Get Insider Access" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
