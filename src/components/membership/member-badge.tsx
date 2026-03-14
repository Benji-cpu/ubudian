import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

export function MemberBadge() {
  return (
    <Badge className="gap-1 bg-brand-gold text-white">
      <Sparkles className="h-3 w-3" />
      Insider
    </Badge>
  );
}
