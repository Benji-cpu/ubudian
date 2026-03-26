"use client";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format, formatDistanceToNow } from "date-fns";
import type { IngestionRun } from "@/types";

const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  running: "secondary",
  completed: "default",
  failed: "destructive",
};

export function RunHistoryTable({
  runs,
  sourceNames,
}: {
  runs: IngestionRun[];
  sourceNames: Record<string, string>;
}) {
  if (runs.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        No ingestion runs yet.
      </div>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Started</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead className="text-right">Fetched</TableHead>
              <TableHead className="text-right">Parsed</TableHead>
              <TableHead className="text-right">Created</TableHead>
              <TableHead className="text-right">Dupes</TableHead>
              <TableHead className="text-right">Errors</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {runs.map((run) => {
              const duration =
                run.completed_at && run.started_at
                  ? Math.round(
                      (new Date(run.completed_at).getTime() - new Date(run.started_at).getTime()) / 1000
                    )
                  : null;

              return (
                <TableRow key={run.id}>
                  <TableCell className="font-medium">
                    {sourceNames[run.source_id] || run.source_id.slice(0, 8)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[run.status]}>{run.status}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDistanceToNow(new Date(run.started_at), { addSuffix: true })}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {duration !== null ? `${duration}s` : "—"}
                  </TableCell>
                  <TableCell className="text-right">{run.messages_fetched}</TableCell>
                  <TableCell className="text-right">{run.messages_parsed}</TableCell>
                  <TableCell className="text-right font-medium text-green-700 dark:text-green-400">
                    {run.events_created}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {run.duplicates_found}
                  </TableCell>
                  <TableCell className="text-right">
                    {run.errors_count > 0 ? (
                      <span className="text-red-600">{run.errors_count}</span>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {runs.map((run) => {
          const duration =
            run.completed_at && run.started_at
              ? Math.round(
                  (new Date(run.completed_at).getTime() - new Date(run.started_at).getTime()) / 1000
                )
              : null;

          return (
            <div key={run.id} className="rounded-lg border p-3">
              <div className="flex items-start justify-between">
                <span className="text-sm font-medium">
                  {sourceNames[run.source_id] || run.source_id.slice(0, 8)}
                </span>
                <Badge variant={statusVariant[run.status]}>{run.status}</Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(run.started_at), { addSuffix: true })}
                {duration !== null ? ` · ${duration}s` : ""}
              </p>
              <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Fetched</dt>
                  <dd>{run.messages_fetched}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Parsed</dt>
                  <dd>{run.messages_parsed}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Created</dt>
                  <dd className="font-medium text-green-700 dark:text-green-400">{run.events_created}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Dupes</dt>
                  <dd className="text-muted-foreground">{run.duplicates_found}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Errors</dt>
                  <dd>
                    {run.errors_count > 0 ? (
                      <span className="text-red-600">{run.errors_count}</span>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </dd>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
