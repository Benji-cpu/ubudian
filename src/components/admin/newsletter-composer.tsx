"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/utils";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { ImageUploader } from "@/components/admin/image-uploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Trash2, Send } from "lucide-react";
import type { NewsletterEdition } from "@/types";

const newsletterSchema = z.object({
  subject: z.string().min(1, "Subject line is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase with hyphens"),
  preview_text: z.string().optional().or(z.literal("")),
  featured_story_excerpt: z.string().optional().or(z.literal("")),
  weekly_flow: z.string().optional().or(z.literal("")),
  community_bulletin: z.string().optional().or(z.literal("")),
  cultural_moment: z.string().optional().or(z.literal("")),
  weekly_question: z.string().optional().or(z.literal("")),
  weekly_question_responses: z.string().optional().or(z.literal("")),
  sponsor_name: z.string().optional().or(z.literal("")),
  sponsor_image_url: z.string().optional().or(z.literal("")),
  sponsor_url: z.string().optional().or(z.literal("")),
  sponsor_text: z.string().optional().or(z.literal("")),
  tour_spotlight_text: z.string().optional().or(z.literal("")),
});

type NewsletterFormValues = z.infer<typeof newsletterSchema>;

interface NewsletterComposerProps {
  initialData?: NewsletterEdition;
}

export function NewsletterComposer({ initialData }: NewsletterComposerProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(!!initialData);

  const isEditMode = !!initialData;

  const contentJson = (initialData?.content_json ?? {}) as Record<string, string>;

  const form = useForm<NewsletterFormValues>({
    resolver: zodResolver(newsletterSchema),
    defaultValues: {
      subject: initialData?.subject ?? "",
      slug: initialData?.slug ?? "",
      preview_text: initialData?.preview_text ?? "",
      featured_story_excerpt: contentJson.featured_story_excerpt ?? "",
      weekly_flow: contentJson.weekly_flow ?? "",
      community_bulletin: contentJson.community_bulletin ?? "",
      cultural_moment: contentJson.cultural_moment ?? "",
      weekly_question: contentJson.weekly_question ?? "",
      weekly_question_responses: contentJson.weekly_question_responses ?? "",
      sponsor_name: initialData?.sponsor_name ?? "",
      sponsor_image_url: initialData?.sponsor_image_url ?? "",
      sponsor_url: initialData?.sponsor_url ?? "",
      sponsor_text: initialData?.sponsor_text ?? "",
      tour_spotlight_text: contentJson.tour_spotlight_text ?? "",
    },
  });

  const subject = form.watch("subject");

  useEffect(() => {
    if (!isEditMode && !slugManuallyEdited && subject) {
      form.setValue("slug", slugify(subject));
    }
  }, [subject, isEditMode, slugManuallyEdited, form]);

  async function saveEdition(status: "draft" | "published") {
    const data = form.getValues();
    setSaving(true);
    const supabase = createClient();

    const contentJsonPayload = {
      featured_story_excerpt: data.featured_story_excerpt || "",
      weekly_flow: data.weekly_flow || "",
      community_bulletin: data.community_bulletin || "",
      cultural_moment: data.cultural_moment || "",
      weekly_question: data.weekly_question || "",
      weekly_question_responses: data.weekly_question_responses || "",
      tour_spotlight_text: data.tour_spotlight_text || "",
    };

    const payload: Record<string, unknown> = {
      subject: data.subject,
      slug: data.slug,
      preview_text: data.preview_text || null,
      content_json: contentJsonPayload,
      sponsor_name: data.sponsor_name || null,
      sponsor_image_url: data.sponsor_image_url || null,
      sponsor_url: data.sponsor_url || null,
      sponsor_text: data.sponsor_text || null,
      status,
    };

    let error;

    if (isEditMode) {
      ({ error } = await supabase.from("newsletter_editions").update(payload).eq("id", initialData.id));
    } else {
      ({ error } = await supabase.from("newsletter_editions").insert(payload));
    }

    setSaving(false);

    if (error) {
      form.setError("root", { message: error.message });
      return;
    }

    router.push("/admin/newsletter");
    router.refresh();
  }

  async function handlePushToBeehiiv() {
    if (!isEditMode) return;
    setPushing(true);

    try {
      const res = await fetch("/api/newsletter/push-to-beehiiv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ editionId: initialData.id }),
      });

      if (!res.ok) {
        const data = await res.json();
        form.setError("root", { message: data.error || "Failed to push to Beehiiv" });
      } else {
        router.refresh();
      }
    } catch {
      form.setError("root", { message: "Failed to push to Beehiiv" });
    }

    setPushing(false);
  }

  async function handleDelete() {
    setDeleting(true);
    const supabase = createClient();

    const { error } = await supabase.from("newsletter_editions").delete().eq("id", initialData!.id);

    setDeleting(false);

    if (error) {
      form.setError("root", { message: error.message });
      return;
    }

    setDeleteOpen(false);
    router.push("/admin/newsletter");
    router.refresh();
  }

  return (
    <Form {...form}>
      <form className="space-y-6">
        {form.formState.errors.root && (
          <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
            {form.formState.errors.root.message}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject Line</FormLabel>
                  <FormControl>
                    <Input placeholder="This week in Ubud..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="edition-slug"
                      {...field}
                      onChange={(e) => {
                        setSlugManuallyEdited(true);
                        field.onChange(e);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="preview_text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preview Text</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Shows in email inbox preview..." rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Accordion type="multiple" className="w-full">
              <AccordionItem value="featured-story">
                <AccordionTrigger>Featured Story</AccordionTrigger>
                <AccordionContent>
                  <FormField
                    control={form.control}
                    name="featured_story_excerpt"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <RichTextEditor value={field.value || ""} onChange={field.onChange} placeholder="Featured story excerpt..." height={250} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="weekly-flow">
                <AccordionTrigger>Weekly Flow (Events)</AccordionTrigger>
                <AccordionContent>
                  <FormField
                    control={form.control}
                    name="weekly_flow"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <RichTextEditor value={field.value || ""} onChange={field.onChange} placeholder="This week's events narrative..." height={250} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="community-bulletin">
                <AccordionTrigger>Community Bulletin</AccordionTrigger>
                <AccordionContent>
                  <FormField
                    control={form.control}
                    name="community_bulletin"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <RichTextEditor value={field.value || ""} onChange={field.onChange} placeholder="Community updates..." height={250} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="cultural-moment">
                <AccordionTrigger>Cultural Moment</AccordionTrigger>
                <AccordionContent>
                  <FormField
                    control={form.control}
                    name="cultural_moment"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <RichTextEditor value={field.value || ""} onChange={field.onChange} placeholder="This week's cultural insight..." height={250} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="weekly-question">
                <AccordionTrigger>Weekly Question</AccordionTrigger>
                <AccordionContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="weekly_question"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Question</FormLabel>
                        <FormControl>
                          <Input placeholder="This week's question for the community..." {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="weekly_question_responses"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Responses</FormLabel>
                        <FormControl>
                          <RichTextEditor value={field.value || ""} onChange={field.onChange} placeholder="Community responses..." height={200} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="tour-spotlight">
                <AccordionTrigger>Tour Spotlight</AccordionTrigger>
                <AccordionContent>
                  <FormField
                    control={form.control}
                    name="tour_spotlight_text"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <RichTextEditor value={field.value || ""} onChange={field.onChange} placeholder="Featured tour CTA..." height={200} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="space-y-4 rounded-md border p-4">
              <h3 className="text-sm font-medium">Sponsor</h3>
              <FormField
                control={form.control}
                name="sponsor_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sponsor Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Sponsor name" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sponsor_image_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sponsor Image</FormLabel>
                    <FormControl>
                      <ImageUploader folder="sponsors" value={field.value} onChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sponsor_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sponsor URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sponsor_text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sponsor Description</FormLabel>
                    <FormControl>
                      <Textarea rows={3} placeholder="Brief sponsor message..." {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3 border-t pt-6">
          <Button type="button" variant="outline" onClick={() => saveEdition("draft")} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Draft
          </Button>
          <Button type="button" onClick={() => saveEdition("published")} disabled={saving}>
            Publish to Archive
          </Button>

          {isEditMode && (
            <Button type="button" variant="secondary" onClick={handlePushToBeehiiv} disabled={pushing}>
              {pushing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Push to Beehiiv
            </Button>
          )}

          <div className="flex-1" />

          {isEditMode && (
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
              <DialogTrigger asChild>
                <Button type="button" variant="destructive" size="icon">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Edition</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete this newsletter edition? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                    {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Delete
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </form>
    </Form>
  );
}
