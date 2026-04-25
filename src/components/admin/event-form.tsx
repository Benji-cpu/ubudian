"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/utils";
import { EVENT_CATEGORIES } from "@/lib/constants";
import { safeUrlOrEmpty } from "@/lib/url-validation";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { ImageUploader } from "@/components/admin/image-uploader";
import { RefetchImageButton } from "@/components/admin/refetch-image-button";
import { TagInput } from "@/components/admin/tag-input";
import { ARCHETYPE_IDS } from "@/lib/quiz-data";
import { DatePicker } from "@/components/admin/date-picker";
import { TimePicker } from "@/components/admin/time-picker";
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
import type { Event } from "@/types";

const eventSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase with hyphens only"),
  description: z.string().min(1, "Description is required"),
  short_description: z.string().max(200).optional().or(z.literal("")),
  cover_image_url: z.string().optional().or(z.literal("")),
  category: z.string().min(1, "Category is required"),
  status: z.enum(["pending", "approved", "rejected", "archived"]),
  start_date: z.date({ error: "Start date is required" }),
  end_date: z.date().optional().nullable(),
  start_time: z.string().optional().or(z.literal("")),
  end_time: z.string().optional().or(z.literal("")),
  is_recurring: z.boolean(),
  recurrence_rule: z.string().optional().or(z.literal("")),
  is_core: z.boolean(),
  venue_name: z.string().optional().or(z.literal("")),
  venue_address: z.string().optional().or(z.literal("")),
  venue_map_url: z.string().optional().or(z.literal("")).refine(safeUrlOrEmpty, "URL must use http or https"),
  price_info: z.string().optional().or(z.literal("")),
  external_ticket_url: z.string().optional().or(z.literal("")).refine(safeUrlOrEmpty, "URL must use http or https"),
  organizer_name: z.string().optional().or(z.literal("")),
  organizer_contact: z.string().optional().or(z.literal("")),
  organizer_instagram: z.string().optional().or(z.literal("")),
  archetype_tags: z.array(z.enum(["seeker", "explorer", "creative", "connector", "epicurean"])),
});

type EventFormValues = z.infer<typeof eventSchema>;

interface EventFormProps {
  initialData?: Event;
}

export function EventForm({ initialData }: EventFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(!!initialData);

  const isEditMode = !!initialData;

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: initialData?.title ?? "",
      slug: initialData?.slug ?? "",
      description: initialData?.description ?? "",
      short_description: initialData?.short_description ?? "",
      cover_image_url: initialData?.cover_image_url ?? "",
      category: initialData?.category ?? "",
      status: initialData?.status ?? "pending",
      start_date: initialData?.start_date ? new Date(initialData.start_date) : undefined,
      end_date: initialData?.end_date ? new Date(initialData.end_date) : null,
      start_time: initialData?.start_time ?? "",
      end_time: initialData?.end_time ?? "",
      is_recurring: initialData?.is_recurring ?? false,
      recurrence_rule: initialData?.recurrence_rule ?? "",
      is_core: initialData?.is_core ?? false,
      venue_name: initialData?.venue_name ?? "",
      venue_address: initialData?.venue_address ?? "",
      venue_map_url: initialData?.venue_map_url ?? "",
      price_info: initialData?.price_info ?? "",
      external_ticket_url: initialData?.external_ticket_url ?? "",
      organizer_name: initialData?.organizer_name ?? "",
      organizer_contact: initialData?.organizer_contact ?? "",
      organizer_instagram: initialData?.organizer_instagram ?? "",
      archetype_tags: initialData?.archetype_tags ?? [],
    },
  });

  const title = form.watch("title");
  const isRecurring = form.watch("is_recurring");

  useEffect(() => {
    if (!isEditMode && !slugManuallyEdited && title) {
      form.setValue("slug", slugify(title));
    }
  }, [title, isEditMode, slugManuallyEdited, form]);

  async function onSubmit(data: EventFormValues) {
    setSaving(true);
    const supabase = createClient();

    const payload: Record<string, unknown> = {
      title: data.title,
      slug: data.slug,
      description: data.description,
      short_description: data.short_description || null,
      cover_image_url: data.cover_image_url || null,
      category: data.category,
      status: data.status,
      start_date: data.start_date.toISOString().split("T")[0],
      end_date: data.end_date ? data.end_date.toISOString().split("T")[0] : null,
      start_time: data.start_time || null,
      end_time: data.end_time || null,
      is_recurring: data.is_recurring,
      recurrence_rule: data.is_recurring && data.recurrence_rule ? data.recurrence_rule : null,
      is_core: data.is_core,
      venue_name: data.venue_name || null,
      venue_address: data.venue_address || null,
      venue_map_url: data.venue_map_url || null,
      price_info: data.price_info || null,
      external_ticket_url: data.external_ticket_url || null,
      organizer_name: data.organizer_name || null,
      organizer_contact: data.organizer_contact || null,
      organizer_instagram: data.organizer_instagram || null,
      archetype_tags: data.archetype_tags,
    };

    let error;

    if (isEditMode) {
      ({ error } = await supabase.from("events").update(payload).eq("id", initialData.id));
    } else {
      ({ error } = await supabase.from("events").insert(payload));
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

    router.push("/admin/events");
    router.refresh();
  }

  async function handleSave() {
    form.handleSubmit(onSubmit)();
  }

  async function handleApprove() {
    form.setValue("status", "approved");
    form.handleSubmit(async (data) => {
      await onSubmit(data);
      // After successful save, increment trusted submitter count
      if (initialData?.submitted_by_email) {
        try {
          await fetch("/api/events/approve", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ event_id: initialData.id }),
          });
        } catch {
          // Non-critical — don't block approval
        }
      }
    })();
  }

  async function handleReject() {
    const reason = window.prompt("Rejection reason (optional):");
    if (reason === null) return; // User cancelled

    setRejecting(true);
    const supabase = createClient();

    const payload: Record<string, unknown> = {
      status: "rejected",
      rejection_reason: reason || null,
    };

    const { error } = await supabase
      .from("events")
      .update(payload)
      .eq("id", initialData!.id);

    if (error) {
      setRejecting(false);
      form.setError("root", { message: error.message });
      return;
    }

    // Send rejection notification email
    if (initialData?.submitted_by_email) {
      try {
        await fetch("/api/events/approve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event_id: initialData.id,
            action: "reject",
            rejection_reason: reason || undefined,
          }),
        });
      } catch {
        // Non-critical
      }
    }

    setRejecting(false);
    router.push("/admin/events");
    router.refresh();
  }

  async function handleDelete() {
    setDeleting(true);
    const supabase = createClient();

    const { error } = await supabase.from("events").delete().eq("id", initialData!.id);

    setDeleting(false);

    if (error) {
      form.setError("root", { message: error.message });
      return;
    }

    setDeleteOpen(false);
    router.push("/admin/events");
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
                    <Input placeholder="Event title" {...field} />
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
                      placeholder="event-slug"
                      {...field}
                      onChange={(e) => {
                        setSlugManuallyEdited(true);
                        field.onChange(e);
                      }}
                    />
                  </FormControl>
                  <FormDescription>URL path: /events/{form.watch("slug") || "..."}</FormDescription>
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
                    <Textarea placeholder="Brief event summary (max 200 chars)" rows={2} {...field} />
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
                    <RichTextEditor
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Describe the event in detail..."
                      height={400}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Venue */}
            <div className="space-y-4 rounded-md border p-4">
              <h3 className="text-sm font-medium">Venue</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="venue_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Venue Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Yoga Barn" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="venue_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Street address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="venue_map_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Google Maps URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://maps.google.com/..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Organizer */}
            <div className="space-y-4 rounded-md border p-4">
              <h3 className="text-sm font-medium">Organizer</h3>
              <div className="grid gap-4 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="organizer_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Organizer name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="organizer_contact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact</FormLabel>
                      <FormControl>
                        <Input placeholder="Email or phone" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="organizer_instagram"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instagram</FormLabel>
                      <FormControl>
                        <Input placeholder="@handle" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="cover_image_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cover Image</FormLabel>
                  <FormControl>
                    <ImageUploader folder="events" value={field.value} onChange={field.onChange} />
                  </FormControl>
                  {isEditMode &&
                    (initialData?.source_url || initialData?.external_ticket_url) && (
                      <div className="pt-1">
                        <RefetchImageButton
                          eventId={initialData!.id}
                          onUpdated={(url) => field.onChange(url)}
                          disabled={saving}
                        />
                      </div>
                    )}
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
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {EVENT_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
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
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
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

            {/* Dates */}
            <div className="space-y-4 rounded-md border p-4">
              <h3 className="text-sm font-medium">Date & Time</h3>
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <DatePicker value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <DatePicker
                        value={field.value ?? undefined}
                        onChange={field.onChange}
                        placeholder="Same as start (optional)"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="start_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <FormControl>
                        <TimePicker value={field.value} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="end_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time</FormLabel>
                      <FormControl>
                        <TimePicker value={field.value} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="is_recurring"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="font-normal">Recurring event</FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_core"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Core community anchor
                      <span className="ml-2 text-xs text-muted-foreground">
                        (weekly rhythm — shows a Core badge)
                      </span>
                    </FormLabel>
                  </FormItem>
                )}
              />

              {isRecurring && (
                <FormField
                  control={form.control}
                  name="recurrence_rule"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recurrence Rule</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ""}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='{"frequency":"daily"}'>Daily</SelectItem>
                          <SelectItem value='{"frequency":"weekly"}'>Weekly</SelectItem>
                          <SelectItem value='{"frequency":"biweekly"}'>Every 2 weeks</SelectItem>
                          <SelectItem value='{"frequency":"monthly"}'>Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Price & Tickets */}
            <div className="space-y-4 rounded-md border p-4">
              <h3 className="text-sm font-medium">Price & Tickets</h3>
              <FormField
                control={form.control}
                name="price_info"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price Info</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Free, 150k IDR, $25" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="external_ticket_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ticket URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
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
          <Button type="button" variant="outline" onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
          <Button type="button" onClick={handleApprove} disabled={saving || rejecting}>
            {saving && form.getValues("status") === "approved" && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Approve
          </Button>
          {isEditMode && initialData.status === "pending" && (
            <Button type="button" variant="destructive" onClick={handleReject} disabled={saving || rejecting}>
              {rejecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reject
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
                  <DialogTitle>Delete Event</DialogTitle>
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

        {initialData && (
          <details className="rounded-md border border-border/60 bg-muted/30 px-4 py-3 text-sm">
            <summary className="cursor-pointer font-medium text-muted-foreground">
              Diagnostics
            </summary>
            <dl className="mt-3 grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-xs">
              <dt className="text-muted-foreground">Source kind</dt>
              <dd>{initialData.source_kind ?? "—"}</dd>
              <dt className="text-muted-foreground">Parser version</dt>
              <dd>{initialData.parser_version ?? "—"}</dd>
              <dt className="text-muted-foreground">Source URL</dt>
              <dd className="break-all">
                {initialData.source_url ? (
                  <a href={initialData.source_url} target="_blank" rel="noreferrer" className="underline">
                    {initialData.source_url}
                  </a>
                ) : "—"}
              </dd>
              <dt className="text-muted-foreground">Ingested at</dt>
              <dd>{initialData.ingested_at ?? "—"}</dd>
              <dt className="text-muted-foreground">Raw message id</dt>
              <dd className="break-all">{initialData.raw_message_id ?? "—"}</dd>
              <dt className="text-muted-foreground">Raw text snippet</dt>
              <dd className="whitespace-pre-wrap">{initialData.raw_text_snippet ?? "—"}</dd>
            </dl>
          </details>
        )}
      </form>
    </Form>
  );
}
