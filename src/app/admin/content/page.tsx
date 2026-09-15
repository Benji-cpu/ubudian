import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ContentTabs } from "@/components/admin/content/content-tabs";
import type { NewsletterEdition } from "@/types";

export default async function AdminContentPage() {
  const supabase = await createClient();

  const newsletterRes = await supabase
    .from("newsletter_editions")
    .select("*")
    .order("created_at", { ascending: false });
  const editions = (newsletterRes.data ?? []) as NewsletterEdition[];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Newsletter editions</h1>
        <Button asChild>
          <Link href="/admin/newsletter/new">
            <Plus className="mr-2 h-4 w-4" />
            New edition
          </Link>
        </Button>
      </div>

      <div className="mt-6">
        <ContentTabs editions={editions} />
      </div>
    </div>
  );
}
