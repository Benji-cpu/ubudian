"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/utils";
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
import type { Journey, JourneyTier } from "@/types";

const TIER_OPTIONS: { value: JourneyTier; label: string; description: string }[] = [
  { value: "living_guide", label: "Living Guide", description: "Public, free, SEO" },
  { value: "self_paced", label: "Self-Paced (Insider)", description: "Members only" },
  { value: "signature_cohort", label: "Signature Cohort", description: "Premium / paid bundle" },
];

const journeySchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase with hyphens only"),
  subtitle: z.string().max(300).optional().or(z.literal("")),
  tier: z.enum(["living_guide", "self_paced", "signature_cohort"]),
  length_days: z
    .string()
    .min(1, "Length is required")
    .refine((v) => Number(v) >= 1 && Number(v) <= 30, "Must be 1-30 days"),
  cover_image_url: z.string().optional().or(z.literal("")),
  hero_quote: z.string().max(300).optional().or(z.literal("")),
  summary: z.string().optional().or(z.literal("")),
  whats_included: z.string().optional().or(z.literal("")),
  who_its_for: z.string().optional().or(z.literal("")),
  practical_info: z.string().optional().or(z.literal("")),
  archetype_tags: z.array(z.enum(["seeker", "explorer", "creative", "connector", "epicurean"])),
  is_published: z.boolean(),
  sort_order: z.string().optional().or(z.literal("")),
});

type JourneyFormValues = z.infer<typeof journeySchema>;

interface JourneyFormProps {
  initialData?: Journey;
}

export function JourneyForm({ initialData }: JourneyFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(!!initialData);
  const isEditMode = !!initialData;

  const form = useForm<JourneyFormValues>({
    resolver: zodResolver(journeySchema),
    defaultValues: {
      title: initialData?.title ?? "",
      slug: initialData?.slug ?? "",
      subtitle: initialData?.subtitle ?? "",
      tier: initialData?.tier ?? "living_guide",
      length_days: initialData?.length_days?.toString() ?? "7",
      cover_image_url: initialData?.cover_image_url ?? "",
      hero_quote: initialData?.hero_quote ?? "",
      summary: initialData?.summary ?? "",
      whats_included: initialData?.whats_included ?? "",
      who_its_for: initialData?.who_its_for ?? "",
      practical_info: initialData?.practical_info ?? "",
      archetype_tags: initialData?.archetype_tags ?? [],
      is_published: initialData?.is_published ?? false,
      sort_order: initialData?.sort_order?.toString() ?? "0",
    },
  });

  const title = form.watch("title");

  useEffect(() => {
    if (!isEditMode && !slugManuallyEdited && title) {
      form.setValue("slug", slugify(title));
    }
  }, [title, isEditMode, slugManuallyEdited, form]);

  async function onSubmit(data: JourneyFormValues) {
    setSaving(true);
    const supabase = createClient();

    const payload: Record<string, unknown> = {
      title: data.title,
      slug: data.slug,
      subtitle: data.subtitle || null,
      tier: data.tier,
      length_days: Number(data.length_days),
      cover_image_url: data.cover_image_url || null,
      hero_quote: data.hero_quote || null,
      summary: data.summary || null,
      whats_included: data.whats_included || null,
      who_its_for: data.who_its_for || null,
      practical_info: data.practical_info || null,
      archetype_tags: data.archetype_tags,
      is_published: data.is_published,
      sort_order: data.sort_order ? Number(data.sort_order) : 0,
    };

    let error;

    if (isEditMode) {
      ({ error } = await supabase.from("journeys").update(payload).eq("id", initialData.id));
    } else {
      ({ error } = await supabase.from("journeys").insert(payload));
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

    router.push("/admin/journeys");
    router.refresh();
  }

  async function handleDelete() {
    setDeleting(true);
    const supabase = createClient();
    const { error } = await supabase.from("journeys").delete().eq("id", initialData!.id);
    setDeleting(false);
    if (error) {
      form.setError("root", { message: error.message });
      return;
    }
    setDeleteOpen(false);
    router.push("/admin/journeys");
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
                    <Input placeholder="7 Days of Embodied Awakening" {...field} />
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
                      placeholder="7-days-embodied-awakening"
                      {...field}
                      onChange={(e) => {
                        setSlugManuallyEdited(true);
                        field.onChange(e);
                      }}
                    />
                  </FormControl>
                  <FormDescription>URL: /experiences/{form.watch("slug") || "..."}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subtitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subtitle</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="One line under the title — what this journey is, in one breath."
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hero_quote"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hero Quote</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='"What you can&rsquo;t name, you carry. What you name, you set down."'
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Italic blockquote shown above the summary.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="summary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Summary</FormLabel>
                  <FormControl>
                    <RichTextEditor
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder="The narrative arc of the journey — who it&rsquo;s for, what shifts, what stays."
                      height={300}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="whats_included"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What this journey holds</FormLabel>
                  <FormControl>
                    <RichTextEditor
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder="A bulleted list — accommodation hint, food, anchors per day, rest, integration."
                      height={250}
                    />
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
                  <FormLabel>Who this is for</FormLabel>
                  <FormControl>
                    <RichTextEditor
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder="The reader you have in mind — what they&rsquo;re carrying, what they&rsquo;re ready for."
                      height={220}
                    />
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
                  <FormLabel>Practical</FormLabel>
                  <FormControl>
                    <RichTextEditor
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder="Best season, rough budget range, accommodation notes, what to bring."
                      height={220}
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
              name="is_published"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0 rounded-md border p-3">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="font-normal">Published (visible on /experiences)</FormLabel>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tier</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TIER_OPTIONS.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          <div>
                            <div>{t.label}</div>
                            <div className="text-xs text-muted-foreground">{t.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="length_days"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Length (days)</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} max={30} {...field} />
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
                  <FormDescription>Drives quiz-based ranking on /experiences</FormDescription>
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
              name="sort_order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sort Order</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" {...field} />
                  </FormControl>
                  <FormDescription>Lower = first</FormDescription>
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
            Save Journey
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
                  <DialogTitle>Delete Journey</DialogTitle>
                  <DialogDescription>
                    Delete &ldquo;{initialData.title}&rdquo;? Days, slots, and atom links cascade.
                    This is irreversible.
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
