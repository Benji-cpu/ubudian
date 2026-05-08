"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/utils";
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
import type { Partner, PartnerKind } from "@/types";

const PARTNER_KINDS: { value: PartnerKind; label: string }[] = [
  { value: "villa", label: "Villa" },
  { value: "hotel", label: "Hotel" },
  { value: "homestay", label: "Homestay" },
  { value: "restaurant", label: "Restaurant" },
  { value: "cafe", label: "Café" },
  { value: "studio", label: "Studio" },
  { value: "spa", label: "Spa" },
  { value: "other", label: "Other" },
];

const partnerSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase with hyphens only"),
  kind: z.enum(["villa", "hotel", "homestay", "restaurant", "cafe", "studio", "spa", "other"]),
  description: z.string().max(2000).optional().or(z.literal("")),
  affiliate_url: z.string().url("Must be a full URL").optional().or(z.literal("")),
  commission_rate: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (v) => !v || (Number(v) >= 0 && Number(v) <= 100),
      "Must be between 0 and 100"
    ),
  contact_whatsapp: z.string().max(50).optional().or(z.literal("")),
  contact_email: z.string().email("Invalid email").optional().or(z.literal("")),
  base_location: z.string().max(120).optional().or(z.literal("")),
  is_active: z.boolean(),
});

type PartnerFormValues = z.infer<typeof partnerSchema>;

interface PartnerFormProps {
  initialData?: Partner;
}

export function PartnerForm({ initialData }: PartnerFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(!!initialData);
  const isEditMode = !!initialData;

  const form = useForm<PartnerFormValues>({
    resolver: zodResolver(partnerSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      slug: initialData?.slug ?? "",
      kind: initialData?.kind ?? "restaurant",
      description: initialData?.description ?? "",
      affiliate_url: initialData?.affiliate_url ?? "",
      commission_rate: initialData?.commission_rate?.toString() ?? "",
      contact_whatsapp: initialData?.contact_whatsapp ?? "",
      contact_email: initialData?.contact_email ?? "",
      base_location: initialData?.base_location ?? "",
      is_active: initialData?.is_active ?? true,
    },
  });

  const name = form.watch("name");

  useEffect(() => {
    if (!isEditMode && !slugManuallyEdited && name) {
      form.setValue("slug", slugify(name));
    }
  }, [name, isEditMode, slugManuallyEdited, form]);

  async function onSubmit(data: PartnerFormValues) {
    setSaving(true);
    const supabase = createClient();

    const payload: Record<string, unknown> = {
      name: data.name,
      slug: data.slug,
      kind: data.kind,
      description: data.description || null,
      affiliate_url: data.affiliate_url || null,
      commission_rate: data.commission_rate ? Number(data.commission_rate) : null,
      contact_whatsapp: data.contact_whatsapp || null,
      contact_email: data.contact_email || null,
      base_location: data.base_location || null,
      is_active: data.is_active,
    };

    let error;
    if (isEditMode) {
      ({ error } = await supabase.from("partners").update(payload).eq("id", initialData.id));
    } else {
      ({ error } = await supabase.from("partners").insert(payload));
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

    router.push("/admin/partners");
    router.refresh();
  }

  async function handleDelete() {
    setDeleting(true);
    const supabase = createClient();
    const { error } = await supabase.from("partners").delete().eq("id", initialData!.id);
    setDeleting(false);
    if (error) {
      form.setError("root", { message: error.message });
      return;
    }
    setDeleteOpen(false);
    router.push("/admin/partners");
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
                    <Input placeholder="Hujan Locale" {...field} />
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
                      placeholder="hujan-locale"
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Two or three sentences — what makes this place worth visiting."
                      rows={4}
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
                name="affiliate_url"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Affiliate URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://hujan-locale.com/?ref=ubudian" {...field} />
                    </FormControl>
                    <FormDescription>Used by /r/[token] redirect for click attribution.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="commission_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Commission %</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.5" placeholder="10" {...field} />
                    </FormControl>
                    <FormDescription>Manual reconciliation for now.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="base_location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Base location</FormLabel>
                    <FormControl>
                      <Input placeholder="Penestanan · Ubud" {...field} />
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
                    <FormLabel>Email</FormLabel>
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
          </div>

          <div className="space-y-6">
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0 rounded-md border p-3">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="font-normal">Active</FormLabel>
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
                      {PARTNER_KINDS.map((k) => (
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
                  <DialogTitle>Delete partner</DialogTitle>
                  <DialogDescription>
                    Delete &ldquo;{initialData.name}&rdquo;? Atoms referencing this partner keep
                    their kind but lose the FK link.
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
