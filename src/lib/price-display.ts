/**
 * One way to show an event's price, whatever the source wrote.
 *
 * `price_info` is free text from ticket sites, Instagram captions and the
 * parser, so the live calendar showed "IDR 170,000 online / walk-in",
 * "Rp 194,174" (a converted figure with false precision) and "Rp 90K" side by
 * side. Everything a reader sees goes through `displayPrice`:
 *
 *   "IDR 170,000 online / walk-in"  → IDR 170k  · online / walk-in
 *   "IDR 194174"                    → IDR 195k  (odd converted amounts round to the nearest 5k)
 *   "Rp 300,000 - Rp 350,000"       → IDR 300-350k
 *   "Donation · Suggested Rp 100K"  → By donation · suggested IDR 100k
 *   "Free entry"                    → Free
 *   "20% OFF", "TBA", ""            → Check with the organiser
 *
 * The label never carries a raw string from the source, and the small-print
 * note never carries an unformatted amount. Parsing for the price filters
 * stays in `price-parser.ts`.
 */

export type PriceKind = "free" | "donation" | "amount" | "unknown";

export interface PriceDisplay {
  kind: PriceKind;
  /** The price slot: "IDR 170k", "IDR 100-150k", "Free", "By donation" or "Check with the organiser". */
  label: string;
  /** Small print after the label, e.g. "online / walk-in" or "cash only". Null when there is nothing worth adding. */
  note: string | null;
  /** The amounts behind an "amount" label, as shown (IDR rounded the same way), for structured data. */
  amount?: { min: number; max: number; currency: string };
}

export const CHECK_WITH_ORGANISER = "Check with the organiser";

const UNKNOWN: PriceDisplay = { kind: "unknown", label: CHECK_WITH_ORGANISER, note: null };

/** Below this an IDR "price" is a typo or a year ("Rp 1.2K", "2026"); above it, a slipped digit ("Rp 100M" for a class). */
const IDR_FLOOR = 5_000;
const IDR_CEILING = 80_000_000;
const NOTE_MAX = 48;

type Currency = "IDR" | "USD" | "AUD" | "EUR" | "GBP" | "SGD";

const CURRENCY_OF: Record<string, Currency> = {
  idr: "IDR",
  rp: "IDR",
  "rp.": "IDR",
  usd: "USD",
  us$: "USD",
  $: "USD",
  aud: "AUD",
  a$: "AUD",
  eur: "EUR",
  "€": "EUR",
  gbp: "GBP",
  "£": "GBP",
  sgd: "SGD",
};

const SUFFIX_FACTOR: Record<string, number> = {
  k: 1_000,
  rb: 1_000,
  ribu: 1_000,
  m: 1_000_000,
  jt: 1_000_000,
  juta: 1_000_000,
  mio: 1_000_000,
};

/**
 * A number with an optional currency before or after it and an optional
 * k/m suffix. The number is matched whole (no digit before or after it), and
 * a number followed by "%" is a discount, not a price.
 */
const AMOUNT_RE =
  /(IDR|Rp\.?|USD|US\$|AUD|A\$|EUR|GBP|SGD|\$|€|£)?\s?(?<![\d.,])(\d{1,3}(?:[.,]\d{3})+|\d+(?:[.,]\d{1,2})?)(?!\d)(?:\s?(k|rb|ribu|jt|juta|mio|m)\b)?(?!\s?%)(?:\s?(IDR|Rp|USD|AUD|EUR|GBP|SGD)\b)?/gi;

/** "100 - 150k", "180,000–200,000", "$100 to 150". */
const RANGE_JOIN = /^\s*(?:-|–|to)\s*$/i;

const DONATION =
  /\b(?:by\s+)?donations?\b|\bdonation[- ]based\b|\bdana[- ]based\b|\bpay\s+(?:what|as)\s+you\s+(?:feel|can|want|wish|like)\b/i;
/** "Free", "free entry", "free for kids" — but not "phone-free" or "gluten-free". */
const FREE = /(?<![\w-])(?:free|gratis)\b/i;
const APPROX =
  /\b(?:approx|approximately|around|about|circa)\b\s*(?:IDR|Rp|USD|\$)?\s*\d|~\s*(?:IDR|Rp|\$)?\s*\d|\d\s*(?:k|m)?\s*(?:IDR)?\s*\(?(?:approx|approximately)\b/i;
/** A pass or a bundle costs several visits; it is not the price of going once. */
const BUNDLE = /\b(?:pass(?:es)?|bundle|package|pack|class card|membership|\d+\s*(?:x|classes|sessions|visits))\b|\d+-(?:class|session|visit)/i;
/** An extra on top ("+80k for sauna", "Optional sauna +80,000"), not the price to get in. */
const ADDON = /^\s*(?:\+|optional\b|add[- ]?on\b|extra\b|plus\b)/i;
/** Words that say nothing a reader needs next to a price. */
const FILLER =
  /\b(?:per person|per pax|pp|pax|each|price|prices|ticket|tickets|entry|entrance|admission|fee|fees|cost|investment|energy exchange|exchange)\b/gi;
const ACRONYMS = /\b(kitas|kitap|ktp|wni|wna)\b/g;

interface Amount {
  value: number;
  currency: Currency;
}

interface Tier {
  text: string;
  amounts: Amount[];
  label: string;
  addon: boolean;
  bundle: boolean;
}

/** Split on `separator` only outside parentheses, so "(venue rate; confirm at door)" stays in one piece. */
function splitTop(text: string, separator: RegExp): string[] {
  const parts: string[] = [];
  const re = new RegExp(separator.source, separator.flags.includes("g") ? separator.flags : `${separator.flags}g`);
  let from = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m[0].length === 0) {
      re.lastIndex += 1;
      continue;
    }
    const before = text.slice(0, m.index);
    const depth = (before.match(/\(/g)?.length ?? 0) - (before.match(/\)/g)?.length ?? 0);
    if (depth > 0) continue;
    parts.push(text.slice(from, m.index));
    from = m.index + m[0].length;
  }
  parts.push(text.slice(from));
  return parts.map((p) => p.trim()).filter(Boolean);
}

function toNumber(raw: string): number {
  if (/^\d{1,3}(?:[.,]\d{3})+$/.test(raw)) return Number(raw.replace(/[.,]/g, ""));
  return Number(raw.replace(",", "."));
}

type Token = {
  start: number;
  end: number;
  num: number;
  grouped: boolean;
  suffix: string | null;
  currency: Currency | null;
  qualifies: boolean;
};

/** The prices in one tier of the text, with the spans they cover. */
function amountsIn(text: string, carry: { currency: Currency }): { amounts: Amount[]; spans: [number, number][] } {
  const tokens: Token[] = [];
  for (const m of text.matchAll(AMOUNT_RE)) {
    const [whole, pre, digits, suffix, post] = m;
    const currencyWord = (pre ?? post)?.toLowerCase().replace(/\s+/g, "");
    const currency = currencyWord ? (CURRENCY_OF[currencyWord] ?? null) : null;
    const grouped = /^\d{1,3}(?:[.,]\d{3})+$/.test(digits);
    const plainBig = /^\d{4,}$/.test(digits);
    tokens.push({
      start: m.index!,
      end: m.index! + whole.length,
      num: toNumber(digits),
      grouped,
      suffix: suffix ? suffix.toLowerCase() : null,
      currency,
      qualifies: !!currency || !!suffix || grouped || plainBig,
    });
  }

  // "100-150k" means 100k to 150k; "$100 - 150" means $100 to $150.
  for (let i = 0; i + 1 < tokens.length; i++) {
    const a = tokens[i];
    const b = tokens[i + 1];
    if (!RANGE_JOIN.test(text.slice(a.end, b.start))) continue;
    if (!a.suffix && !a.grouped && b.suffix && a.num < b.num) a.suffix = b.suffix;
    if (a.qualifies || b.qualifies) {
      a.qualifies = true;
      b.qualifies = true;
    }
    b.currency ??= a.currency;
    a.currency ??= b.currency;
  }

  const amounts: Amount[] = [];
  const spans: [number, number][] = [];
  for (const t of tokens) {
    if (!t.qualifies) continue;
    if (t.currency) carry.currency = t.currency;
    const currency = t.currency ?? carry.currency;
    const value = t.num * (t.suffix ? SUFFIX_FACTOR[t.suffix] : 1);
    spans.push([t.start, t.end]);
    if (!Number.isFinite(value)) continue;
    if (currency === "IDR" ? value < IDR_FLOOR || value > IDR_CEILING : value < 1 || value > 20_000) continue;
    amounts.push({ value, currency });
  }
  return { amounts, spans };
}

const trimPunct = (s: string) => s.replace(/^[\s:,;./|·–—-]+|[\s:,;./|·–—-]+$/g, "").trim();

/** What a tier says besides its price: "online", "(cash only)" → "cash only", "INVESTMENT" → "". */
function labelOf(text: string, spans: [number, number][]): string {
  let out = "";
  let at = 0;
  for (const [s, e] of spans) {
    out += `${text.slice(at, s)} `;
    at = e;
  }
  out += text.slice(at);
  let label = trimPunct(
    out
      .replace(/\b(?:IDR|Rp|USD|AUD|EUR|GBP|SGD)\b|[$€£~]/gi, " ")
      .replace(/\b(?:approx|approximately|around|about|circa)\b/gi, " ")
      .replace(FILLER, " ")
      .replace(/\(\s*\)/g, " ")
      .replace(/\s+/g, " ")
  );
  // A split can leave half a bracket behind; a leading "(local KITAS)" reads better unwrapped.
  if ((label.match(/\(/g)?.length ?? 0) !== (label.match(/\)/g)?.length ?? 0)) label = label.replace(/[()]/g, " ");
  label = label.replace(/^\(([^()]*)\)/, "$1");
  return trimPunct(label.replace(/\(\s+/g, "(").replace(/\s+\)/g, ")").replace(/\s+/g, " "));
}

function tiersOf(text: string): Tier[] {
  // "Min. spend", "approx. —", "Rp. 150.000": an abbreviation's full stop doesn't end a sentence.
  const normalised = text.replace(/\b(min|max|approx|incl|excl|rp|no|pp|ca|est)\.(\s)/gi, "$1$2");
  const carry: { currency: Currency } = { currency: "IDR" };
  const tiers: Tier[] = [];
  for (const clause of splitTop(normalised, /\s*[|;\n]\s*|\s+[·—]\s+|\.\s+(?=[A-Z0-9+])/)) {
    let inBundle = false;
    for (const part of splitTop(clause, /\s+\/\s+|,\s+/)) {
      const { amounts, spans } = amountsIn(part, carry);
      inBundle ||= BUNDLE.test(part);
      tiers.push({ text: part, amounts, label: labelOf(part, spans), addon: ADDON.test(part), bundle: inBundle });
    }
    // Mark where each clause ends, so a note only reads its own clause.
    tiers.push({ text: "", amounts: [], label: "", addon: false, bundle: false });
  }
  return tiers;
}

function trimNumber(n: number): string {
  return String(Math.round(n * 100) / 100);
}

/** "Rp 194,174" was a converted figure: round amounts that aren't whole thousands to the nearest 5k. */
function roundIdr(value: number): number {
  return value % 1000 === 0 ? value : Math.max(IDR_FLOOR, Math.round(value / 5000) * 5000);
}

function idrPart(value: number): { text: string; unit: "k" | "M" } {
  if (value >= 1_000_000) return { text: trimNumber(Math.round(value / 10_000) / 100), unit: "M" };
  return { text: String(Math.round(value / 1000)), unit: "k" };
}

/** "IDR 170k", "IDR 100-150k", "IDR 3.5M", "IDR 900k-1.1M", "USD 85", "USD 1,345". */
export function formatAmountRange(min: number, max: number, currency: Currency = "IDR"): string {
  if (currency !== "IDR") {
    const f = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 2 });
    return min === max ? `${currency} ${f(min)}` : `${currency} ${f(min)}-${f(max)}`;
  }
  const lo = idrPart(roundIdr(min));
  const hi = idrPart(roundIdr(max));
  if (lo.text === hi.text && lo.unit === hi.unit) return `IDR ${lo.text}${lo.unit}`;
  return lo.unit === hi.unit ? `IDR ${lo.text}-${hi.text}${hi.unit}` : `IDR ${lo.text}${lo.unit}-${hi.text}${hi.unit}`;
}

function cleanNote(parts: string[]): string | null {
  const seen = new Set<string>();
  const kept: string[] = [];
  for (const p of parts) {
    const t = p.toLowerCase().replace(ACRONYMS, (w) => w.toUpperCase()).trim();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    kept.push(t);
  }
  const note = kept.join(" / ");
  if (!note || note.length > NOTE_MAX) return null;
  // Small print never links out or carries an unformatted amount.
  if (/https?:|www\.|\.[a-z]{2,}\b|\d{4,}|\d[.,]\d{3}/i.test(note)) return null;
  // Readers shouldn't have to decode "min spend"; the data keeps whatever the source wrote.
  return note.replace(/\bmin\.?\s+spend\b/g, "minimum spend");
}

/** Resident rates ("IDR 150k · local KITAS / visitors") need one footnote per page. */
const RESIDENT_RATE = /\b(?:KITAS|KTP)\b/;
export const RESIDENT_PRICE_FOOTNOTE = "KITAS / KTP prices are for Indonesian residents.";

/** Does any price on the page mention a KITAS or KTP rate? Then the page shows `RESIDENT_PRICE_FOOTNOTE` once. */
export function mentionsResidentPrice(priceInfos: (string | null | undefined)[]): boolean {
  return priceInfos.some((p) => RESIDENT_RATE.test(displayPrice(p).note ?? ""));
}

export function displayPrice(priceInfo: string | null | undefined): PriceDisplay {
  const text = (priceInfo ?? "").replace(/\s+/g, " ").trim();
  if (!text) return UNKNOWN;

  const tiers = tiersOf(text);
  const withAmounts = tiers.filter((t) => t.amounts.length > 0 && !t.addon);
  const regular = withAmounts.filter((t) => !t.bundle);
  const priced = regular.length > 0 ? regular : withAmounts;

  // The first currency named wins: "IDR 1.5M (USD 95)" is shown in rupiah.
  const currency = priced[0]?.amounts[0]?.currency ?? "IDR";
  const values = priced.flatMap((t) => t.amounts.filter((a) => a.currency === currency).map((a) => a.value));
  const range = values.length > 0 ? formatAmountRange(Math.min(...values), Math.max(...values), currency) : null;

  if (DONATION.test(text)) {
    const note = range ? (/\bmin(?:imum)?\b|\bat least\b/i.test(text) ? `at least ${range}` : /\bsuggest/i.test(text) ? `suggested ${range}` : null) : null;
    return { kind: "donation", label: "By donation", note };
  }

  if (!range) {
    return FREE.test(text) ? { kind: "free", label: "Free", note: null } : UNKNOWN;
  }

  const label = APPROX.test(text) ? `About ${range}` : range;

  // One price: everything else its clause says ("online / walk-in"). Several
  // prices: their labels in order ("early bird / at the door"), but only when
  // each one has a label — otherwise the words would describe the wrong price.
  let noteParts: string[] = [];
  if (priced.length === 1) {
    const i = tiers.indexOf(priced[0]);
    let start = i;
    while (start > 0 && tiers[start - 1].text) start--;
    let end = i;
    while (end + 1 < tiers.length && tiers[end + 1].text) end++;
    noteParts = tiers.slice(start, end + 1).filter((t) => !t.addon && (!t.bundle || t === priced[0])).map((t) => t.label);
  } else if (priced.every((t) => t.label)) {
    noteParts = priced.map((t) => t.label);
  }

  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const amount = currency === "IDR" ? { min: roundIdr(lo), max: roundIdr(hi), currency } : { min: lo, max: hi, currency };
  return { kind: "amount", label, note: cleanNote(noteParts), amount };
}
