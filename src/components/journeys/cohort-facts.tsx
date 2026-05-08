import { Calendar, MapPin, Users, Wallet, type LucideIcon } from "lucide-react";
import { GrainTexture } from "@/components/ui/grain-texture";
import type { Journey } from "@/types";

interface CohortFactsProps {
  journey: Journey;
  applyHref?: string;
}

const STATUS_LABEL: Record<NonNullable<Journey["next_cohort_status"]>, string> = {
  open: "Open for application",
  almost_full: "Almost full",
  full: "Full — joining waitlist",
  waitlist: "Waitlist only",
};

const STATUS_TONE: Record<NonNullable<Journey["next_cohort_status"]>, string> = {
  open: "bg-brand-deep-green/10 text-brand-deep-green",
  almost_full: "bg-brand-terracotta/10 text-brand-terracotta",
  full: "bg-brand-charcoal/10 text-brand-charcoal",
  waitlist: "bg-brand-charcoal/10 text-brand-charcoal",
};

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function formatDateRange(start: string | null, end: string | null): string | null {
  if (!start) return null;
  const s = new Date(start);
  const e = end ? new Date(end) : null;
  const sameMonth = e && s.getUTCMonth() === e.getUTCMonth() && s.getUTCFullYear() === e.getUTCFullYear();
  const sameYear = e && s.getUTCFullYear() === e.getUTCFullYear();
  const sm = MONTHS[s.getUTCMonth()];
  const sd = s.getUTCDate();
  const sy = s.getUTCFullYear();
  if (!e) return `${sm} ${sd}, ${sy}`;
  const em = MONTHS[e.getUTCMonth()];
  const ed = e.getUTCDate();
  const ey = e.getUTCFullYear();
  if (sameMonth) return `${sm} ${sd}–${ed}, ${sy}`;
  if (sameYear) return `${sm} ${sd} – ${em} ${ed}, ${sy}`;
  return `${sm} ${sd}, ${sy} – ${em} ${ed}, ${ey}`;
}

function formatPrice(cents: number | null): string | null {
  if (cents == null) return null;
  return `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function formatCohortSize(min: number | null, max: number | null): string | null {
  if (min && max && min !== max) return `${min}–${max}`;
  if (max) return `Up to ${max}`;
  if (min) return `${min}+`;
  return null;
}

/**
 * Cohort facts panel — surfaces the *who, when, where, how many, what cost*
 * a visitor needs to see without scrolling. Sits high on the detail page.
 * If a journey has no scheduled cohort, the panel doesn't render.
 */
export function CohortFacts({ journey, applyHref }: CohortFactsProps) {
  const dateRange = formatDateRange(journey.next_cohort_starts_at, journey.next_cohort_ends_at);
  const price = formatPrice(journey.price_per_person_cents);
  const size = formatCohortSize(journey.cohort_size_min, journey.cohort_size_max);

  // No cohort scheduled and no host attached — render nothing.
  if (!dateRange && !journey.host_name) return null;

  const facts: { icon: LucideIcon; label: string; value: string }[] = [];
  if (dateRange) facts.push({ icon: Calendar, label: "Next cohort", value: dateRange });
  if (size) facts.push({ icon: Users, label: "Cohort size", value: size });
  if (journey.villa_neighbourhood)
    facts.push({ icon: MapPin, label: "Villa", value: journey.villa_neighbourhood });
  if (price) facts.push({ icon: Wallet, label: "Per person", value: price });

  return (
    <aside className="relative my-12 overflow-hidden rounded-md border border-brand-gold/25 bg-brand-cream/60 p-6 shadow-[0_1px_0_0_rgba(201,168,76,0.12)] sm:p-8">
      <GrainTexture opacity={0.04} />
      <div className="relative">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="text-xs uppercase tracking-[0.3em] text-brand-gold">
              The next cohort
            </span>
            <h3 className="mt-2 font-serif text-2xl font-medium text-brand-deep-green sm:text-3xl">
              Hosted by{" "}
              <span className="italic">
                {journey.host_name ?? "the Ubudian editorial team"}
              </span>
            </h3>
            {journey.host_role && (
              <p className="mt-1 text-sm text-foreground/65">{journey.host_role}</p>
            )}
          </div>
          {journey.next_cohort_status && (
            <span
              className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-wider ${STATUS_TONE[journey.next_cohort_status]}`}
            >
              {STATUS_LABEL[journey.next_cohort_status]}
            </span>
          )}
        </div>

        {facts.length > 0 && (
          <dl className="mt-6 grid grid-cols-1 gap-4 border-t border-brand-gold/20 pt-6 sm:grid-cols-2 lg:grid-cols-4">
            {facts.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-brand-gold/35 bg-brand-cream text-brand-deep-green">
                  <Icon className="h-4 w-4" strokeWidth={1.4} />
                </span>
                <div className="min-w-0">
                  <dt className="text-[10px] uppercase tracking-[0.2em] text-brand-gold">{label}</dt>
                  <dd className="mt-0.5 font-serif text-base text-brand-deep-green">{value}</dd>
                </div>
              </div>
            ))}
          </dl>
        )}

        {applyHref && (
          <div className="mt-7 flex flex-col items-start gap-3 border-t border-brand-gold/20 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-serif text-sm italic text-foreground/70">
              We read every application. We&apos;ll come back within three days.
            </p>
            <a
              href={applyHref}
              className="inline-flex items-center justify-center rounded-sm bg-brand-deep-green px-6 py-2.5 text-sm font-medium uppercase tracking-wider text-brand-cream transition-colors hover:bg-brand-deep-green/90"
            >
              Apply for a place
            </a>
          </div>
        )}
      </div>
    </aside>
  );
}
