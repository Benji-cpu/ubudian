"use client";

import { useEffect } from "react";
import { countingOff } from "@/lib/specials/deal-track";

/** Opening any page with `?nocount=1` turns the deal page counter off in this browser (our own checks). */
export function NoCountFlag() {
  useEffect(() => {
    countingOff();
  }, []);
  return null;
}
