import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Profile, ArchetypeId } from "@/types";
import { ARCHETYPES } from "@/lib/quiz-data";

interface DashboardHeaderProps {
  profile: Profile;
  archetype?: ArchetypeId | null;
}

export function DashboardHeader({ profile, archetype }: DashboardHeaderProps) {
  const initials = (profile.display_name || profile.email || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const archetypeData = archetype ? ARCHETYPES[archetype] : null;

  return (
    <div className="flex items-center gap-4">
      <Avatar className="h-14 w-14">
        <AvatarImage
          src={profile.avatar_url || undefined}
          alt={profile.display_name || ""}
        />
        <AvatarFallback className="bg-brand-deep-green text-lg text-brand-cream">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div>
        <h1 className="font-serif text-2xl font-medium text-foreground">
          Welcome back, {profile.display_name || "there"}
        </h1>
        {archetypeData && (
          <Badge
            variant="outline"
            className="mt-1 border-brand-gold/30 text-brand-deep-green"
          >
            {archetypeData.name}
          </Badge>
        )}
      </div>
    </div>
  );
}
