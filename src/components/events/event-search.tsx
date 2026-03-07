"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

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

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Search events..."
        value={query}
        onChange={(e) => {
          isUserTyping.current = true;
          setQuery(e.target.value);
        }}
        className="pl-9"
      />
    </div>
  );
}
