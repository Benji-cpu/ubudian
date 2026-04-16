"use client";

import { useEffect } from "react";
import Link from "next/link";
import { X } from "lucide-react";

interface QuizImmersiveShellProps {
  children: React.ReactNode;
}

export function QuizImmersiveShell({ children }: QuizImmersiveShellProps) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-gradient-to-br from-brand-cream via-background to-brand-cream">
      {/* Minimal top bar */}
      <div className="flex items-center justify-end px-4 py-3">
        <Link
          href="/"
          className="flex h-10 w-10 items-center justify-center rounded-full text-brand-charcoal-light transition-colors hover:bg-brand-charcoal/10 hover:text-brand-charcoal"
          aria-label="Close quiz"
        >
          <X className="h-5 w-5" />
        </Link>
      </div>

      {/* Content area */}
      <div className="flex flex-1 items-center justify-center overflow-y-auto px-4">
        {children}
      </div>
    </div>
  );
}
