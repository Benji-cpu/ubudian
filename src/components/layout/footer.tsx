import Link from "next/link";
import { NAV_LINKS, SITE_NAME } from "@/lib/constants";
import { NewsletterSignup } from "./newsletter-signup";

export function Footer() {
  return (
    <footer className="border-t border-brand-gold/15 bg-[#2C4A3E] dark:bg-[#1A1A1A]">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Title */}
        <div className="text-center">
          <h3 className="font-serif text-2xl font-normal text-brand-gold">
            {SITE_NAME}
          </h3>
          <p className="mt-2 text-sm text-brand-sage">
            The edgy, messy, transformative heart of Ubud
          </p>
        </div>

        {/* Navigation */}
        <nav className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="py-2 text-sm text-brand-off-white/70 transition-colors hover:text-brand-off-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Newsletter */}
        <div className="mx-auto mt-10 max-w-md text-center">
          <p className="text-sm text-brand-off-white/70">
            One email a week — ceremonies, workshops, sound journeys, and the stories worth reading.
          </p>
          <NewsletterSignup variant="dark" className="mt-4" />
        </div>

        {/* Social / Info */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
          <a
            href="https://instagram.com/theubudian"
            target="_blank"
            rel="noopener noreferrer"
            className="py-2 text-sm text-brand-cream/60 transition-colors hover:text-brand-gold"
          >
            Instagram
          </a>
          <Link
            href="/about"
            className="py-2 text-sm text-brand-cream/60 transition-colors hover:text-brand-gold"
          >
            About &amp; Contact
          </Link>
        </div>

        {/* Copyright */}
        <div className="mt-10 text-center text-sm text-brand-cream/50">
          &copy; {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
