"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CopyPost({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked: the textarea below can still be selected by hand.
    }
  }

  return (
    <div className="space-y-3">
      <Button type="button" onClick={handleCopy} className="gap-1.5">
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied ? "Copied" : label}
      </Button>
      <textarea
        readOnly
        value={text}
        rows={Math.min(28, text.split("\n").length + 1)}
        onFocus={(e) => e.currentTarget.select()}
        className="w-full rounded-md border border-brand-gold/20 bg-card p-3 font-mono text-xs leading-relaxed"
        aria-label={label}
      />
    </div>
  );
}
