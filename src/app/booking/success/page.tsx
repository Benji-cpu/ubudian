import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { formatUsdPrice } from "@/lib/stripe/helpers";
import type { Booking } from "@/types";

interface BookingSuccessPageProps {
  searchParams: Promise<{ ref?: string }>;
}

export default async function BookingSuccessPage({ searchParams }: BookingSuccessPageProps) {
  const { ref } = await searchParams;

  let booking: Booking | null = null;
  let tourTitle = "";

  if (ref) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("bookings")
      .select("*, tours(title)")
      .eq("booking_reference", ref)
      .single();

    if (data) {
      booking = data as Booking & { tours: { title: string } };
      tourTitle = (data as { tours: { title: string } }).tours?.title ?? "";
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <Card>
        <CardContent className="flex flex-col items-center p-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-600" />
          <h1 className="mt-4 font-serif text-2xl font-bold text-brand-deep-green">
            Booking Confirmed!
          </h1>

          {booking ? (
            <div className="mt-6 w-full space-y-3 text-left">
              <div className="rounded-lg bg-brand-cream p-4 text-sm">
                <p className="font-semibold text-brand-deep-green">{tourTitle}</p>
                <div className="mt-2 space-y-1 text-muted-foreground">
                  <p>Reference: <strong className="text-foreground">{booking.booking_reference}</strong></p>
                  <p>Guests: {booking.num_guests}</p>
                  <p>Date: {booking.preferred_date}</p>
                  <p>Total: <strong className="text-brand-terracotta">{formatUsdPrice(booking.total_amount)}</strong></p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                A confirmation email has been sent to <strong>{booking.guest_email}</strong>.
              </p>
            </div>
          ) : (
            <p className="mt-4 text-muted-foreground">
              Your booking has been received. Check your email for details.
            </p>
          )}

          <div className="mt-8 flex gap-3">
            <Button asChild>
              <Link href="/tours">Browse More Tours</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/">Home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
