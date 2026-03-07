"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { STORY_THEME_TAGS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function ThemeFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTheme = searchParams.get("theme");

  function handleClick(tag: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (activeTheme === tag) {
      params.delete("theme");
    } else {
      params.set("theme", tag);
    }
    router.push(`/stories?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2 pb-2">
      <Badge
        variant={!activeTheme ? "default" : "outline"}
        className={cn(
          "shrink-0 cursor-pointer select-none py-1.5 px-3 text-sm",
          !activeTheme && "bg-primary text-primary-foreground"
        )}
        onClick={() => {
          const params = new URLSearchParams(searchParams.toString());
          params.delete("theme");
          router.push(`/stories?${params.toString()}`);
        }}
      >
        All
      </Badge>
      {STORY_THEME_TAGS.map((tag) => (
        <Badge
          key={tag}
          variant={activeTheme === tag ? "default" : "outline"}
          className={cn(
            "shrink-0 cursor-pointer select-none whitespace-nowrap py-1.5 px-3 text-sm",
            activeTheme === tag && "bg-primary text-primary-foreground"
          )}
          onClick={() => handleClick(tag)}
        >
          {tag}
        </Badge>
      ))}
    </div>
  );
}
