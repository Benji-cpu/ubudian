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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Trash2 } from "lucide-react";
import type { Practitioner } from "@/types";

const practitionerSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase with hyphens only"),
  bio: z.string().max(2000).optional().or(z.literal("")),
  photo_url: z.string().optional().or(z.literal("")),
  modalities: z.array(z.string()),
  theme_tags: z.array(z.string()),
  contact_whatsapp: z.string().max(50).optional().or(z.literal("")),
  contact_email: z.string().email("Invalid email").optional().or(z.literal("")),
  contact_instagram: z.string().max(80).optional().or(z.literal("")),
  base_location: z.string().max(120).optional().or(z.literal("")),
  is_active: z.boolean(),
});

type PractitionerFormValues = z.infer<typeof practitionerSchema>;

const COMMON_MODALITIES = [
  "Sound Healing",
  "Breathwork",
  "Tantra",
  "Bodywork",
  "Massage",
  "Pranic Healing",
  "Yoga",
  "Cacao Ceremony",
  "Ecstatic Dance",
  "Shamanic Journey",
  "Reiki",
  "TCM",
  "Acupuncture",
  "Polarity",
  "5Rhythms",
];

interface PractitionerFormProps {
  initialData?: Practitioner;
}

export function PractitionerForm({ initialData }: PractitionerFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(!!initialData);
  const isEditMode = !!initialData;

  const form = useForm<PractitionerFormValues>({
    resolver: zodResolver(practitionerSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      slug: initialData?.slug ?? "",
      bio: initialData?.bio ?? "",
      photo_url: initialData?.photo_url ?? "",
      modalities: initialData?.modalities ?? [],
      theme_tags: initialData?.theme_tags ?? [],
      contact_whatsapp: initialData?.contact_whatsapp ?? "",
      contact_email: initialData?.contact_email ?? "",
      contact_instagram: initialData?.contact_instagram ?? "",
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

  async function onSubmit(data: PractitionerFormValues) {
    setSaving(true);
    const supabase = createClient();

    const payload: Record<string, unknown> = {
      name: data.name,
      slug: data.slug,
      bio: data.bio || null,
      photo_url: data.photo_url || null,
      modalities: data.modalities,
      theme_tags: data.theme_tags,
      contact_whatsapp: data.contact_whatsapp || null,
      contact_email: data.contact_email || null,
      contact_instagram: data.contact_instagram?.replace(/^@/, "") || null,
      base_location: data.base_location || null,
      is_active: data.is_active,
    };

    let error;
    if (isEditMode) {
      ({ error } = await supabase
        .from("practitioners")
        .update(payload)
        .eq("id", initialData.id));
    } else {
      ({ error } = await supabase.from("practitioners").insert(payload));
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

    router.push("/admin/practitioners");
    router.refresh();
  }

  async function handleDelete() {
    setDeleting(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("practitioners")
      .delete()
      .eq("id", initialData!.id);
    setDeleting(false);
    if (error) {
      form.setError("root", { message: error.message });
      return;
    }
    setDeleteOpen(false);
    router.push("/admin/practitioners");
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
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Krishna" {...field} />
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
                      placeholder="krishna-pyramids-of-chi"
                      {...field}
                      onChange={(e) => {
                        setSlugManuallyEdited(true);
                        field.onChange(e);
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Public path: /practitioners/{form.watch("slug") || "..."}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Two or three sentences in their voice — what they hold, where they came from."
                      rows={5}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="modalities"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Modalities</FormLabel>
                  <FormControl>
                    <TagInput
                      options={COMMON_MODALITIES}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormDescription>Pick from the list. Extend the list in code as new modalities appear.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                        "purification",
                        "breath",
                        "grounding",
                        "ritual",
                        "shadow",
                        "intimacy",
                        "movement",
                        "sound",
                      ]}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormDescription>Used to match practitioner-kind atoms to slot themes.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="contact_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="krishna@example.com" {...field} />
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
                      <Input placeholder="+62 812 ..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contact_instagram"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instagram handle</FormLabel>
                    <FormControl>
                      <Input placeholder="@krishna_breath" {...field} />
                    </FormControl>
                    <FormDescription>Without the @ — saved automatically.</FormDescription>
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
                      <Input placeholder="Pyramids of Chi · Sayan" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
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
                  <FormLabel className="font-normal">Active (visible to public)</FormLabel>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="photo_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Portrait</FormLabel>
                  <FormControl>
                    <ImageUploader
                      bucket="images"
                      folder="practitioners"
                      value={field.value || ""}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormDescription>
                    Square crop is best. Falls back to gold initials when empty.
                  </FormDescription>
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
            Save Practitioner
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
                  <DialogTitle>Delete practitioner</DialogTitle>
                  <DialogDescription>
                    Delete &ldquo;{initialData.name}&rdquo;? Atoms referencing this practitioner
                    keep their kind but lose the FK link (set to null).
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
