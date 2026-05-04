"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useTheme } from "next-themes";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: number;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Write your content here...",
  height = 400,
}: RichTextEditorProps) {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  // Ensure client-side only rendering
  if (!mounted) {
    if (typeof window !== "undefined") {
      setMounted(true);
    }
    return (
      <div
        className="animate-pulse rounded-md border bg-muted"
        style={{ height }}
      />
    );
  }

  return (
    <div data-color-mode={resolvedTheme === "dark" ? "dark" : "light"}>
      <MDEditor
        value={value}
        onChange={(val) => onChange(val || "")}
        height={height}
        textareaProps={{ placeholder }}
        preview="live"
      />
    </div>
  );
}
