import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { formatUsdPrice } from "@/lib/stripe/helpers";
import { CancelBookingButton } from "./cancel-button";
import type { Booking } from "@/types";

interface BookingDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function BookingDetailPage({ params }: BookingDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("bookings")
    .select("*, tours(title, slug)")
    .eq("id", id)
    .single();

  if (!data) notFound();

  const booking = data as Booking & { tours: { title: string; slug: string } };

  return (
    <div>
      <div className="mb-6">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/commerce">
            <ArrowLeft className="mr-2 h-4 w-4" />
            All Bookings
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <h1 className="text-3xl font-bold">{booking.booking_reference}</h1>
        <Badge variant={booking.status === "confirmed" || booking.status === "completed" ? "default" : "outline"}>
          {booking.status}
        </Badge>
        <Badge variant={booking.stripe_payment_status === "paid" ? "default" : "secondary"}>
          {booking.stripe_payment_status}
        </Badge>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Booking Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <DetailRow label="Tour" value={booking.tours?.title ?? "—"} />
            <DetailRow label="Preferred Date" value={booking.preferred_date} />
            <DetailRow label="Guests" value={String(booking.num_guests)} />
            <DetailRow label="Price/Person" value={formatUsdPrice(booking.price_per_person)} />
            <DetailRow label="Total" value={formatUsdPrice(booking.total_amount)} />
            {booking.special_requests && (
              <DetailRow label="Special Requests" value={booking.special_requests} />
            )}
            <DetailRow label="Created" value={new Date(booking.created_at).toLocaleString()} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Guest Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <DetailRow label="Name" value={booking.guest_name} />
            <DetailRow label="Email" value={booking.guest_email} />
            <DetailRow label="Phone" value={booking.guest_phone ?? "—"} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stripe</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <DetailRow label="Session ID" value={booking.stripe_checkout_session_id ?? "—"} />
            <DetailRow label="Payment Intent" value={booking.stripe_payment_intent_id ?? "—"} />
            <DetailRow label="Payment Status" value={booking.stripe_payment_status} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(booking.status === "pending" || booking.status === "confirmed") && (
              <CancelBookingButton bookingId={booking.id} bookingReference={booking.booking_reference} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
