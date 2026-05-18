"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/utils";
import { EVENT_CATEGORIES } from "@/lib/constants";
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
import type { Sponsor, SponsorTier, SponsorStatus } from "@/types";

const TIERS: { value: SponsorTier; label: string; hint: string }[] = [
  { value: "patron", label: "Patron", hint: "Directory listing + quarterly mention. ~$75/mo." },
  { value: "partner", label: "Partner", hint: "Monthly mention + event boosts. ~$300/mo." },
  { value: "anchor", label: "Anchor", hint: "Category sponsor + journey placements. ~$750/mo." },
];

const STATUSES: { value: SponsorStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "ended", label: "Ended" },
];

const NO_CATEGORY = "__none__";

const sponsorSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase with hyphens only"),
  tagline: z.string().max(200).optional().or(z.literal("")),
  description: z.string().max(2000).optional().or(z.literal("")),
  logo_url: z.string().optional().or(z.literal("")),
  hero_image_url: z.string().optional().or(z.literal("")),
  website_url: z.string().url("Must be a full URL").optional().or(z.literal("")),
  instagram_handle: z.string().max(50).optional().or(z.literal("")),
  contact_email: z.string().email("Invalid email").optional().or(z.literal("")),
  contact_whatsapp: z.string().max(50).optional().or(z.literal("")),
  tier: z.enum(["patron", "partner", "anchor"]),
  status: z.enum(["active", "paused", "ended"]),
  category_sponsor: z.string().optional().or(z.literal("")),
  monthly_amount_cents: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || Number.isInteger(Number(v)), "Must be a whole number of cents"),
  starts_on: z.string().optional().or(z.literal("")),
  ends_on: z.string().optional().or(z.literal("")),
});

type SponsorFormValues = z.infer<typeof sponsorSchema>;

interface SponsorFormPreset {
  name?: string;
  contact_email?: string;
  tier?: SponsorTier;
  from_lead_id?: string;
}

interface SponsorFormProps {
  initialData?: Sponsor;
  preset?: SponsorFormPreset;
}

export function SponsorForm({ initialData, preset }: SponsorFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(!!initialData);
  const isEditMode = !!initialData;

  const form = useForm<SponsorFormValues>({
    resolver: zodResolver(sponsorSchema),
    defaultValues: {
      name: initialData?.name ?? preset?.name ?? "",
      slug: initialData?.slug ?? (preset?.name ? slugify(preset.name) : ""),
      tagline: initialData?.tagline ?? "",
      description: initialData?.description ?? "",
      logo_url: initialData?.logo_url ?? "",
      hero_image_url: initialData?.hero_image_url ?? "",
      website_url: initialData?.website_url ?? "",
      instagram_handle: initialData?.instagram_handle ?? "",
      contact_email: initialData?.contact_email ?? preset?.contact_email ?? "",
      contact_whatsapp: initialData?.contact_whatsapp ?? "",
      tier: initialData?.tier ?? preset?.tier ?? "patron",
      status: initialData?.status ?? "active",
      category_sponsor: initialData?.category_sponsor ?? "",
      monthly_amount_cents: initialData?.monthly_amount_cents?.toString() ?? "",
      starts_on: initialData?.starts_on ?? "",
      ends_on: initialData?.ends_on ?? "",
    },
  });

  const name = form.watch("name");
  const tier = form.watch("tier");

  useEffect(() => {
    if (!isEditMode && !slugManuallyEdited && name) {
      form.setValue("slug", slugify(name));
    }
  }, [name, isEditMode, slugManuallyEdited, form]);

  async function onSubmit(data: SponsorFormValues) {
    setSaving(true);
    const supabase = createClient();

    const categoryValue =
      data.category_sponsor && data.category_sponsor !== NO_CATEGORY
        ? data.category_sponsor
        : null;

    const payload: Record<string, unknown> = {
      name: data.name,
      slug: data.slug,
      tagline: data.tagline || null,
      description: data.description || null,
      logo_url: data.logo_url || null,
      hero_image_url: data.hero_image_url || null,
      website_url: data.website_url || null,
      instagram_handle: data.instagram_handle || null,
      contact_email: data.contact_email || null,
      contact_whatsapp: data.contact_whatsapp || null,
      tier: data.tier,
      status: data.status,
      category_sponsor: data.tier === "anchor" ? categoryValue : null,
      monthly_amount_cents: data.monthly_amount_cents ? Number(data.monthly_amount_cents) : null,
      starts_on: data.starts_on || null,
      ends_on: data.ends_on || null,
    };

    let error;
    let createdSponsorId: string | null = null;
    if (isEditMode) {
      ({ error } = await supabase.from("sponsors").update(payload).eq("id", initialData.id));
    } else {
      const { data: created, error: insertErr } = await supabase
        .from("sponsors")
        .insert(payload)
        .select("id")
        .single();
      error = insertErr;
      createdSponsorId = (created as { id: string } | null)?.id ?? null;
    }

    // If this new sponsor came from a lead inquiry, mark the lead as converted
    // and link it to the sponsor row so the audit trail survives.
    if (!error && !isEditMode && preset?.from_lead_id && createdSponsorId) {
      await supabase
        .from("sponsor_leads")
        .update({
          status: "converted",
          sponsor_id: createdSponsorId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", preset.from_lead_id);
    }

    setSaving(false);

    if (error) {
      if (error.code === "23505" || error.message?.includes("unique") || error.message?.includes("duplicate")) {
        if (error.message?.includes("category")) {
          form.setError("category_sponsor", {
            message: "Another active anchor already owns this category.",
          });
        } else {
          form.setError("slug", { message: "This slug is already in use." });
        }
      } else {
        form.setError("root", { message: error.message });
      }
      return;
    }

    router.push("/admin/sponsors");
    router.refresh();
  }

  async function handleDelete() {
    setDeleting(true);
    const supabase = createClient();
    const { error } = await supabase.from("sponsors").delete().eq("id", initialData!.id);
    setDeleting(false);
    if (error) {
      form.setError("root", { message: error.message });
      return;
    }
    setDeleteOpen(false);
    router.push("/admin/sponsors");
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
                    <Input placeholder="The Yoga Barn" {...field} />
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
                      placeholder="the-yoga-barn"
                      {...field}
                      onChange={(e) => {
                        setSlugManuallyEdited(true);
                        field.onChange(e);
                      }}
                    />
                  </FormControl>
                  <FormDescription>Public URL: /community/partners/{form.watch("slug") || "..."}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tagline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tagline</FormLabel>
                  <FormControl>
                    <Input placeholder="Ubud's living room for yoga + ceremony" {...field} />
                  </FormControl>
                  <FormDescription>One editorial sentence — shows on directory cards.</FormDescription>
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
                      rows={6}
                      placeholder="Two or three short paragraphs — what the partner does, who they're for, why we believe in them. Editorial voice, not marketing copy."
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
                name="website_url"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input placeholder="https://theyogabarn.com" {...field} />
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
                    <FormLabel>Instagram</FormLabel>
                    <FormControl>
                      <Input placeholder="@theyogabarn" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contact_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="hello@…" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contact_whatsapp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WhatsApp</FormLabel>
                    <FormControl>
                      <Input placeholder="+62 ..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4 rounded-md border p-4">
              <h3 className="text-sm font-medium">Internal — billing & dates</h3>
              <div className="grid gap-4 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="monthly_amount_cents"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monthly (cents)</FormLabel>
                      <FormControl>
                        <Input type="number" step="1" placeholder="30000" {...field} />
                      </FormControl>
                      <FormDescription>e.g. 30000 = $300</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="starts_on"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Starts</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ends_on"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ends</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <FormField
              control={form.control}
              name="logo_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo</FormLabel>
                  <FormControl>
                    <ImageUploader folder="sponsors" value={field.value} onChange={field.onChange} />
                  </FormControl>
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
                    <ImageUploader folder="sponsors" value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormDescription>Wide editorial photo for the profile page.</FormDescription>
                  <FormMessage />
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
                      {TIERS.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>{TIERS.find((t) => t.value === field.value)?.hint}</FormDescription>
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
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>Only active sponsors are visible publicly.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {tier === "anchor" && (
              <FormField
                control={form.control}
                name="category_sponsor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category sponsor</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || NO_CATEGORY}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Pick a category to own" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={NO_CATEGORY}>—</SelectItem>
                        {EVENT_CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      One active anchor per category. They&apos;ll appear at the top of that category page.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 border-t pt-6">
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Partner
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
                  <DialogTitle>Delete sponsor</DialogTitle>
                  <DialogDescription>
                    Delete &ldquo;{initialData.name}&rdquo;? All sponsorship placements attached to
                    this partner will be removed.
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
