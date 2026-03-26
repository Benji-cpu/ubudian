import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CreditCard } from "lucide-react";
import { formatUsdPrice } from "@/lib/stripe/helpers";
import { MobileCardField } from "@/components/admin/mobile-card-field";
import type { Booking } from "@/types";

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  confirmed: "default",
  cancelled: "secondary",
  completed: "default",
  refunded: "destructive",
};

export default async function AdminBookingsPage() {
  const supabase = await createClient();

  const { data: bookings } = await supabase
    .from("bookings")
    .select("*, tours(title)")
    .order("created_at", { ascending: false });

  const allBookings = (bookings ?? []) as (Booking & { tours: { title: string } })[];

  if (allBookings.length === 0) {
    return (
      <div>
        <h1 className="text-3xl font-bold">Bookings</h1>
        <Card className="mt-8">
          <CardContent className="flex flex-col items-center py-12">
            <CreditCard className="h-12 w-12 text-muted-foreground/40" />
            <CardTitle className="mt-4 text-lg">No bookings yet</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Bookings will appear here once customers book tours.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold">Bookings</h1>

      {/* Desktop table */}
      <div className="mt-6 hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reference</TableHead>
              <TableHead>Tour</TableHead>
              <TableHead>Guest</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Guests</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allBookings.map((booking) => (
              <TableRow key={booking.id}>
                <TableCell>
                  <Link
                    href={`/admin/bookings/${booking.id}`}
                    className="font-mono text-sm font-medium hover:underline"
                  >
                    {booking.booking_reference}
                  </Link>
                </TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {booking.tours?.title ?? "—"}
                </TableCell>
                <TableCell>
                  <div>
                    <div className="text-sm font-medium">{booking.guest_name}</div>
                    <div className="text-xs text-muted-foreground">{booking.guest_email}</div>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {booking.preferred_date}
                </TableCell>
                <TableCell>{booking.num_guests}</TableCell>
                <TableCell className="font-medium">
                  {formatUsdPrice(booking.total_amount)}
                </TableCell>
                <TableCell>
                  <Badge variant={booking.stripe_payment_status === "paid" ? "default" : "outline"}>
                    {booking.stripe_payment_status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariant[booking.status] ?? "outline"}>
                    {booking.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="mt-6 space-y-3 md:hidden">
        {allBookings.map((booking) => (
          <Card key={booking.id} className="py-3">
            <CardContent className="px-4 py-0">
              <div className="flex items-start justify-between">
                <Link
                  href={`/admin/bookings/${booking.id}`}
                  className="font-mono text-sm font-medium hover:underline"
                >
                  {booking.booking_reference}
                </Link>
                <Badge variant={statusVariant[booking.status] ?? "outline"}>
                  {booking.status}
                </Badge>
              </div>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {booking.tours?.title ?? "—"}
              </p>
              <p className="text-sm font-medium">{booking.guest_name}</p>
              <p className="text-xs text-muted-foreground">{booking.guest_email}</p>
              <dl className="mt-2 grid grid-cols-2 gap-2">
                <MobileCardField label="Date">{booking.preferred_date}</MobileCardField>
                <MobileCardField label="Guests">{booking.num_guests}</MobileCardField>
                <MobileCardField label="Total">{formatUsdPrice(booking.total_amount)}</MobileCardField>
                <MobileCardField label="Payment">
                  <Badge variant={booking.stripe_payment_status === "paid" ? "default" : "outline"}>
                    {booking.stripe_payment_status}
                  </Badge>
                </MobileCardField>
              </dl>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
