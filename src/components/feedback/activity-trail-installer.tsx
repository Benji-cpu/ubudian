"use client";

import { useEffect } from "react";
import { installActivityTrail } from "@/lib/feedback/activity-trail";

/**
 * Installs the global activity-trail recorder on mount. Lives in the root
 * layout so the buffer captures events from the very first paint.
 */
export function ActivityTrailInstaller() {
  useEffect(() => {
    installActivityTrail();
  }, []);
  return null;
}
