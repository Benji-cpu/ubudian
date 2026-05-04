import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Story } from "@/types";

interface FacilitatorCardProps {
  organizerName: string | null;
}

export async function FacilitatorCard({ organizerName }: FacilitatorCardProps) {
  if (!organizerName) return null;

  let story: Story | null = null;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("stories")
      .select("*")
      .eq("status", "published")
      .ilike("related_organizer_name", organizerName)
      .limit(1)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      console.error("FacilitatorCard: story query error:", error);
      return null;
    }

    story = (data as Story | null) ?? null;
  } catch (err) {
    console.error("FacilitatorCard: failed to load story:", err);
    return null;
  }

  if (!story) return null;

  const portrait = story.photo_urls?.[0] ?? null;

  return (
    <aside className="rounded-xl border border-brand-gold/25 bg-brand-cream/60 p-4 sm:p-5">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-brand-gold">
        Meet your host
      </p>
      <Link
        href={`/stories/${story.slug}`}
        className="mt-3 flex items-center gap-4 rounded-lg transition-colors hover:bg-muted/60"
      >
        {portrait ? (
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full ring-2 ring-border">
            <Image
              src={portrait}
              alt={story.subject_name}
              fill
              sizes="64px"
              className="object-cover"
            />
          </div>
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-deep-green/10 font-serif text-xl text-brand-deep-green ring-2 ring-border">
            {story.subject_name?.charAt(0) ?? "?"}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-serif text-base font-semibold text-brand-deep-green">
            {story.subject_name}
          </p>
          {story.subject_tagline && (
            <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
              {story.subject_tagline}
            </p>
          )}
          <p className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-brand-deep-green underline-offset-4 group-hover:underline">
            Read their story
            <ArrowRight className="h-3 w-3" />
          </p>
        </div>
      </Link>
    </aside>
  );
}
