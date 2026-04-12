"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SORT_OPTIONS = [
  { value: "date", label: "Date (soonest)" },
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
      <SelectTrigger size="sm" className="w-[160px]">
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
