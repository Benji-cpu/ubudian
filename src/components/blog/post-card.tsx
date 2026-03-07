import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { ImageIcon } from "lucide-react";
import type { BlogPost } from "@/types";

interface PostCardProps {
  post: BlogPost;
}

export function PostCard({ post }: PostCardProps) {
  return (
    <Link href={`/blog/${post.slug}`} className="group block">
      <article className="overflow-hidden rounded-sm border border-brand-gold/10 bg-card transition-shadow hover:shadow-md">
        {post.cover_image_url ? (
          <div className="relative aspect-video w-full">
            <Image
              src={post.cover_image_url}
              alt={post.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
            />
          </div>
        ) : (
          <div className="flex aspect-video items-center justify-center bg-muted">
            <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
          </div>
        )}
        <div className="p-5">
          {post.published_at && (
            <time className="text-xs text-muted-foreground">
              {format(new Date(post.published_at), "MMMM d, yyyy")}
            </time>
          )}
          <h3 className="mt-1 font-serif text-lg font-semibold leading-snug text-foreground line-clamp-2 group-hover:text-primary">
            {post.title}
          </h3>
          {post.excerpt && (
            <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
              {post.excerpt}
            </p>
          )}
        </div>
      </article>
    </Link>
  );
}
