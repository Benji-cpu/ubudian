"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/utils";
import { TOUR_THEMES } from "@/lib/constants";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { MultiImageUploader } from "@/components/admin/multi-image-uploader";
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
import type { Tour } from "@/types";

const tourSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase with hyphens only"),
  short_description: z.string().max(200).optional().or(z.literal("")),
  description: z.string().min(1, "Description is required"),
  photo_urls: z.array(z.string()),
  itinerary: z.string().optional().or(z.literal("")),
  duration: z.string().optional().or(z.literal("")),
  price_per_person: z.string().optional().or(z.literal("")),
  max_group_size: z.string().optional().or(z.literal("")),
  theme: z.string().optional().or(z.literal("")),
  whats_included: z.string().optional().or(z.literal("")),
  what_to_bring: z.string().optional().or(z.literal("")),
  guide_name: z.string().optional().or(z.literal("")),
  booking_whatsapp: z.string().optional().or(z.literal("")),
  booking_email: z.string().optional().or(z.literal("")),
  is_active: z.boolean(),
});

type TourFormValues = z.infer<typeof tourSchema>;

interface TourFormProps {
  initialData?: Tour;
}

export function TourForm({ initialData }: TourFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(!!initialData);

  const isEditMode = !!initialData;

  const form = useForm<TourFormValues>({
    resolver: zodResolver(tourSchema),
    defaultValues: {
      title: initialData?.title ?? "",
      slug: initialData?.slug ?? "",
      short_description: initialData?.short_description ?? "",
      description: initialData?.description ?? "",
      photo_urls: initialData?.photo_urls ?? [],
      itinerary: initialData?.itinerary ?? "",
      duration: initialData?.duration ?? "",
      price_per_person: initialData?.price_per_person?.toString() ?? "",
      max_group_size: initialData?.max_group_size?.toString() ?? "",
      theme: initialData?.theme ?? "",
      whats_included: initialData?.whats_included ?? "",
      what_to_bring: initialData?.what_to_bring ?? "",
      guide_name: initialData?.guide_name ?? "",
      booking_whatsapp: initialData?.booking_whatsapp ?? "",
      booking_email: initialData?.booking_email ?? "",
      is_active: initialData?.is_active ?? true,
    },
  });

  const title = form.watch("title");

  useEffect(() => {
    if (!isEditMode && !slugManuallyEdited && title) {
      form.setValue("slug", slugify(title));
    }
  }, [title, isEditMode, slugManuallyEdited, form]);

  async function onSubmit(data: TourFormValues) {
    setSaving(true);
    const supabase = createClient();

    const payload: Record<string, unknown> = {
      title: data.title,
      slug: data.slug,
      short_description: data.short_description || null,
      description: data.description,
      photo_urls: data.photo_urls,
      itinerary: data.itinerary || null,
      duration: data.duration || null,
      price_per_person: data.price_per_person ? Number(data.price_per_person) : null,
      max_group_size: data.max_group_size ? Number(data.max_group_size) : null,
      theme: data.theme || null,
      whats_included: data.whats_included || null,
      what_to_bring: data.what_to_bring || null,
      guide_name: data.guide_name || null,
      booking_whatsapp: data.booking_whatsapp || null,
      booking_email: data.booking_email || null,
      is_active: data.is_active,
    };

    let error;

    if (isEditMode) {
      ({ error } = await supabase.from("tours").update(payload).eq("id", initialData.id));
    } else {
      ({ error } = await supabase.from("tours").insert(payload));
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

    router.push("/admin/tours");
    router.refresh();
  }

  async function handleDelete() {
    setDeleting(true);
    const supabase = createClient();

    const { error } = await supabase.from("tours").delete().eq("id", initialData!.id);

    setDeleting(false);

    if (error) {
      form.setError("root", { message: error.message });
      return;
    }

    setDeleteOpen(false);
    router.push("/admin/tours");
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
                    <Input placeholder="Tour title" {...field} />
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
                      placeholder="tour-slug"
                      {...field}
                      onChange={(e) => {
                        setSlugManuallyEdited(true);
                        field.onChange(e);
                      }}
                    />
                  </FormControl>
                  <FormDescription>URL path: /tours/{form.watch("slug") || "..."}</FormDescription>
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
                    <Textarea placeholder="One-liner for the tour card" rows={2} {...field} />
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
                  <FormLabel>Full Description</FormLabel>
                  <FormControl>
                    <RichTextEditor value={field.value} onChange={field.onChange} placeholder="Describe the tour experience..." height={400} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="itinerary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Itinerary</FormLabel>
                  <FormControl>
                    <RichTextEditor value={field.value || ""} onChange={field.onChange} placeholder="Step-by-step itinerary..." height={300} />
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
                  <FormLabel>What&apos;s Included</FormLabel>
                  <FormControl>
                    <RichTextEditor value={field.value || ""} onChange={field.onChange} placeholder="Transport, lunch, guide..." height={200} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="what_to_bring"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What to Bring</FormLabel>
                  <FormControl>
                    <RichTextEditor value={field.value || ""} onChange={field.onChange} placeholder="Sunscreen, walking shoes..." height={200} />
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
              name="photo_urls"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Photos</FormLabel>
                  <FormControl>
                    <MultiImageUploader folder="tours" value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="theme"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Theme</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select theme" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TOUR_THEMES.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 6 hours" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="price_per_person"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price (IDR)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="500000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="max_group_size"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max Group Size</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g. 8" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="guide_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Guide Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your guide's name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4 rounded-md border p-4">
              <h3 className="text-sm font-medium">Booking Contact</h3>
              <FormField
                control={form.control}
                name="booking_whatsapp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WhatsApp Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+628..." {...field} />
                    </FormControl>
                    <FormDescription>Include country code</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="booking_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Booking Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="bookings@..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 border-t pt-6">
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Tour
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
                  <DialogTitle>Delete Tour</DialogTitle>
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
