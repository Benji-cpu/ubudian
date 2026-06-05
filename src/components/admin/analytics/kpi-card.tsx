import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface KpiCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  icon?: React.ReactNode;
  href?: string;
  valueClassName?: string;
}

/**
 * Compact metric card for the analytics dashboard. Mirrors the look of the
 * Ops Center `MetricsRow` cards but is generic and reusable across sections.
 */
export function KpiCard({
  label,
  value,
  sublabel,
  icon,
  href,
  valueClassName,
}: KpiCardProps) {
  const content = (
    <Card
      className={cn(
        "h-full gap-2 py-4 transition-shadow",
        href && "cursor-pointer hover:shadow-md"
      )}
    >
      <CardContent className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p
            className={cn(
              "mt-1 text-2xl font-bold tabular-nums",
              valueClassName
            )}
          >
            {value}
          </p>
          {sublabel && (
            <p className="mt-0.5 text-xs text-muted-foreground">{sublabel}</p>
          )}
        </div>
        {icon && <span className="shrink-0 text-muted-foreground">{icon}</span>}
      </CardContent>
    </Card>
  );

  return href ? (
    <Link href={href} className="block">
      {content}
    </Link>
  ) : (
    <div>{content}</div>
  );
}
