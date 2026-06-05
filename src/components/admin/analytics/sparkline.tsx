import { cn } from "@/lib/utils";

export interface SparklineProps {
  /** One value per bucket (e.g. accounts created per day). */
  points: number[];
  width?: number;
  height?: number;
  className?: string;
  /** Stroke/fill tone — brand green by default, gold for growth surfaces. */
  tone?: "green" | "gold";
}

const TONE = {
  green: { line: "text-brand-deep-green", area: "text-brand-deep-green/10" },
  gold: { line: "text-brand-gold", area: "text-brand-gold/10" },
} as const;

/**
 * Dependency-free inline-SVG sparkline. Uses `currentColor` (set via Tailwind
 * text-* classes) for the line and a faint filled area, so there are no
 * gradient-id collisions when several sparklines render on one page.
 */
export function Sparkline({
  points,
  width = 260,
  height = 48,
  className,
  tone = "green",
}: SparklineProps) {
  if (!points.length) return null;

  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = max - min || 1;
  const stepX = points.length > 1 ? width / (points.length - 1) : 0;

  const coords = points.map((p, i) => {
    const x = points.length > 1 ? i * stepX : width / 2;
    const y = height - ((p - min) / range) * height;
    return [x, y] as const;
  });

  const line = coords
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");
  const area = `${line} L${width.toFixed(1)},${height} L0,${height} Z`;
  const colors = TONE[tone];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={cn("h-12 w-full", className)}
      aria-hidden="true"
    >
      <path d={area} fill="currentColor" stroke="none" className={colors.area} />
      <path
        d={line}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        className={colors.line}
      />
    </svg>
  );
}
