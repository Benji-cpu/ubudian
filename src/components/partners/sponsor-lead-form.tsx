"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Loader2 } from "lucide-react";

const TIER_OPTIONS: { value: string; label: string }[] = [
  { value: "unsure", label: "Not sure yet — let's talk" },
  { value: "patron", label: "Patron · ~$75/mo" },
  { value: "partner", label: "Partner · ~$300/mo" },
  { value: "anchor", label: "Anchor · ~$750/mo" },
];

const leadSchema = z.object({
  business_name: z.string().min(1, "Business name is required").max(120),
  contact_name: z.string().max(120).optional().or(z.literal("")),
  contact_email: z.string().email("Enter a valid email"),
  contact_whatsapp: z.string().max(50).optional().or(z.literal("")),
  website_url: z.string().url("Must be a full URL").optional().or(z.literal("")),
  tier_interest: z.enum(["unsure", "patron", "partner", "anchor"]).optional().or(z.literal("")),
  message: z.string().max(2000).optional().or(z.literal("")),
  // Honeypot — real users will leave this blank. Bots fill every field.
  website: z.string().max(0, "Bot detected").optional().or(z.literal("")),
});

type LeadFormValues = z.infer<typeof leadSchema>;

export function SponsorLeadForm() {
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      business_name: "",
      contact_name: "",
      contact_email: "",
      contact_whatsapp: "",
      website_url: "",
      tier_interest: "",
      message: "",
      website: "",
    },
  });

  async function onSubmit(data: LeadFormValues) {
    const res = await fetch("/api/sponsor-leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      form.setError("root", { message: body.error ?? "Something went wrong. Try again?" });
      return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="rounded-md border border-brand-gold/30 bg-brand-cream/60 p-6">
        <p className="font-serif text-lg text-brand-deep-green">Thank you.</p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          We&apos;ll be in touch within a few days. If you don&apos;t hear back, ping
          us on{" "}
          <a
            href="https://instagram.com/theubudian"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-brand-gold/40 underline-offset-4 hover:decoration-brand-gold"
          >
            Instagram
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {form.formState.errors.root && (
          <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
            {form.formState.errors.root.message}
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="business_name"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Business or studio name *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. The Yoga Barn" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contact_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your name</FormLabel>
                <FormControl>
                  <Input placeholder="First and last" {...field} />
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
                <FormLabel>Email *</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="you@…" {...field} />
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
          <FormField
            control={form.control}
            name="website_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Website</FormLabel>
                <FormControl>
                  <Input placeholder="https://..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="tier_interest"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tier you&apos;re considering</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ""}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Not sure yet — that's fine" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {TIER_OPTIONS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>You can change this later.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tell us about your work</FormLabel>
              <FormControl>
                <Textarea
                  rows={5}
                  placeholder="What you do, who it's for, and what would be a meaningful first placement."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Honeypot — visually hidden, screen-reader-skipped */}
        <div className="hidden" aria-hidden="true">
          <label>
            Website
            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              {...form.register("website")}
            />
          </label>
        </div>

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Send a note
        </Button>
      </form>
    </Form>
  );
}
