import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NewsletterComposer } from "@/components/admin/newsletter-composer";
import type { NewsletterEdition } from "@/types";

interface EditNewsletterPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditNewsletterPage({ params }: EditNewsletterPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: edition } = await supabase
    .from("newsletter_editions")
    .select("*")
    .eq("id", id)
    .single();

  if (!edition) {
    notFound();
  }

  return (
    <div>
      <h1 className="text-3xl font-bold">Edit Newsletter Edition</h1>
      <p className="mt-1 text-muted-foreground">
        Update this newsletter edition.
      </p>
      <div className="mt-8">
        <NewsletterComposer initialData={edition as NewsletterEdition} />
      </div>
    </div>
  );
}
