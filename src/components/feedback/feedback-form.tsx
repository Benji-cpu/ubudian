"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ImagePlus, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const feedbackSchema = z.object({
  type: z.enum(["bug", "suggestion", "general"]),
  message: z.string().min(10, "Please provide at least 10 characters").max(2000),
  image_url: z.string().url().optional().or(z.literal("")),
  page_url: z.string().optional(),
  page_title: z.string().optional(),
  website: z.string().optional(),
});

const FEEDBACK_TYPES = [
  { value: "bug" as const, label: "Bug" },
  { value: "suggestion" as const, label: "Suggestion" },
  { value: "general" as const, label: "General" },
];

type FeedbackFormData = z.infer<typeof feedbackSchema>;

interface FeedbackFormProps {
  onSuccess: () => void;
}

export function FeedbackForm({ onSuccess }: FeedbackFormProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      type: "general",
      message: "",
      image_url: "",
      page_url: typeof window !== "undefined" ? window.location.href : "",
      page_title: typeof window !== "undefined" ? document.title : "",
      website: "",
    },
  });

  const selectedType = watch("type");

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }

    setIsUploading(true);
    try {
      const supabase = createClient();
      const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "");
      const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      const fileName = `feedback/${id}.${ext || "png"}`;
      const { error } = await supabase.storage.from("images").upload(fileName, file);

      if (error) {
        toast.error("Failed to upload image");
        console.error("Image upload error:", error);
        return;
      }

      const { data: { publicUrl } } = supabase.storage.from("images").getPublicUrl(fileName);
      setValue("image_url", publicUrl);
      setImagePreview(publicUrl);
    } catch {
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
      // Reset input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function removeImage() {
    setValue("image_url", "");
    setImagePreview(null);
  }

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
      setImagePreview(null);
      onSuccess();
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label className="mb-2 block">Type</Label>
        <div className="flex gap-2" role="radiogroup" aria-label="Feedback type">
          {FEEDBACK_TYPES.map((opt) => {
            const isActive = selectedType === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={isActive}
                onClick={() => setValue("type", opt.value, { shouldValidate: true })}
                className={
                  "flex-1 rounded-md border px-3 py-2 text-sm transition " +
                  (isActive
                    ? "border-[var(--brand-deep-green)] bg-[var(--brand-deep-green)] text-white"
                    : "border-input bg-background hover:bg-muted")
                }
              >
                {opt.label}
              </button>
            );
          })}
        </div>
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

      {/* Image upload */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />
        {imagePreview ? (
          <div className="relative inline-block">
            <img
              src={imagePreview}
              alt="Feedback attachment"
              className="h-24 w-24 rounded-md object-cover border"
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
              aria-label="Remove image"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <ImagePlus className="mr-2 h-4 w-4" />
                Attach image
              </>
            )}
          </Button>
        )}
      </div>

      {/* Hidden fields */}
      <input type="hidden" {...register("page_url")} />
      <input type="hidden" {...register("page_title")} />
      <input type="hidden" {...register("image_url")} />

      {/* Honeypot */}
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <input type="text" tabIndex={-1} autoComplete="off" {...register("website")} />
      </div>

      <Button type="submit" disabled={isSubmitting || isUploading} className="w-full">
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
