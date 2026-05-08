"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function EventSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const isUserTyping = useRef(false);

  useEffect(() => {
    if (!isUserTyping.current) return;

    const timeout = setTimeout(() => {
      isUserTyping.current = false;
      const params = new URLSearchParams(searchParams.toString());
      if (query) {
        params.set("q", query);
      } else {
        params.delete("q");
      }
      router.push(`/events?${params.toString()}`);
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

  function clearQuery() {
    isUserTyping.current = true;
    setQuery("");
  }

  return (
    <div className="relative flex-1">
      <Search
        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-deep-green/50"
        aria-hidden
      />
      <Input
        type="search"
        placeholder="Search events, venues, teachers…"
        value={query}
        onChange={(e) => {
          isUserTyping.current = true;
          setQuery(e.target.value);
        }}
        aria-label="Search events"
        className={cn(
          "h-10 border-brand-deep-green/15 bg-white/60 pl-10 pr-9 text-brand-charcoal shadow-sm backdrop-blur-sm",
          "placeholder:text-brand-charcoal/50",
          "focus-visible:border-brand-deep-green/40 focus-visible:ring-brand-gold/30"
        )}
      />
      {query && (
        <button
          type="button"
          onClick={clearQuery}
          aria-label="Clear search"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-brand-deep-green/50 transition hover:bg-brand-deep-green/10 hover:text-brand-deep-green"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
