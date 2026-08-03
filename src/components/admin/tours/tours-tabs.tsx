"use client";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToursList } from "@/components/admin/tours/tours-list";
import type { Tour } from "@/types";

interface ToursTabsProps {
  tours: Tour[];
}

export function ToursTabs({ tours }: ToursTabsProps) {
  return (
    <Tabs defaultValue="tours">
      <TabsList>
        <TabsTrigger value="tours">
          Tours
          <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-xs">
            {tours.length}
          </Badge>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="tours">
        <ToursList tours={tours} />
      </TabsContent>
    </Tabs>
  );
}
