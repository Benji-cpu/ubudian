"use client";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookingsList } from "@/components/admin/commerce/bookings-list";
import { SubscriptionsList } from "@/components/admin/commerce/subscriptions-list";
import type { BookingWithTour } from "@/components/admin/commerce/bookings-list";
import type { SubscriptionWithProfile } from "@/components/admin/commerce/subscriptions-list";

interface CommerceTabsProps {
  bookings: BookingWithTour[];
  subscriptions: SubscriptionWithProfile[];
}

export function CommerceTabs({ bookings, subscriptions }: CommerceTabsProps) {
  return (
    <Tabs defaultValue="bookings">
      <TabsList>
        <TabsTrigger value="bookings">
          Bookings
          <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-xs">
            {bookings.length}
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="subscriptions">
          Subscriptions
          <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-xs">
            {subscriptions.length}
          </Badge>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="bookings">
        <BookingsList bookings={bookings} />
      </TabsContent>

      <TabsContent value="subscriptions">
        <SubscriptionsList subscriptions={subscriptions} />
      </TabsContent>
    </Tabs>
  );
}
