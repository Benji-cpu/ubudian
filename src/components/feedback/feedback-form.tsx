"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const feedbackSchema = z.object({
  type: z.enum(["bug", "suggestion", "general"]),
  message: z.string().min(10, "Please provide at least 10 characters").max(2000),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  page_url: z.string().optional(),
  page_title: z.string().optional(),
  website: z.string().optional(),
});

type FeedbackFormData = z.infer<typeof feedbackSchema>;

interface FeedbackFormProps {
  onSuccess: () => void;
  userEmail?: string | null;
}

export function FeedbackForm({ onSuccess, userEmail }: FeedbackFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      type: "general",
      message: "",
      email: userEmail || "",
      page_url: typeof window !== "undefined" ? window.location.href : "",
      page_title: typeof window !== "undefined" ? document.title : "",
      website: "",
    },
  });

  const selectedType = watch("type");

  async function onSubmit(data: FeedbackFormData) {
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const result = await res.json();
        toast.error(result.error || "Failed to submit feedback");
        return;
      }

      toast.success("Thanks for your feedback!");
      reset();
      onSuccess();
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="feedback-type">Type</Label>
        <Select
          value={selectedType}
          onValueChange={(val) => setValue("type", val as FeedbackFormData["type"])}
        >
          <SelectTrigger id="feedback-type" className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bug">Bug Report</SelectItem>
            <SelectItem value="suggestion">Suggestion</SelectItem>
            <SelectItem value="general">General Feedback</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="feedback-message">Message</Label>
        <Textarea
          id="feedback-message"
          placeholder="Tell us what you think..."
          className="mt-1 min-h-[100px]"
          {...register("message")}
        />
        {errors.message && (
          <p className="mt-1 text-sm text-destructive">{errors.message.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="feedback-email">Email (optional)</Label>
        <Input
          id="feedback-email"
          type="email"
          placeholder="your@email.com"
          className="mt-1"
          {...register("email")}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      {/* Hidden fields */}
      <input type="hidden" {...register("page_url")} />
      <input type="hidden" {...register("page_title")} />

      {/* Honeypot */}
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <input type="text" tabIndex={-1} autoComplete="off" {...register("website")} />
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending...
          </>
        ) : (
          "Send Feedback"
        )}
      </Button>
    </form>
  );
}
