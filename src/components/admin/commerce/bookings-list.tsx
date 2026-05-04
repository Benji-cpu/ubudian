"use client";

import Link from "next/link";
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

const statusVariant: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "outline",
  confirmed: "default",
  cancelled: "secondary",
  completed: "default",
  refunded: "destructive",
};

export type BookingWithTour = Booking & { tours: { title: string } };

interface BookingsListProps {
  bookings: BookingWithTour[];
}

export function BookingsList({ bookings }: BookingsListProps) {
  if (bookings.length === 0) {
    return (
      <Card className="mt-4">
        <CardContent className="flex flex-col items-center py-12">
          <CreditCard className="h-12 w-12 text-muted-foreground/40" />
          <CardTitle className="mt-4 text-lg">No bookings yet</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Bookings will appear here once customers book tours.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mt-4">
      {/* Desktop table */}
      <div className="hidden md:block">
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
            {bookings.map((booking) => (
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
                  {booking.tours?.title ?? "\u2014"}
                </TableCell>
                <TableCell>
                  <div>
                    <div className="text-sm font-medium">
                      {booking.guest_name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {booking.guest_email}
                    </div>
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
                  <Badge
                    variant={
                      booking.stripe_payment_status === "paid"
                        ? "default"
                        : "outline"
                    }
                  >
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
      <div className="space-y-3 md:hidden">
        {bookings.map((booking) => (
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
                {booking.tours?.title ?? "\u2014"}
              </p>
              <p className="text-sm font-medium">{booking.guest_name}</p>
              <p className="text-xs text-muted-foreground">
                {booking.guest_email}
              </p>
              <dl className="mt-2 grid grid-cols-2 gap-2">
                <MobileCardField label="Date">
                  {booking.preferred_date}
                </MobileCardField>
                <MobileCardField label="Guests">
                  {booking.num_guests}
                </MobileCardField>
                <MobileCardField label="Total">
                  {formatUsdPrice(booking.total_amount)}
                </MobileCardField>
                <MobileCardField label="Payment">
                  <Badge
                    variant={
                      booking.stripe_payment_status === "paid"
                        ? "default"
                        : "outline"
                    }
                  >
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
