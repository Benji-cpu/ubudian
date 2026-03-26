import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function formatConfigKey(key: string): string {
  return key
    .replace(/^_/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatNumberValue(key: string, value: number): string {
  if (key.endsWith("_ms")) return `${value.toLocaleString()} ms`;
  if (key.includes("minutes") || key.endsWith("_min")) return `${value} min`;
  return String(value);
}

function ConfigValue({ configKey, value }: { configKey: string; value: unknown }) {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-sm text-muted-foreground">None</span>;
    }
    return (
      <div className="flex flex-wrap gap-1.5">
        {value.map((item, i) => (
          <Badge key={i} variant="secondary" className="font-normal">
            {String(item)}
          </Badge>
        ))}
        <span className="text-xs text-muted-foreground self-center">({value.length})</span>
      </div>
    );
  }

  if (typeof value === "boolean") {
    return (
      <Badge variant={value ? "default" : "outline"}>
        {value ? "Yes" : "No"}
      </Badge>
    );
  }

  if (typeof value === "number") {
    return <span className="text-sm font-medium">{formatNumberValue(configKey, value)}</span>;
  }

  if (typeof value === "string") {
    return <span className="text-sm">{value}</span>;
  }

  if (value !== null && typeof value === "object") {
    return (
      <pre className="mt-1 rounded-md bg-muted p-3 text-xs overflow-x-auto">
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  }

  return <span className="text-sm text-muted-foreground">—</span>;
}

export function SourceConfigPanel({ config }: { config: Record<string, unknown> }) {
  const entries = Object.entries(config);

  if (entries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No configuration set.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {entries.map(([key, value]) => (
          <div key={key}>
            <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
              {formatConfigKey(key)}
            </dt>
            <dd>
              <ConfigValue configKey={key} value={value} />
            </dd>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
