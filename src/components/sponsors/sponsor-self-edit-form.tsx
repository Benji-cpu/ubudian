"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
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
import { Loader2 } from "lucide-react";
import type { Sponsor } from "@/types";

const selfEditSchema = z.object({
  tagline: z.string().max(200).optional().or(z.literal("")),
  description: z.string().max(2000).optional().or(z.literal("")),
  logo_url: z.string().optional().or(z.literal("")),
  hero_image_url: z.string().optional().or(z.literal("")),
  website_url: z.string().url("Must be a full URL").optional().or(z.literal("")),
  instagram_handle: z.string().max(50).optional().or(z.literal("")),
  contact_email: z.string().email("Invalid email").optional().or(z.literal("")),
  contact_whatsapp: z.string().max(50).optional().or(z.literal("")),
});

type SelfEditValues = z.infer<typeof selfEditSchema>;

/**
 * Sponsor-side profile editor. Fields users can change themselves:
 * tagline, description, imagery, contact info. Tier / status / category /
 * Stripe identifiers remain admin-only and are not exposed here.
 *
 * Persistence uses RLS: the "Claimed sponsor self-update" policy gates the
 * row, and the omitted fields stay protected by virtue of not being sent.
 */
export function SponsorSelfEditForm({ sponsor }: { sponsor: Sponsor }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const form = useForm<SelfEditValues>({
    resolver: zodResolver(selfEditSchema),
    defaultValues: {
      tagline: sponsor.tagline ?? "",
      description: sponsor.description ?? "",
      logo_url: sponsor.logo_url ?? "",
      hero_image_url: sponsor.hero_image_url ?? "",
      website_url: sponsor.website_url ?? "",
      instagram_handle: sponsor.instagram_handle ?? "",
      contact_email: sponsor.contact_email ?? "",
      contact_whatsapp: sponsor.contact_whatsapp ?? "",
    },
  });

  async function onSubmit(data: SelfEditValues) {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("sponsors")
      .update({
        tagline: data.tagline || null,
        description: data.description || null,
        logo_url: data.logo_url || null,
        hero_image_url: data.hero_image_url || null,
        website_url: data.website_url || null,
        instagram_handle: data.instagram_handle || null,
        contact_email: data.contact_email || null,
        contact_whatsapp: data.contact_whatsapp || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sponsor.id);
    setSaving(false);
    if (error) {
      form.setError("root", { message: error.message });
      return;
    }
    setSavedAt(new Date());
    router.refresh();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {form.formState.errors.root && (
          <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
            {form.formState.errors.root.message}
          </div>
        )}

        <FormField
          control={form.control}
          name="tagline"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tagline</FormLabel>
              <FormControl>
                <Input placeholder="One sentence on what you offer" {...field} />
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
                <Textarea rows={6} placeholder="Editorial prose, two-three short paragraphs." {...field} />
              </FormControl>
              <FormDescription>{field.value?.length ?? 0}/2000</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-5 sm:grid-cols-2">
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
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="website_url"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Website</FormLabel>
                <FormControl>
                  <Input placeholder="https://..." {...field} />
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
                  <Input placeholder="@…" {...field} />
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

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save changes
          </Button>
          {savedAt && (
            <span className="text-xs text-muted-foreground">
              Saved at {savedAt.toLocaleTimeString("en-GB")}
            </span>
          )}
        </div>
      </form>
    </Form>
  );
}
