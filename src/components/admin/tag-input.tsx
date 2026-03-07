"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TagInputProps {
  options: readonly string[];
  value: string[];
  onChange: (tags: string[]) => void;
}

export function TagInput({ options, value, onChange }: TagInputProps) {
  function toggleTag(tag: string) {
    if (value.includes(tag)) {
      onChange(value.filter((t) => t !== tag));
    } else {
      onChange([...value, tag]);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((tag) => {
        const selected = value.includes(tag);
        return (
          <Badge
            key={tag}
            variant={selected ? "default" : "outline"}
            className={cn(
              "cursor-pointer select-none transition-colors",
              selected
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "hover:bg-muted"
            )}
            onClick={() => toggleTag(tag)}
          >
            {tag}
          </Badge>
        );
      })}
    </div>
  );
}
