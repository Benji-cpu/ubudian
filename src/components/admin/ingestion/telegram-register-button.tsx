"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, Info } from "lucide-react";

interface WebhookStatus {
  registered_url: string | null;
  expected_url: string | null;
  url_matches: boolean | null;
  pending_update_count: number;
  last_error_date: string | null;
  last_error_message: string | null;
}

export function TelegramRegisterButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [status, setStatus] = useState<WebhookStatus | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  async function handleRegister() {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/admin/ingestion/telegram/register-webhook", {
        method: "POST",
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        setResult({ ok: true, message: data.description || "Webhook registered" });
      } else {
        setResult({ ok: false, message: data.error || "Registration failed" });
      }
    } catch {
      setResult({ ok: false, message: "Network error" });
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckStatus() {
    setStatusLoading(true);
    setStatus(null);
    setStatusError(null);

    try {
      const res = await fetch("/api/admin/ingestion/telegram/webhook-status");
      const data = await res.json();

      if (res.ok) {
        setStatus(data);
      } else {
        setStatusError(data.error || "Failed to fetch status");
      }
    } catch {
      setStatusError("Network error");
    } finally {
      setStatusLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Button size="sm" variant="outline" onClick={handleRegister} disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Register Webhook
        </Button>
        <Button size="sm" variant="ghost" onClick={handleCheckStatus} disabled={statusLoading}>
          {statusLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Info className="mr-2 h-4 w-4" />
          )}
          Check Status
        </Button>
        {result && (
          <span className={`flex items-center gap-1 text-xs ${result.ok ? "text-green-600" : "text-red-600"}`}>
            {result.ok ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
            {result.message}
          </span>
        )}
      </div>

      {statusError && (
        <p className="text-xs text-red-600">{statusError}</p>
      )}

      {status && (
        <div className="rounded-md border p-3 text-xs space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="font-medium">Registered URL:</span>
            <span className={status.url_matches ? "text-green-600" : "text-red-600"}>
              {status.registered_url || "Not set"}
            </span>
          </div>
          {status.expected_url && !status.url_matches && (
            <div className="flex items-center gap-2">
              <span className="font-medium">Expected URL:</span>
              <span className="text-muted-foreground">{status.expected_url}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="font-medium">Pending updates:</span>
            <span>{status.pending_update_count}</span>
          </div>
          {status.last_error_message && (
            <div className="flex items-start gap-2 text-red-600">
              <span className="font-medium shrink-0">Last error:</span>
              <span>
                {status.last_error_message}
                {status.last_error_date && (
                  <> ({new Date(status.last_error_date).toLocaleString()})</>
                )}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
