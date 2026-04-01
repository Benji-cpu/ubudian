"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle2 } from "lucide-react";

interface NewsletterSignupProps {
  className?: string;
  variant?: "light" | "dark";
}

export function NewsletterSignup({ className, variant = "light" }: NewsletterSignupProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "Something went wrong. Please try again.");
        return;
      }

      setStatus("success");
      setMessage("You're in. See you in your inbox.");
      setEmail("");
      try {
        localStorage.setItem("ubudian_subscribed", "true");
      } catch {
        // ignore
      }
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  }

  const isDark = variant === "dark";

  if (status === "success") {
    return (
      <div className={className}>
        <div className={`flex items-center justify-center gap-2 ${isDark ? "text-brand-gold" : "text-brand-deep-green"}`}>
          <CheckCircle2 className="h-5 w-5" />
          <p className="text-sm font-medium">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="flex gap-2">
        <Input
          type="email"
          placeholder="Enter your email"
          aria-label="Email address for newsletter"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={
            isDark
              ? "border-brand-off-white/20 bg-white/5 text-brand-off-white placeholder:text-brand-off-white/40"
              : "bg-white"
          }
        />
        <Button
          type="submit"
          disabled={status === "loading"}
          aria-label="Subscribe to newsletter"
          className={
            isDark
              ? "bg-brand-gold text-brand-deep-green hover:bg-brand-gold/90"
              : undefined
          }
        >
          {status === "loading" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Subscribe"
          )}
        </Button>
      </div>
      {status === "error" && (
        <p className="mt-1.5 text-sm text-destructive">{message}</p>
      )}
    </form>
  );
}
