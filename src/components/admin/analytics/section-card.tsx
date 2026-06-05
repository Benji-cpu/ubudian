import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface SectionCardProps {
  title: string;
  icon?: React.ReactNode;
  hint?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Titled card used for the leaderboards / charts inside each analytics
 * section. `hint` renders a small "what to do if this is low" line so the
 * numbers nudge toward a decision, not just observation.
 */
export function SectionCard({ title, icon, hint, action, children }: SectionCardProps) {
  return (
    <Card className="h-full gap-3">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            {icon}
            {title}
          </CardTitle>
          {action}
        </div>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
