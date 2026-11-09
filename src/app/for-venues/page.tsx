import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getReaderNumbers, READER_WINDOW_DAYS, type ReaderNumbers } from "@/lib/venue/reader-numbers";
import { SITE_URL } from "@/lib/constants";

// The numbers are counted on every visit; a cached copy would show old ones.
export const dynamic = "force-dynamic";

const CONTACT_EMAIL = "theubudianlife@gmail.com";

export const metadata: Metadata = {
  title: "For venues: list your deal for free",
  description:
    "A free listing for a real saving at your Ubud café, spa, studio or class. Live reader numbers, no commission, stop any time. In English and Bahasa Indonesia.",
  alternates: { canonical: `${SITE_URL}/for-venues` },
};

interface Copy {
  lang: "en" | "id";
  eyebrow: string;
  title: string;
  lead: string;
  numbersTitle: string;
  numbersNote: string;
  subscribers: (n: number) => string;
  deals: (deals: number, places: number) => string;
  readers: (n: number) => string;
  readersNote: string;
  updated: (date: string) => string;
  howTitle: string;
  how: string[];
  ruleTitle: string;
  rule: string;
  button: string;
  afterButton: string;
  questions: string;
}

const EN: Copy = {
  lang: "en",
  eyebrow: "For venues",
  title: "List your deal on The Ubudian. Free.",
  lead: "A free listing for a real saving, seen by people looking for food and wellness in Ubud.",
  numbersTitle: "Our readers, counted live",
  numbersNote: "Counted from our database each time this page opens. Never rounded, never estimated.",
  subscribers: (n) => (n === 1 ? "person is subscribed to our weekly email" : "people are subscribed to our weekly email"),
  deals: (d, p) => `${d === 1 ? "deal is" : "deals are"} live right now, at ${p} ${p === 1 ? "place" : "places"}`,
  readers: (n) =>
    `${n === 1 ? "reader" : "readers"} tapped an event’s ticket link or “I’m interested” button in the last ${READER_WINDOW_DAYS} days`,
  readersNote: "Counted once per phone or computer.",
  updated: (date) => `Last updated ${date}`,
  howTitle: "How it works",
  how: [
    "Guests mention The Ubudian or show the deal page when they book or order. You decide who qualifies.",
    "No codes, no app, no contract, no commission. You can stop any time.",
    "We feature new deals in a Friday Instagram post and tag you.",
    "We check the deal with you every 30 days.",
  ],
  ruleTitle: "The rule",
  rule: "At least 25% off your normal price for food and café deals, or at least 20% off for classes, spas and studios, or a free item with a purchase. No drink deals.",
  button: "Add your deal",
  afterButton: "We check new deals every night. Most are live by the next morning.",
  questions: "Questions? Email",
};

const ID: Copy = {
  lang: "id",
  eyebrow: "Untuk tempat usaha",
  title: "Pasang promo Anda di The Ubudian. Gratis.",
  lead: "Promo Anda tampil gratis dan dilihat orang yang sedang mencari makanan dan wellness di Ubud. Syaratnya satu: hematnya harus nyata.",
  numbersTitle: "Pembaca kami, dihitung langsung",
  numbersNote: "Dihitung dari database kami setiap kali halaman ini dibuka. Tidak dibulatkan, tidak diperkirakan.",
  subscribers: () => "orang berlangganan email mingguan kami",
  deals: (_d, p) => `promo sedang aktif, di ${p} tempat`,
  readers: () => `pembaca mengklik link tiket atau tombol “I’m interested” di halaman acara dalam ${READER_WINDOW_DAYS} hari terakhir`,
  readersNote: "Dihitung satu kali per HP atau komputer.",
  updated: (date) => `Terakhir diperbarui ${date}`,
  howTitle: "Cara kerjanya",
  how: [
    "Tamu cukup menyebut The Ubudian atau menunjukkan halaman promo saat memesan. Anda yang menentukan siapa yang berhak.",
    "Tanpa kode, tanpa aplikasi, tanpa kontrak, tanpa komisi. Bisa berhenti kapan saja.",
    "Promo baru kami tampilkan di postingan Instagram setiap Jumat, dan akun Anda kami tag.",
    "Setiap 30 hari kami cek lagi promonya bersama Anda.",
  ],
  ruleTitle: "Syaratnya",
  rule: "Promo diskon minimal 25% untuk makanan, atau minimal 20% untuk kelas, spa dan studio, atau gratis satu item dengan pembelian. Bukan promo minuman.",
  button: "Tambahkan promo Anda",
  afterButton: "Formulirnya singkat, dalam bahasa Inggris. Kami cek promo baru setiap malam, biasanya sudah tayang besok paginya.",
  questions: "Ada pertanyaan? Email ke",
};

function baliDate(iso: string, lang: Copy["lang"]): string {
  return new Intl.DateTimeFormat(lang === "id" ? "id-ID" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Makassar",
  }).format(new Date(iso));
}

const fmt = (n: number) => n.toLocaleString("en-US");

function Numbers({ copy, numbers }: { copy: Copy; numbers: ReaderNumbers }) {
  const updated = copy.updated(baliDate(numbers.countedAt, copy.lang));
  const lines: { value: number; label: string; note?: string }[] = [];
  if (numbers.subscribers !== null) lines.push({ value: numbers.subscribers, label: copy.subscribers(numbers.subscribers) });
  if (numbers.deals !== null) lines.push({ value: numbers.deals.deals, label: copy.deals(numbers.deals.deals, numbers.deals.places) });
  if (numbers.readers !== null) lines.push({ value: numbers.readers, label: copy.readers(numbers.readers), note: copy.readersNote });
  // A count we couldn't read is left out, never shown as 0 or guessed.
  if (lines.length === 0) return null;

  return (
    <div className="rounded-2xl border border-brand-gold/25 bg-card p-6 shadow-sm sm:p-8">
      <h2 className="font-serif text-2xl text-brand-deep-green dark:text-brand-gold">{copy.numbersTitle}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{copy.numbersNote}</p>
      <dl className="mt-6 space-y-6">
        {lines.map((l) => (
          <div key={l.label} className="flex items-baseline gap-4">
            <dt className="w-20 shrink-0 text-right font-serif text-4xl font-medium text-brand-terracotta sm:w-24 sm:text-5xl">{fmt(l.value)}</dt>
            <dd className="min-w-0">
              <p className="text-foreground">{l.label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {l.note ? `${l.note} ` : ""}
                {updated}
              </p>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function Half({ copy, numbers, id, first }: { copy: Copy; numbers: ReaderNumbers; id?: string; first?: boolean }) {
  const Title = first ? "h1" : "h2";
  return (
    <section id={id} lang={copy.lang} className="mx-auto max-w-2xl scroll-mt-20 space-y-8 px-4 py-12 sm:px-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-terracotta">{copy.eyebrow}</p>
        <Title className="mt-2 font-serif text-3xl font-medium tracking-tight text-brand-deep-green dark:text-brand-gold sm:text-4xl">
          {copy.title}
        </Title>
        <p className="mt-3 text-lg text-muted-foreground">{copy.lead}</p>
      </div>

      <Numbers copy={copy} numbers={numbers} />

      <div>
        <h3 className="font-serif text-xl text-brand-deep-green dark:text-brand-gold">{copy.howTitle}</h3>
        <ul className="mt-4 space-y-3">
          {copy.how.map((line) => (
            <li key={line} className="flex gap-3">
              <Check className="mt-1 h-4 w-4 shrink-0 text-brand-gold" aria-hidden />
              <span className="text-foreground">{line}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl bg-brand-pale-green p-5">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-brand-deep-green dark:text-brand-gold">{copy.ruleTitle}</h3>
        <p className="mt-1 text-lg font-medium text-foreground">{copy.rule}</p>
      </div>

      <div className="text-center">
        <Button asChild size="lg">
          <Link href="/tonight/add">{copy.button}</Link>
        </Button>
        <p className="mt-3 text-sm text-muted-foreground">{copy.afterButton}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {copy.questions}{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-brand-deep-green underline underline-offset-4 dark:text-brand-gold">
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </div>
    </section>
  );
}

/**
 * /for-venues: one page to send a venue owner who asks "how many readers do
 * you have?". English first, the same again in Indonesian below. Every number
 * is read from the database when the page opens; nothing here is typed by hand.
 */
export default async function ForVenuesPage() {
  const numbers = await getReaderNumbers();

  return (
    <div>
      <div className="bg-brand-cream dark:bg-transparent">
        <div className="mx-auto flex max-w-2xl justify-end px-4 pt-6 sm:px-6">
          <a
            href="#bahasa-indonesia"
            lang="id"
            className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-brand-deep-green underline-offset-4 hover:underline dark:text-brand-gold"
          >
            Bahasa Indonesia
            <ArrowDown className="h-4 w-4" aria-hidden />
          </a>
        </div>
        <Half copy={EN} numbers={numbers} first />
      </div>
      <div className="border-t border-brand-gold/20">
        <Half copy={ID} numbers={numbers} id="bahasa-indonesia" />
      </div>
    </div>
  );
}
