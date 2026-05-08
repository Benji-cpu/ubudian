export const motion = {
  durations: {
    fast: 200,
    medium: 350,
    slow: 600,
    drift: 12000,
  },
  easings: {
    out: "cubic-bezier(0.22, 0.61, 0.36, 1)",
    inOut: "cubic-bezier(0.65, 0, 0.35, 1)",
    soft: "cubic-bezier(0.4, 0, 0.2, 1)",
  },
  staggers: {
    tile: 50,
    card: 100,
    word: 60,
  },
} as const;

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function isSlowConnection(): boolean {
  if (typeof navigator === "undefined") return false;
  const conn = (navigator as Navigator & {
    connection?: { effectiveType?: string; saveData?: boolean };
  }).connection;
  if (!conn) return false;
  if (conn.saveData) return true;
  return conn.effectiveType === "slow-2g" || conn.effectiveType === "2g" || conn.effectiveType === "3g";
}
