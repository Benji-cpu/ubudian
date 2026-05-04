"use client";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChannelsTab } from "@/components/admin/sources/channels-tab";
import { VenuesTab } from "@/components/admin/sources/venues-tab";
import { DedupTab } from "@/components/admin/sources/dedup-tab";
import type { TelegramGroup } from "@/components/admin/ingestion/telegram-group-list";
import type { EventSource, VenueAlias, UnresolvedVenue, DedupMatch, Event } from "@/types";

interface WhatsAppGroup {
  id: string;
  name: string;
}

interface SourcesTabsProps {
  sources: EventSource[];
  telegramSourceId: string | null;
  telegramGroups: TelegramGroup[];
  telegramAllowedGroups: string[];
  whatsappSourceId: string | null;
  whatsappGroups: WhatsAppGroup[];
  whatsappAllowedGroups: string[];
  whatsappMessageCounts: Record<string, number>;
  aliases: VenueAlias[];
  unresolvedVenues: UnresolvedVenue[];
  dedupMatches: DedupMatch[];
  dedupEventsMap: Record<string, Event>;
}

export function SourcesTabs({
  sources,
  telegramSourceId,
  telegramGroups,
  telegramAllowedGroups,
  whatsappSourceId,
  whatsappGroups,
  whatsappAllowedGroups,
  whatsappMessageCounts,
  aliases,
  unresolvedVenues,
  dedupMatches,
  dedupEventsMap,
}: SourcesTabsProps) {
  return (
    <Tabs defaultValue="channels">
      <TabsList>
        <TabsTrigger value="channels">
          Channels
          <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-xs">
            {sources.length}
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="venues">
          Venues
          {unresolvedVenues.length > 0 && (
            <Badge variant="destructive" className="ml-1.5 px-1.5 py-0 text-xs">
              {unresolvedVenues.length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="dedup">
          Dedup
          {dedupMatches.length > 0 && (
            <Badge variant="destructive" className="ml-1.5 px-1.5 py-0 text-xs">
              {dedupMatches.length}
            </Badge>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="channels">
        <ChannelsTab
          sources={sources}
          telegramSourceId={telegramSourceId}
          telegramGroups={telegramGroups}
          telegramAllowedGroups={telegramAllowedGroups}
          whatsappSourceId={whatsappSourceId}
          whatsappGroups={whatsappGroups}
          whatsappAllowedGroups={whatsappAllowedGroups}
          whatsappMessageCounts={whatsappMessageCounts}
        />
      </TabsContent>

      <TabsContent value="venues">
        <VenuesTab aliases={aliases} unresolvedVenues={unresolvedVenues} />
      </TabsContent>

      <TabsContent value="dedup">
        <DedupTab matches={dedupMatches} eventsMap={dedupEventsMap} />
      </TabsContent>
    </Tabs>
  );
}
