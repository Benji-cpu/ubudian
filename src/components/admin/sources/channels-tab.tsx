"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { SourceHealthCard } from "@/components/admin/ingestion/source-health-card";
import { TriggerRunButton } from "@/components/admin/ingestion/trigger-run-button";
import { TelegramGroupList } from "@/components/admin/ingestion/telegram-group-list";
import type { TelegramGroup } from "@/components/admin/ingestion/telegram-group-list";
import { WhatsAppGroupList } from "@/components/admin/ingestion/whatsapp-group-list";
import { Plus, Send, Smartphone } from "lucide-react";
import type { EventSource } from "@/types";

interface WhatsAppGroup {
  id: string;
  name: string;
}

interface ChannelsTabProps {
  sources: EventSource[];
  telegramSourceId: string | null;
  telegramGroups: TelegramGroup[];
  telegramAllowedGroups: string[];
  whatsappSourceId: string | null;
  whatsappGroups: WhatsAppGroup[];
  whatsappAllowedGroups: string[];
  whatsappMessageCounts: Record<string, number>;
}

export function ChannelsTab({
  sources,
  telegramSourceId,
  telegramGroups,
  telegramAllowedGroups,
  whatsappSourceId,
  whatsappGroups,
  whatsappAllowedGroups,
  whatsappMessageCounts,
}: ChannelsTabProps) {
  if (sources.length === 0) {
    return (
      <Card className="mt-4">
        <CardContent className="flex flex-col items-center py-12">
          <CardTitle className="mt-4 text-lg">No sources configured</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Add your first event source to start ingesting events.
          </p>
          <Button asChild className="mt-4">
            <Link href="/admin/ingestion/sources/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Source
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mt-4 space-y-8">
      {/* Source health cards grid */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Sources</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sources.map((source) => (
            <div key={source.id} className="space-y-2">
              <Link href={`/admin/ingestion/sources/${source.id}`}>
                <SourceHealthCard source={source} />
              </Link>
              <TriggerRunButton sourceId={source.id} sourceName={source.name} />
            </div>
          ))}
        </div>
      </div>

      {/* Telegram groups */}
      {telegramSourceId && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Send className="h-4 w-4" />
              Telegram Groups ({telegramGroups.length})
            </h2>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/ingestion/telegram">
                Full Dashboard
              </Link>
            </Button>
          </div>
          <TelegramGroupList
            sourceId={telegramSourceId}
            groups={telegramGroups}
            allowedGroups={telegramAllowedGroups}
          />
        </div>
      )}

      {/* WhatsApp groups */}
      {whatsappSourceId && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              WhatsApp Groups ({whatsappGroups.length})
            </h2>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/ingestion/whatsapp">
                Full Dashboard
              </Link>
            </Button>
          </div>
          <WhatsAppGroupList
            sourceId={whatsappSourceId}
            groups={whatsappGroups}
            allowedGroups={whatsappAllowedGroups}
            messageCounts={whatsappMessageCounts}
          />
        </div>
      )}
    </div>
  );
}
