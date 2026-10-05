"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { specialSubmissionSchema } from "@/lib/specials/schema";
import { WEEKDAY_LABELS } from "@/lib/specials";
import { cn } from "@/lib/utils";

// The form takes the price as typed text; the API takes a number.
const formSchema = specialSubmissionSchema
  .omit({ price_idr: true })
  .extend({ price: z.string().trim().regex(/^[\d.,]*$/, "Numbers only, e.g. 135000").optional().or(z.literal("")) });

type FormValues = z.infer<typeof formSchema>;

// Monday first, the way a restaurant reads its week.
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export function SpecialSubmissionForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      venue_name: "",
      venue_area: "",
      venue_address: "",
      instagram_handle: "",
      website_url: "",
      title: "",
      description: "",
      price: "",
      weekdays: [],
      start_time: "",
      end_time: "",
      contact_name: "",
      contact_phone: "",
      contact_email: "",
      website: "",
    },
  });

  async function onSubmit(values: FormValues) {
    setStatus("loading");
    setErrorMessage("");
    const { price, ...rest } = values;
    const digits = (price ?? "").replace(/[.,]/g, "");
    try {
      const res = await fetch("/api/specials/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...rest, price_idr: digits ? Number(digits) : null }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || "Something went wrong.");
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-xl border border-brand-gold/20 bg-card p-8 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-brand-deep-green dark:text-brand-gold" />
        <h2 className="mt-4 font-serif text-2xl text-brand-deep-green dark:text-brand-gold">Your deal is live</h2>
        <p className="mt-2 text-muted-foreground">
          It shows on Tonight in Ubud on the days it runs. We&apos;ll check with you on WhatsApp in a
          month to keep it listed.
        </p>
        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link href="/tonight">See it on Tonight in Ubud</Link>
          </Button>
          <Button variant="outline" onClick={() => { form.reset(); setStatus("idle"); }}>
            Add another deal
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 [&_input::placeholder]:text-muted-foreground/45 [&_textarea::placeholder]:text-muted-foreground/45" noValidate>
        <fieldset className="space-y-5">
          <legend className="font-serif text-xl text-brand-deep-green dark:text-brand-gold">The deal</legend>
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>What is it?</FormLabel>
                <FormControl>
                  <Input placeholder="Pasta + a glass of wine" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price in IDR (optional)</FormLabel>
                <FormControl>
                  <Input inputMode="numeric" placeholder="135000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="weekdays"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Which days?</FormLabel>
                <div className="flex flex-wrap gap-2">
                  {DAY_ORDER.map((d) => {
                    const on = field.value.includes(d);
                    return (
                      <button
                        key={d}
                        type="button"
                        aria-pressed={on}
                        onClick={() =>
                          field.onChange(on ? field.value.filter((x) => x !== d) : [...field.value, d])
                        }
                        className={cn(
                          "h-10 min-w-12 rounded-full border px-3 text-sm font-medium transition-colors",
                          on
                            ? "border-brand-deep-green bg-brand-deep-green text-brand-off-white dark:border-brand-gold dark:bg-brand-gold dark:text-brand-deep-green"
                            : "border-input bg-background hover:border-brand-deep-green"
                        )}
                      >
                        {WEEKDAY_LABELS[d]}
                      </button>
                    );
                  })}
                </div>
                <FormDescription>Leave them all off if it runs every day.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="start_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>From (optional)</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
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
                  <FormLabel>Until (optional)</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Details (optional)</FormLabel>
                <FormControl>
                  <Textarea rows={3} placeholder="Any pasta from the menu with a house red or white. Dine-in only." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </fieldset>

        <fieldset className="space-y-5">
          <legend className="font-serif text-xl text-brand-deep-green dark:text-brand-gold">Your restaurant</legend>
          <FormField
            control={form.control}
            name="venue_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Warung Example" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="venue_area"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Area (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Penestanan" {...field} />
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
                  <FormLabel>Instagram (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="@yourplace" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="venue_address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Street (optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Jl. Raya Ubud" {...field} />
                </FormControl>
                <FormDescription>Used for the Directions link.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </fieldset>

        <fieldset className="space-y-5">
          <legend className="font-serif text-xl text-brand-deep-green dark:text-brand-gold">How we reach you</legend>
          <p className="text-sm text-muted-foreground">
            Never shown on the site. We only use it to check once a month that the deal is still running.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="contact_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your name</FormLabel>
                  <FormControl>
                    <Input autoComplete="name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contact_phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>WhatsApp number</FormLabel>
                  <FormControl>
                    <Input type="tel" autoComplete="tel" placeholder="+62 812 …" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="contact_email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email (optional)</FormLabel>
                <FormControl>
                  <Input type="email" autoComplete="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </fieldset>

        {/* Honeypot — hidden from people, filled by bots */}
        <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label>
            Website
            <input tabIndex={-1} autoComplete="off" {...form.register("website")} />
          </label>
        </div>

        {status === "error" && (
          <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{errorMessage}</p>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={status === "loading"}>
          {status === "loading" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Publish my deal
        </Button>
      </form>
    </Form>
  );
}
