"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/utils";
import { ARCHETYPE_IDS } from "@/lib/quiz-data";
import { GUIDE_INTENTS } from "@/lib/guides/intents";
import { ImageUploader } from "@/components/admin/image-uploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
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
import type { Guide } from "@/types";

const guideSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase with hyphens only"),
  tier: z.enum(["practical", "intent"]),
  subtitle: z.string().max(280).optional().or(z.literal("")),
  hero_quote: z.string().max(500).optional().or(z.literal("")),
  intro_md: z.string().max(800).optional().or(z.literal("")),
  body_md: z.string().min(1, "Body is required"),
  intent_tags: z.array(
    z.enum(["romance", "community", "spirit", "living", "local_culture"]),
  ),
  archetype_tags: z.array(
    z.enum(["seeker", "explorer", "creative", "connector", "epicurean"]),
  ),
  status: z.enum(["draft", "published", "archived"]),
  is_members_only: z.boolean(),
  is_editors_pick: z.boolean(),
  editors_pick_position: z.number().int().nullable(),
  reading_time_min: z.number().int().nullable(),
  hero_image_url: z.string().optional().or(z.literal("")),
  card_image_url: z.string().optional().or(z.literal("")),
  linked_retreat_id: z.string().nullable(),
  related_guide_slugs: z.array(z.string()),
  field_tested_by: z.string().optional().or(z.literal("")),
  last_updated_at: z.string().optional().or(z.literal("")),
  sort_order: z.number().int(),
});

type GuideFormValues = z.infer<typeof guideSchema>;

interface GuideFormProps {
  initialData?: Guide;
}

interface RetreatOption {
  id: string;
  title: string;
  slug: string;
}

export function GuideForm({ initialData }: GuideFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(!!initialData);
  const [retreats, setRetreats] = useState<RetreatOption[]>([]);

  const isEditMode = !!initialData;

  const form = useForm<GuideFormValues>({
    resolver: zodResolver(guideSchema),
    defaultValues: {
      title: initialData?.title ?? "",
      slug: initialData?.slug ?? "",
      tier: initialData?.tier ?? "intent",
      subtitle: initialData?.subtitle ?? "",
      hero_quote: initialData?.hero_quote ?? "",
      intro_md: initialData?.intro_md ?? "",
      body_md: initialData?.body_md ?? "",
      intent_tags: initialData?.intent_tags ?? [],
      archetype_tags: initialData?.archetype_tags ?? [],
      status: initialData?.status ?? "draft",
      is_members_only: initialData?.is_members_only ?? false,
      is_editors_pick: initialData?.is_editors_pick ?? false,
      editors_pick_position: initialData?.editors_pick_position ?? null,
      reading_time_min: initialData?.reading_time_min ?? null,
      hero_image_url: initialData?.hero_image_url ?? "",
      card_image_url: initialData?.card_image_url ?? "",
      linked_retreat_id: initialData?.linked_retreat_id ?? null,
      related_guide_slugs: initialData?.related_guide_slugs ?? [],
      field_tested_by: initialData?.field_tested_by ?? "",
      last_updated_at: initialData?.last_updated_at?.slice(0, 10) ?? "",
      sort_order: initialData?.sort_order ?? 0,
    },
  });

  const title = form.watch("title");
  const tier = form.watch("tier");

  useEffect(() => {
    if (!isEditMode && !slugManuallyEdited && title) {
      form.setValue("slug", slugify(title));
    }
  }, [title, isEditMode, slugManuallyEdited, form]);

  useEffect(() => {
    const supabase = createClient();
    void supabase
      .from("journeys")
      .select("id, title, slug")
      .eq("is_published", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        setRetreats((data ?? []) as RetreatOption[]);
      });
  }, []);

  async function onSubmit(data: GuideFormValues) {
    setSaving(true);
    const supabase = createClient();

    const payload: Record<string, unknown> = {
      title: data.title,
      slug: data.slug,
      tier: data.tier,
      subtitle: data.subtitle || null,
      hero_quote: data.hero_quote || null,
      intro_md: data.intro_md || null,
      body_md: data.body_md,
      intent_tags: data.intent_tags,
      archetype_tags: data.archetype_tags,
      status: data.status,
      is_members_only: data.is_members_only,
      is_editors_pick: data.is_editors_pick,
      editors_pick_position: data.is_editors_pick
        ? data.editors_pick_position
        : null,
      reading_time_min: data.reading_time_min,
      hero_image_url: data.hero_image_url || null,
      card_image_url: data.card_image_url || null,
      linked_retreat_id: data.linked_retreat_id || null,
      related_guide_slugs: data.related_guide_slugs,
      field_tested_by: data.field_tested_by || null,
      last_updated_at: data.last_updated_at
        ? new Date(data.last_updated_at).toISOString()
        : null,
      sort_order: data.sort_order,
      updated_at: new Date().toISOString(),
    };

    if (data.status === "published" && !initialData?.published_at) {
      payload.published_at = new Date().toISOString();
    }

    let error;
    let savedId: string | null = isEditMode ? initialData!.id : null;
    if (isEditMode) {
      ({ error } = await supabase
        .from("guides")
        .update(payload)
        .eq("id", initialData.id));
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from("guides")
        .insert(payload)
        .select("id")
        .single();
      error = insertError;
      savedId = (inserted?.id as string | undefined) ?? null;
    }

    // Sync the body's shortcode references into guide_entity_references.
    // This is best-effort: a sync failure does not invalidate the save.
    if (!error && savedId) {
      const { syncGuideReferences } = await import("@/lib/guides/sync-references");
      await syncGuideReferences(supabase, savedId, data.body_md);
    }

    setSaving(false);

    if (error) {
      if (
        error.code === "23505" ||
        error.message?.includes("unique") ||
        error.message?.includes("duplicate")
      ) {
        form.setError("slug", { message: "This slug is already in use." });
      } else {
        form.setError("root", { message: error.message });
      }
      return;
    }

    router.push("/admin/guides");
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
      .from("guides")
      .delete()
      .eq("id", initialData!.id);
    setDeleting(false);
    if (error) {
      form.setError("root", { message: error.message });
      return;
    }
    setDeleteOpen(false);
    router.push("/admin/guides");
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
                    <Input placeholder="Falling in Love in Ubud" {...field} />
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
                      placeholder="falling-in-love-in-ubud"
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
              name="subtitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subtitle</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="The Eat-Pray-Love fantasy, honestly. What it actually takes."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {tier === "intent" && (
              <FormField
                control={form.control}
                name="hero_quote"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hero quote (intent guides)</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={2}
                        placeholder="Italic epigraph shown over the hero image."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="intro_md"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Intro</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Standalone opening paragraph (rendered above the body)."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="body_md"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Body (markdown)</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={24}
                      className="font-mono text-sm"
                      placeholder="Full markdown body. Use shortcodes inline: {{event:slug}}, {{retreat:slug}}, {{practitioner:slug|card}}…"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Shortcodes:{" "}
                    <code className="font-mono text-xs">{`{{event:slug}}`}</code>
                    , <code className="font-mono text-xs">{`{{retreat:slug}}`}</code>
                    , <code className="font-mono text-xs">{`{{story:slug}}`}</code>
                    . Add <code className="font-mono text-xs">|card</code> for an embedded card.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="tier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tier</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="practical">Practical (Survival Guide)</SelectItem>
                      <SelectItem value="intent">Intent (Why You Came)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="card_image_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Card image</FormLabel>
                  <FormControl>
                    <ImageUploader
                      bucket="images"
                      folder="guides"
                      value={field.value || undefined}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormDescription>
                    Used on listing cards and quiz recommendations.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hero_image_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hero image</FormLabel>
                  <FormControl>
                    <ImageUploader
                      bucket="images"
                      folder="guides"
                      value={field.value || undefined}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormDescription>
                    Full-bleed for intent guides; optional for practical.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="intent_tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Intent tags</FormLabel>
                  <div className="grid grid-cols-1 gap-2">
                    {GUIDE_INTENTS.map((intent) => (
                      <label
                        key={intent.id}
                        className="flex items-center gap-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={field.value.includes(intent.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              field.onChange([...field.value, intent.id]);
                            } else {
                              field.onChange(
                                field.value.filter((v) => v !== intent.id),
                              );
                            }
                          }}
                          className="h-4 w-4"
                        />
                        {intent.label}
                      </label>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="archetype_tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Archetype tags</FormLabel>
                  <div className="grid grid-cols-1 gap-2">
                    {ARCHETYPE_IDS.map((arch) => (
                      <label
                        key={arch}
                        className="flex items-center gap-2 text-sm capitalize"
                      >
                        <input
                          type="checkbox"
                          checked={field.value.includes(arch)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              field.onChange([...field.value, arch]);
                            } else {
                              field.onChange(
                                field.value.filter((v) => v !== arch),
                              );
                            }
                          }}
                          className="h-4 w-4"
                        />
                        {arch}
                      </label>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reading_time_min"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reading time (min)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === "" ? null : Number(e.target.value),
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="last_updated_at"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last updated</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormDescription>
                    Practical guides display this prominently.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {tier === "practical" && (
              <FormField
                control={form.control}
                name="field_tested_by"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Field-tested by</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Editor name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {tier === "intent" && (
              <FormField
                control={form.control}
                name="linked_retreat_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Linked retreat</FormLabel>
                    <Select
                      onValueChange={(v) => field.onChange(v === "__none" ? null : v)}
                      value={field.value ?? "__none"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="None" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__none">None</SelectItem>
                        {retreats.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="related_guide_slugs"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Related guide slugs</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="slug-one, slug-two"
                      value={field.value.join(", ")}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean),
                        )
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    Comma-separated slugs. Hand-curated &ldquo;continue reading&rdquo;.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_editors_pick"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <FormLabel>Editor&apos;s pick</FormLabel>
                    <FormDescription className="mt-0.5">
                      Surfaces in the &ldquo;Start here&rdquo; rail.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {form.watch("is_editors_pick") && (
              <FormField
                control={form.control}
                name="editors_pick_position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Editor&apos;s pick position</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === "" ? null : Number(e.target.value),
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="is_members_only"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <FormLabel>Members only</FormLabel>
                    <FormDescription className="mt-0.5">
                      Currently informational — gating UI ships later.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sort_order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sort order</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      value={field.value}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-6">
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleSaveDraft}
              disabled={saving}
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save draft
            </Button>
            <Button type="button" onClick={handlePublish} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Publish
            </Button>
          </div>
          {isEditMode && (
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" type="button">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete this guide?</DialogTitle>
                  <DialogDescription>
                    This permanently removes the guide. This cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setDeleteOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
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
