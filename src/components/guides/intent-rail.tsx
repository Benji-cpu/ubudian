import Link from "next/link";
import Image from "next/image";
import { GUIDE_INTENTS } from "@/lib/guides/intents";

interface IntentRailProps {
  activeIntent?: string | null;
}

export function IntentRail({ activeIntent }: IntentRailProps) {
  return (
    <section className="border-y border-brand-gold/10 bg-brand-cream/40 py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-baseline justify-between gap-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-brand-gold/90">
              Find your way in
            </p>
            <h2 className="mt-2 font-serif text-2xl font-medium text-brand-deep-green dark:text-brand-off-white sm:text-3xl">
              What are you here for?
            </h2>
          </div>
          {activeIntent && (
            <Link
              href="/guides"
              className="text-xs uppercase tracking-[0.18em] text-brand-charcoal/60 transition-colors hover:text-brand-deep-green"
            >
              Show all
            </Link>
          )}
        </div>

        <ul className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {GUIDE_INTENTS.map((intent) => {
            const isActive = activeIntent === intent.id;
            return (
              <li key={intent.id}>
                <Link
                  href={`/guides?intent=${intent.id}`}
                  className={`group block h-full overflow-hidden rounded-sm border transition-all duration-300 ${
                    isActive
                      ? "border-brand-deep-green shadow-sm"
                      : "border-brand-gold/10 hover:border-brand-gold/40"
                  }`}
                >
                  <div className="relative aspect-[5/6] w-full overflow-hidden">
                    <Image
                      src={intent.imageUrl}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 20vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#2C4A3E]/85 via-[#2C4A3E]/15 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-4">
                      <h3 className="font-serif text-lg font-medium leading-tight text-[#FAF5EC] sm:text-xl">
                        {intent.label}
                      </h3>
                      <p className="mt-1.5 text-[13px] leading-snug text-[#FAF5EC]/80 line-clamp-2">
                        {intent.blurb}
                      </p>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
