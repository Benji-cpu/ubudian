"use client";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToursList } from "@/components/admin/tours/tours-list";
import { ExperiencesList } from "@/components/admin/tours/experiences-list";
import type { Tour, Experience } from "@/types";

interface ToursTabsProps {
  tours: Tour[];
  experiences: Experience[];
}

export function ToursTabs({ tours, experiences }: ToursTabsProps) {
  return (
    <Tabs defaultValue="tours">
      <TabsList>
        <TabsTrigger value="tours">
          Tours
          <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-xs">
            {tours.length}
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="experiences">
          Experiences
          <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-xs">
            {experiences.length}
          </Badge>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="tours">
        <ToursList tours={tours} />
      </TabsContent>

      <TabsContent value="experiences">
        <ExperiencesList experiences={experiences} />
      </TabsContent>
    </Tabs>
  );
}
