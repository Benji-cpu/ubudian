"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SubscribeButton } from "./subscribe-button";

interface PricingToggleProps {
  monthlyPriceId: string;
  yearlyPriceId: string;
}

export function PricingToggle({ monthlyPriceId, yearlyPriceId }: PricingToggleProps) {
  const [interval, setInterval] = useState<"month" | "year">("month");

  const priceId = interval === "month" ? monthlyPriceId : yearlyPriceId;
  const price = interval === "month" ? "$9.99" : "$99";
  const perLabel = interval === "month" ? "/month" : "/year";

  return (
    <div className="mt-8 flex flex-col items-center gap-4">
      <div className="inline-flex rounded-lg bg-muted p-1">
        <Button
          variant={interval === "month" ? "default" : "ghost"}
          size="sm"
          onClick={() => setInterval("month")}
        >
          Monthly
        </Button>
        <Button
          variant={interval === "year" ? "default" : "ghost"}
          size="sm"
          onClick={() => setInterval("year")}
        >
          Yearly (save 17%)
        </Button>
      </div>

      <div className="text-center">
        <span className="text-4xl font-bold text-brand-terracotta">{price}</span>
        <span className="text-muted-foreground">{perLabel}</span>
      </div>

      <div className="w-full max-w-xs">
        <SubscribeButton priceId={priceId} label="Subscribe Now" />
      </div>
    </div>
  );
}
