"use client";

import { createElement, useEffect, useRef, useState } from "react";

interface WordRevealProps {
  text: string;
  as?: "p" | "h1" | "h2" | "h3" | "span" | "blockquote";
  className?: string;
  staggerMs?: number;
  startOnMount?: boolean;
}

export function WordReveal({
  text,
  as = "p",
  className = "",
  staggerMs = 60,
  startOnMount = false,
}: WordRevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [revealed, setRevealed] = useState(startOnMount);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setRevealed(true);
      return;
    }

    if (startOnMount) {
      setRevealed(true);
      return;
    }

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.intersectionRatio >= 0.5) {
            setRevealed(true);
            observer.disconnect();
          }
        });
      },
      { threshold: [0.5] }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [startOnMount]);

  const words = text.split(" ");

  const children = words.map((word, i) => (
    <span
      key={i}
      aria-hidden="true"
      className="inline-block"
      style={{
        opacity: revealed ? 1 : 0,
        transform: revealed ? "translateY(0)" : "translateY(0.4em)",
        transition: `opacity 700ms cubic-bezier(0.22, 0.61, 0.36, 1) ${i * staggerMs}ms, transform 700ms cubic-bezier(0.22, 0.61, 0.36, 1) ${i * staggerMs}ms`,
      }}
    >
      {word}
      {i < words.length - 1 && "\u00A0"}
    </span>
  ));

  return createElement(
    as,
    {
      ref,
      className,
      "aria-label": text,
    },
    children
  );
}
