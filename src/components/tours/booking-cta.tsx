"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, Mail, Clock, Users } from "lucide-react";
import { BookingForm } from "@/components/tours/booking-form";
import { formatUsdPrice } from "@/lib/stripe/helpers";
import type { Tour } from "@/types";

interface BookingCtaProps {
  tour: Tour;
}

export function BookingCta({ tour }: BookingCtaProps) {
  const whatsappMessage = encodeURIComponent(
    `Hi! I'm interested in booking the "${tour.title}" tour with The Ubudian. Could you share more details?`
  );

  const whatsappNumber = tour.booking_whatsapp?.replace(/[^\d+]/g, "");

  return (
    <Card className="border-brand-gold/30">
      <CardContent className="space-y-4 p-6">
        <h3 className="font-serif text-lg font-semibold text-brand-deep-green">
          Book This Tour
        </h3>

        <div className="space-y-2 text-sm">
          {tour.price_per_person != null && (
            <div className="text-2xl font-bold text-brand-terracotta">
              {formatUsdPrice(tour.price_per_person)}
              <span className="text-sm font-normal text-muted-foreground"> / person</span>
            </div>
          )}
          {tour.max_group_size && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              Max {tour.max_group_size} people per group
            </div>
          )}
          {tour.duration && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              {tour.duration}
            </div>
          )}
        </div>

        {/* Online payment booking */}
        {tour.price_per_person != null && (
          <BookingForm tour={tour} />
        )}

        {whatsappNumber && (
          <Button asChild className="w-full gap-2" size="lg" variant={tour.price_per_person != null ? "outline" : "default"}>
            <a
              href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="h-4 w-4" />
              Book via WhatsApp
            </a>
          </Button>
        )}

        {tour.booking_email && (
          <Button asChild variant="outline" className="w-full gap-2">
            <a
              href={`mailto:${tour.booking_email}?subject=${encodeURIComponent(`Booking: ${tour.title}`)}`}
            >
              <Mail className="h-4 w-4" />
              Or email us
            </a>
          </Button>
        )}

        {tour.guide_name && (
          <p className="text-center text-xs text-muted-foreground">
            Your guide: <strong>{tour.guide_name}</strong>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
