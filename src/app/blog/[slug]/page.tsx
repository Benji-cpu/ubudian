import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { calculateReadTime } from "@/lib/utils";
import { SITE_URL } from "@/lib/constants";
import { MarkdownContent } from "@/components/blog/markdown-content";
import { ShareButtons } from "@/components/blog/share-buttons";
import { PostCard } from "@/components/blog/post-card";
import { SmartBlogCta } from "@/components/blog/smart-blog-cta";
import { ArticleJsonLd } from "@/components/blog/article-json-ld";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { getCurrentUser, getCurrentProfile } from "@/lib/auth";
import { isInsider } from "@/lib/stripe/subscription";
import { MembersOnlyPaywall } from "@/components/membership/members-only-paywall";
import type { BlogPost } from "@/types";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  try {
    const { slug } = await params;
    const supabase = await createClient();

    const { data: post } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .single();

    if (!post) {
      return { title: "Post Not Found | The Ubudian" };
    }

    const blogPost = post as BlogPost;

    return {
      title: blogPost.meta_title || `${blogPost.title} | The Ubudian`,
      description: blogPost.meta_description || blogPost.excerpt || undefined,
      openGraph: {
        title: blogPost.meta_title || blogPost.title,
        description: blogPost.meta_description || blogPost.excerpt || undefined,
        images: blogPost.cover_image_url ? [blogPost.cover_image_url] : undefined,
        type: "article",
        publishedTime: blogPost.published_at || undefined,
      },
    };
  } catch {
    return { title: "Post Not Found | The Ubudian" };
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  let blogPost: BlogPost;
  let related: BlogPost[] = [];
  let showPaywall = false;

  try {
    const { slug } = await params;
    const supabase = await createClient();

    const { data: post } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .single();

    if (!post) {
      notFound();
    }

    blogPost = post as BlogPost;

    // Check members-only gating
    if (blogPost.is_members_only) {
      const user = await getCurrentUser();
      const insider = user ? await isInsider(user.id) : false;
      const admin = user ? (await getCurrentProfile())?.role === "admin" : false;
      if (!insider && !admin) showPaywall = true;
    }

    const { data: relatedPosts, error: relatedError } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("status", "published")
      .neq("id", blogPost.id)
      .order("published_at", { ascending: false })
      .limit(3);

    if (relatedError) console.error("Related blog posts query error:", relatedError);
    related = (relatedPosts ?? []) as BlogPost[];
  } catch {
    notFound();
  }

  const readTime = calculateReadTime(blogPost.content);
  const postUrl = `${SITE_URL}/blog/${blogPost.slug}`;

  return (
    <article>
      <ArticleJsonLd post={blogPost} />
      {/* Cover Image */}
      {blogPost.cover_image_url && (
        <div className="relative h-[480px] w-full">
          <Image
            src={blogPost.cover_image_url}
            alt={blogPost.title}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </div>
      )}

      {/* Breadcrumbs */}
      <nav className="mx-auto max-w-3xl px-4 pt-6 sm:px-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/blog">Blog</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{blogPost.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </nav>

      {/* Article Header */}
      <header className="mx-auto max-w-3xl px-4 pt-6 sm:px-6">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          {blogPost.published_at && (
            <time>{format(new Date(blogPost.published_at), "MMMM d, yyyy")}</time>
          )}
          <span>&middot;</span>
          <span>{readTime} min read</span>
        </div>
        <h1 className="mt-3 font-serif text-3xl font-bold tracking-tight text-brand-deep-green sm:text-4xl lg:text-5xl">
          {blogPost.title}
        </h1>
        {blogPost.excerpt && (
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            {blogPost.excerpt}
          </p>
        )}
      </header>

      {/* Article Body */}
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        {showPaywall ? <MembersOnlyPaywall /> : <MarkdownContent content={blogPost.content} />}
      </div>

      {/* Share Buttons */}
      <div className="mx-auto max-w-3xl border-t px-4 py-8 sm:px-6">
        <ShareButtons title={blogPost.title} url={postUrl} />
      </div>

      {/* Smart CTA */}
      <SmartBlogCta />

      {/* Related Posts */}
      {related.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <h2 className="font-serif text-2xl font-bold text-brand-deep-green">
            More from The Ubudian
          </h2>
          <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((relatedPost) => (
              <PostCard key={relatedPost.id} post={relatedPost} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
