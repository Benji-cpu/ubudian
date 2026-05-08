"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SORT_OPTIONS = [
  { value: "date", label: "Soonest first" },
  { value: "newest", label: "Recently added" },
] as const;

export function EventSortSelect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get("sort") || "date";

  function setSort(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "date") {
      params.delete("sort");
    } else {
      params.set("sort", value);
    }
    router.push(`/events?${params.toString()}`);
  }

  return (
    <Select value={currentSort} onValueChange={setSort}>
      <SelectTrigger
        size="default"
        className="h-10 min-w-[170px] border-brand-deep-green/15 bg-white/60 text-brand-charcoal shadow-sm backdrop-blur-sm hover:border-brand-deep-green/30"
        aria-label="Sort events"
      >
        <ArrowUpDown className="h-3.5 w-3.5 text-brand-deep-green/60" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {SORT_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
