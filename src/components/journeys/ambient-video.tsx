"use client";

import { useEffect, useRef, useState } from "react";

interface AmbientVideoProps {
  src: string;
  poster: string;
  alt?: string;
  className?: string;
  /** Slow Ken Burns drift on the poster while it's the only thing showing. */
  driftPoster?: boolean;
}

export function AmbientVideo({
  src,
  poster,
  alt = "",
  className = "",
  driftPoster = true,
}: AmbientVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [shouldPlayVideo, setShouldPlayVideo] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setShouldPlayVideo(false);
      return;
    }

    const conn = (navigator as Navigator & {
      connection?: { effectiveType?: string; saveData?: boolean };
    }).connection;
    if (conn?.saveData) {
      setShouldPlayVideo(false);
      return;
    }
    if (conn?.effectiveType === "slow-2g" || conn?.effectiveType === "2g" || conn?.effectiveType === "3g") {
      setShouldPlayVideo(false);
      return;
    }

    setShouldPlayVideo(true);
  }, []);

  if (!shouldPlayVideo) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <img
          src={poster}
          alt={alt}
          className={`h-full w-full object-cover ${
            driftPoster ? "motion-safe:animate-[ambient-drift_18s_ease-in-out_infinite_alternate]" : ""
          }`}
          loading="eager"
          decoding="async"
        />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        className="h-full w-full object-cover"
        aria-label={alt}
      />
    </div>
  );
}
