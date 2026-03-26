"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/utils";
import { EVENT_CATEGORIES } from "@/lib/constants";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { TagInput } from "@/components/admin/tag-input";
import { ARCHETYPE_IDS } from "@/lib/quiz-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import type { Experience } from "@/types";

const experienceSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase with hyphens only"),
  short_description: z.string().max(200).optional().or(z.literal("")),
  description: z.string().min(1, "Description is required"),
  who_its_for: z.string().optional().or(z.literal("")),
  practical_info: z.string().optional().or(z.literal("")),
  cover_image_url: z.string().optional().or(z.literal("")),
  category: z.string().min(1, "Category is required"),
  archetype_tags: z.array(z.enum(["seeker", "explorer", "creative", "connector", "epicurean"])),
  is_active: z.boolean(),
  sort_order: z.string().optional().or(z.literal("")),
});

type ExperienceFormValues = z.infer<typeof experienceSchema>;

interface ExperienceFormProps {
  initialData?: Experience;
}

export function ExperienceForm({ initialData }: ExperienceFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(!!initialData);

  const isEditMode = !!initialData;

  const form = useForm<ExperienceFormValues>({
    resolver: zodResolver(experienceSchema),
    defaultValues: {
      title: initialData?.title ?? "",
      slug: initialData?.slug ?? "",
      short_description: initialData?.short_description ?? "",
      description: initialData?.description ?? "",
      who_its_for: initialData?.who_its_for ?? "",
      practical_info: initialData?.practical_info ?? "",
      cover_image_url: initialData?.cover_image_url ?? "",
      category: initialData?.category ?? "",
      archetype_tags: initialData?.archetype_tags ?? [],
      is_active: initialData?.is_active ?? true,
      sort_order: initialData?.sort_order?.toString() ?? "0",
    },
  });

  const title = form.watch("title");

  useEffect(() => {
    if (!isEditMode && !slugManuallyEdited && title) {
      form.setValue("slug", slugify(title));
    }
  }, [title, isEditMode, slugManuallyEdited, form]);

  async function onSubmit(data: ExperienceFormValues) {
    setSaving(true);
    const supabase = createClient();

    const payload: Record<string, unknown> = {
      title: data.title,
      slug: data.slug,
      short_description: data.short_description || null,
      description: data.description,
      who_its_for: data.who_its_for || null,
      practical_info: data.practical_info || null,
      cover_image_url: data.cover_image_url || null,
      category: data.category,
      archetype_tags: data.archetype_tags,
      is_active: data.is_active,
      sort_order: data.sort_order ? Number(data.sort_order) : 0,
    };

    let error;

    if (isEditMode) {
      ({ error } = await supabase.from("experiences").update(payload).eq("id", initialData.id));
    } else {
      ({ error } = await supabase.from("experiences").insert(payload));
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

    router.push("/admin/experiences");
    router.refresh();
  }

  async function handleDelete() {
    setDeleting(true);
    const supabase = createClient();

    const { error } = await supabase.from("experiences").delete().eq("id", initialData!.id);

    setDeleting(false);

    if (error) {
      form.setError("root", { message: error.message });
      return;
    }

    setDeleteOpen(false);
    router.push("/admin/experiences");
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
                    <Input placeholder="Experience title" {...field} />
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
                      placeholder="experience-slug"
                      {...field}
                      onChange={(e) => {
                        setSlugManuallyEdited(true);
                        field.onChange(e);
                      }}
                    />
                  </FormControl>
                  <FormDescription>URL path: /experiences/{form.watch("slug") || "..."}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="short_description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Short Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="One-liner for the experience card" rows={2} {...field} />
                  </FormControl>
                  <FormDescription>{(field.value?.length ?? 0)}/200</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>The Experience</FormLabel>
                  <FormControl>
                    <RichTextEditor value={field.value} onChange={field.onChange} placeholder="Describe the experience — what it feels like, what happens, why it matters..." height={400} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="who_its_for"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Who It&apos;s For</FormLabel>
                  <FormControl>
                    <RichTextEditor value={field.value || ""} onChange={field.onChange} placeholder="Connect this experience to archetypes — who will love it and why..." height={250} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="practical_info"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Practical Info</FormLabel>
                  <FormControl>
                    <RichTextEditor value={field.value || ""} onChange={field.onChange} placeholder="Timing, cost, what to bring, etiquette tips..." height={250} />
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
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0 rounded-md border p-3">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="font-normal">Active (visible on site)</FormLabel>
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
              name="cover_image_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cover Image URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {EVENT_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>Links to event categories for upcoming events</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sort_order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sort Order</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" {...field} />
                  </FormControl>
                  <FormDescription>Lower numbers appear first</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 border-t pt-6">
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Experience
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
                  <DialogTitle>Delete Experience</DialogTitle>
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
