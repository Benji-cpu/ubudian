"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/utils";
import { TagInput } from "@/components/admin/tag-input";
import { ImageUploader } from "@/components/admin/image-uploader";
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
import type { Place, PlaceKind } from "@/types";

const PLACE_KINDS: { value: PlaceKind; label: string }[] = [
  { value: "temple", label: "Temple" },
  { value: "venue", label: "Venue" },
  { value: "cafe", label: "Café" },
  { value: "restaurant", label: "Restaurant" },
  { value: "studio", label: "Studio" },
  { value: "spa", label: "Spa" },
  { value: "retreat_centre", label: "Retreat centre" },
  { value: "natural", label: "Natural / outdoor" },
  { value: "market", label: "Market" },
  { value: "other", label: "Other" },
];

const placeSchema = z.object({
  name: z.string().min(1, "Name is required").max(160),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(160)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase with hyphens only"),
  kind: z.enum([
    "temple",
    "venue",
    "cafe",
    "restaurant",
    "studio",
    "spa",
    "retreat_centre",
    "natural",
    "market",
    "other",
  ]),
  short_description: z.string().max(200).optional().or(z.literal("")),
  description: z.string().max(4000).optional().or(z.literal("")),
  hero_image_url: z.string().optional().or(z.literal("")),
  address: z.string().max(240).optional().or(z.literal("")),
  neighbourhood: z.string().max(120).optional().or(z.literal("")),
  google_maps_url: z.string().url("Must be a full URL").optional().or(z.literal("")),
  website_url: z.string().url("Must be a full URL").optional().or(z.literal("")),
  instagram_handle: z.string().max(80).optional().or(z.literal("")),
  opening_hours: z.string().max(240).optional().or(z.literal("")),
  price_range: z.string().max(20).optional().or(z.literal("")),
  theme_tags: z.array(z.string()),
  is_published: z.boolean(),
  sort_order: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || Number.isFinite(Number(v)), "Must be a number"),
});

type PlaceFormValues = z.infer<typeof placeSchema>;

interface PlaceFormProps {
  initialData?: Place;
}

export function PlaceForm({ initialData }: PlaceFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(!!initialData);
  const isEditMode = !!initialData;

  const form = useForm<PlaceFormValues>({
    resolver: zodResolver(placeSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      slug: initialData?.slug ?? "",
      kind: initialData?.kind ?? "venue",
      short_description: initialData?.short_description ?? "",
      description: initialData?.description ?? "",
      hero_image_url: initialData?.hero_image_url ?? "",
      address: initialData?.address ?? "",
      neighbourhood: initialData?.neighbourhood ?? "",
      google_maps_url: initialData?.google_maps_url ?? "",
      website_url: initialData?.website_url ?? "",
      instagram_handle: initialData?.instagram_handle ?? "",
      opening_hours: initialData?.opening_hours ?? "",
      price_range: initialData?.price_range ?? "",
      theme_tags: initialData?.theme_tags ?? [],
      is_published: initialData?.is_published ?? false,
      sort_order: initialData?.sort_order?.toString() ?? "0",
    },
  });

  const name = form.watch("name");

  useEffect(() => {
    if (!isEditMode && !slugManuallyEdited && name) {
      form.setValue("slug", slugify(name));
    }
  }, [name, isEditMode, slugManuallyEdited, form]);

  async function onSubmit(data: PlaceFormValues) {
    setSaving(true);
    const supabase = createClient();

    const payload: Record<string, unknown> = {
      name: data.name,
      slug: data.slug,
      kind: data.kind,
      short_description: data.short_description || null,
      description: data.description || null,
      hero_image_url: data.hero_image_url || null,
      address: data.address || null,
      neighbourhood: data.neighbourhood || null,
      google_maps_url: data.google_maps_url || null,
      website_url: data.website_url || null,
      instagram_handle: data.instagram_handle?.replace(/^@/, "") || null,
      opening_hours: data.opening_hours || null,
      price_range: data.price_range || null,
      theme_tags: data.theme_tags,
      is_published: data.is_published,
      sort_order: data.sort_order ? Number(data.sort_order) : 0,
    };

    let error;
    if (isEditMode) {
      ({ error } = await supabase.from("places").update(payload).eq("id", initialData.id));
    } else {
      ({ error } = await supabase.from("places").insert(payload));
    }

    setSaving(false);

    if (error) {
      if (error.code === "23505" || error.message?.includes("unique")) {
        form.setError("slug", { message: "This slug is already in use." });
      } else {
        form.setError("root", { message: error.message });
      }
      return;
    }

    router.push("/admin/places");
    router.refresh();
  }

  async function handleDelete() {
    setDeleting(true);
    const supabase = createClient();
    const { error } = await supabase.from("places").delete().eq("id", initialData!.id);
    setDeleting(false);
    if (error) {
      form.setError("root", { message: error.message });
      return;
    }
    setDeleteOpen(false);
    router.push("/admin/places");
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
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Pura Saraswati" {...field} />
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
                      placeholder="pura-saraswati"
                      {...field}
                      onChange={(e) => {
                        setSlugManuallyEdited(true);
                        field.onChange(e);
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Public path: /places/{form.watch("slug") || "…"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="short_description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Short description</FormLabel>
                  <FormControl>
                    <Input placeholder="One sentence — the card subtitle and shortcode subtitle." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="A paragraph or two in the editorial register. Detail page renders this as prose."
                      rows={6}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Jl. Kajeng, Ubud" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="neighbourhood"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Neighbourhood</FormLabel>
                    <FormControl>
                      <Input placeholder="Central Ubud" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="price_range"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price range</FormLabel>
                    <FormControl>
                      <Input placeholder="$$ (free text)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="google_maps_url"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Google Maps URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://maps.app.goo.gl/…" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="website_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="instagram_handle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instagram handle</FormLabel>
                    <FormControl>
                      <Input placeholder="@paradisoubud" {...field} />
                    </FormControl>
                    <FormDescription>Without the @ — saved automatically.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="opening_hours"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Opening hours</FormLabel>
                    <FormControl>
                      <Input placeholder="8:00 — 21:00 daily" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="theme_tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Theme tags</FormLabel>
                  <FormControl>
                    <TagInput
                      options={[
                        "temple",
                        "water",
                        "ritual",
                        "movement",
                        "sound",
                        "community",
                        "grounding",
                        "view",
                        "contemplative",
                        "dance",
                        "local_culture",
                      ]}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormDescription>
                    Used by guide and journey atom resolvers to match places to themes.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-6">
            <FormField
              control={form.control}
              name="is_published"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0 rounded-md border p-3">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="font-normal">Published (visible to public)</FormLabel>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="kind"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kind</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PLACE_KINDS.map((k) => (
                        <SelectItem key={k.value} value={k.value}>
                          {k.label}
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
              name="sort_order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sort order</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} {...field} />
                  </FormControl>
                  <FormDescription>Lower = earlier in the listing.</FormDescription>
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
                      folder="places"
                      value={field.value || ""}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormDescription>Wide hero crop is best (16:9).</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 border-t pt-6">
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Place
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
                  <DialogTitle>Delete place</DialogTitle>
                  <DialogDescription>
                    Delete &ldquo;{initialData.name}&rdquo;? Guides referencing this place via
                    shortcode will fall back to styled inline text.
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
