"use client";
import { useEffect } from "react";

export function HomepageScrollSnap() {
  useEffect(() => {
    document.documentElement.classList.add("snap-homepage");
    return () => document.documentElement.classList.remove("snap-homepage");
  }, []);
  return null;
}
