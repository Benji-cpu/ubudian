"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/utils";
import { STORY_THEME_TAGS } from "@/lib/constants";
import { ARCHETYPE_IDS } from "@/lib/quiz-data";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { MultiImageUploader } from "@/components/admin/multi-image-uploader";
import { TagInput } from "@/components/admin/tag-input";
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
  FormDescription,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Trash2 } from "lucide-react";
import type { Story } from "@/types";

const storySchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase with hyphens only"),
  subject_name: z.string().min(1, "Subject name is required"),
  subject_instagram: z.string().optional().or(z.literal("")),
  subject_tagline: z.string().max(100, "Tagline must be 100 characters or less").optional().or(z.literal("")),
  photo_urls: z.array(z.string()),
  narrative: z.string().min(1, "Narrative is required"),
  theme_tags: z.array(z.string()),
  archetype_tags: z.array(z.enum(["seeker", "explorer", "creative", "connector", "epicurean"])),
  status: z.enum(["draft", "published", "archived"]),
  related_organizer_name: z.string().optional().or(z.literal("")),
  meta_title: z.string().max(70).optional().or(z.literal("")),
  meta_description: z.string().max(160).optional().or(z.literal("")),
});

type StoryFormValues = z.infer<typeof storySchema>;

interface StoryFormProps {
  initialData?: Story;
}

export function StoryForm({ initialData }: StoryFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(!!initialData);

  const isEditMode = !!initialData;

  const form = useForm<StoryFormValues>({
    resolver: zodResolver(storySchema),
    defaultValues: {
      title: initialData?.title ?? "",
      slug: initialData?.slug ?? "",
      subject_name: initialData?.subject_name ?? "",
      subject_instagram: initialData?.subject_instagram ?? "",
      subject_tagline: initialData?.subject_tagline ?? "",
      photo_urls: initialData?.photo_urls ?? [],
      narrative: initialData?.narrative ?? "",
      theme_tags: initialData?.theme_tags ?? [],
      archetype_tags: initialData?.archetype_tags ?? [],
      related_organizer_name: initialData?.related_organizer_name ?? "",
      status: initialData?.status ?? "draft",
      meta_title: initialData?.meta_title ?? "",
      meta_description: initialData?.meta_description ?? "",
    },
  });

  const title = form.watch("title");

  useEffect(() => {
    if (!isEditMode && !slugManuallyEdited && title) {
      form.setValue("slug", slugify(title));
    }
  }, [title, isEditMode, slugManuallyEdited, form]);

  async function onSubmit(data: StoryFormValues) {
    setSaving(true);
    const supabase = createClient();

    const payload: Record<string, unknown> = {
      title: data.title,
      slug: data.slug,
      subject_name: data.subject_name,
      subject_instagram: data.subject_instagram || null,
      subject_tagline: data.subject_tagline || null,
      photo_urls: data.photo_urls,
      narrative: data.narrative,
      theme_tags: data.theme_tags,
      archetype_tags: data.archetype_tags,
      related_organizer_name: data.related_organizer_name || null,
      status: data.status,
      meta_title: data.meta_title || null,
      meta_description: data.meta_description || null,
    };

    if (data.status === "published" && !initialData?.published_at) {
      payload.published_at = new Date().toISOString();
    }

    let error;

    if (isEditMode) {
      ({ error } = await supabase
        .from("stories")
        .update(payload)
        .eq("id", initialData.id));
    } else {
      ({ error } = await supabase.from("stories").insert(payload));
    }

    setSaving(false);

    if (error) {
      if (error.code === "23505" || error.message?.includes("unique") || error.message?.includes("duplicate")) {
        form.setError("slug", { message: "This slug is already in use." });
      } else {
        form.setError("root", { message: error.message });
      }
      return;
    }

    router.push("/admin/stories");
    router.refresh();
  }

  async function handleSaveDraft() {
    form.setValue("status", "draft");
    form.handleSubmit(onSubmit)();
  }

  async function handlePublish() {
    form.setValue("status", "published");
    form.handleSubmit(onSubmit)();
  }

  async function handleDelete() {
    setDeleting(true);
    const supabase = createClient();

    const { error } = await supabase
      .from("stories")
      .delete()
      .eq("id", initialData!.id);

    setDeleting(false);

    if (error) {
      form.setError("root", { message: error.message });
      return;
    }

    setDeleteOpen(false);
    router.push("/admin/stories");
    router.refresh();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {form.formState.errors.root && (
          <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
            {form.formState.errors.root.message}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          {/* Main column */}
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Story title" {...field} />
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
                      placeholder="story-slug"
                      {...field}
                      onChange={(e) => {
                        setSlugManuallyEdited(true);
                        field.onChange(e);
                      }}
                    />
                  </FormControl>
                  <FormDescription>URL path: /stories/{form.watch("slug") || "..."}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-6 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="subject_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subject_instagram"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instagram Handle</FormLabel>
                    <FormControl>
                      <Input placeholder="@username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="subject_tagline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tagline</FormLabel>
                  <FormControl>
                    <Input placeholder="A short description of the subject (max 100 chars)" {...field} />
                  </FormControl>
                  <FormDescription>{(field.value?.length ?? 0)}/100</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="narrative"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Narrative</FormLabel>
                  <FormControl>
                    <RichTextEditor
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Tell their story..."
                      height={500}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="photo_urls"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Photos</FormLabel>
                  <FormControl>
                    <MultiImageUploader
                      folder="stories"
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormDescription>First photo is the lead image</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="theme_tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Theme Tags</FormLabel>
                  <FormControl>
                    <TagInput
                      options={STORY_THEME_TAGS}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="archetype_tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Archetype Tags</FormLabel>
                  <FormControl>
                    <TagInput options={ARCHETYPE_IDS} value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormDescription>Tag for personalized recommendations</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="related_organizer_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Related Organizer Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Bali Sound Healing" {...field} />
                  </FormControl>
                  <FormDescription>
                    Enter the organizer name as it appears in their event submissions. This links the story to their upcoming events.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4 rounded-md border p-4">
              <h3 className="text-sm font-medium">SEO</h3>
              <FormField
                control={form.control}
                name="meta_title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meta Title</FormLabel>
                    <FormControl>
                      <Input placeholder="SEO title (optional)" {...field} />
                    </FormControl>
                    <FormDescription>{(field.value?.length ?? 0)}/70</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="meta_description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meta Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="SEO description (optional)"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>{(field.value?.length ?? 0)}/160</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 border-t pt-6">
          <Button type="button" variant="outline" onClick={handleSaveDraft} disabled={saving}>
            {saving && form.getValues("status") === "draft" && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Save Draft
          </Button>
          <Button type="button" onClick={handlePublish} disabled={saving}>
            {saving && form.getValues("status") === "published" && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Publish
          </Button>

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
                  <DialogTitle>Delete Story</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete &ldquo;{initialData.title}&rdquo;? This action
                    cannot be undone.
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
