"use client";

import { Button } from "@/components/ui/button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-bold">Admin Error</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {error.message}
      </p>
      <Button onClick={reset} className="mt-4" size="sm">
        Try again
      </Button>
    </div>
  );
}
