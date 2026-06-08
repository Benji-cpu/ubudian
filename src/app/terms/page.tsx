import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/layout/page-hero";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms that govern your use of The Ubudian — events, stories, tours, and newsletter.",
};

const LAST_UPDATED = "8 June 2026";
const CONTACT_EMAIL = "mystechcards@gmail.com";

export default function TermsPage() {
  return (
    <div>
      <PageHero
        variant="cream"
        title="Terms of Service"
        subtitle={`Last updated: ${LAST_UPDATED}`}
      />

      <article className="mx-auto max-w-3xl space-y-12 px-4 py-16 sm:px-6">
        <Section title="1. Agreement">
          <p>
            These Terms of Service (&ldquo;Terms&rdquo;) govern your use of The
            Ubudian (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;), a
            community media platform for Ubud, Bali, available at{" "}
            <a
              href="https://theubudian.life"
              className="text-primary underline underline-offset-4 hover:text-primary/80"
            >
              theubudian.life
            </a>
            . By accessing or using the site, you agree to these Terms. If you
            do not agree, please do not use the service.
          </p>
        </Section>

        <Section title="2. What we provide">
          <p>
            The Ubudian aggregates and publishes information about events,
            workshops, ceremonies, tours, and stories in and around Ubud, along
            with a weekly newsletter. Much of this information comes from
            third-party organisers and public sources. We curate and review
            submissions, but we do not organise or run most of the events listed
            and cannot guarantee that every detail (time, price, location, or
            availability) is accurate or current.
          </p>
        </Section>

        <Section title="3. Your account">
          <p>
            Some features require an account, which you can create by signing in
            with Google. You are responsible for activity under your account and
            for keeping your access secure. You must be at least 16 years old to
            create an account. You can ask us to close your account at any time
            (see our{" "}
            <Link
              href="/privacy"
              className="text-primary underline underline-offset-4 hover:text-primary/80"
            >
              Privacy Policy
            </Link>
            ).
          </p>
        </Section>

        <Section title="4. Submitting events and content">
          <p>
            If you submit an event or other content, you confirm that you have
            the right to share it and that it is accurate and not misleading. You
            grant us a non-exclusive, royalty-free licence to display, edit for
            clarity, and distribute that content across the platform and
            newsletter. We may review, decline, edit, or remove any submission at
            our discretion. Do not submit content that is unlawful, harmful,
            deceptive, infringing, or that promotes multi-level marketing, scams,
            or harassment.
          </p>
        </Section>

        <Section title="5. Third-party events, tours, and bookings">
          <p>
            Events and many tours listed on The Ubudian are operated by
            independent third parties. Your participation is a matter between you
            and the organiser, and is subject to their own terms, pricing, and
            cancellation policies. We are not responsible for the conduct,
            safety, quality, or cancellation of third-party events, and we make
            no warranties about them.
          </p>
          <p>
            Where you book or pay through the platform, payments are processed by
            Stripe. Refunds and cancellations for bookings follow the relevant
            operator&rsquo;s policy unless stated otherwise at the point of
            purchase.
          </p>
        </Section>

        <Section title="6. Memberships and payments">
          <p>
            Paid memberships, where offered, renew automatically until cancelled.
            You can cancel at any time, and cancellation takes effect at the end
            of the current billing period. Fees already paid are non-refundable
            except where required by law. All amounts are processed securely
            through Stripe; we do not store your card details.
          </p>
        </Section>

        <Section title="7. Acceptable use">
          <ul className="list-disc space-y-3 pl-6">
            <li>Do not misuse, disrupt, or attempt to gain unauthorised access to the service.</li>
            <li>Do not scrape, copy, or republish our content at scale without permission.</li>
            <li>Do not impersonate others or submit false information.</li>
            <li>Do not use the platform for any unlawful purpose.</li>
          </ul>
        </Section>

        <Section title="8. Intellectual property">
          <p>
            The Ubudian name, branding, design, and original editorial content
            are owned by us or our licensors. Content submitted by organisers and
            community members remains theirs, licensed to us as described above.
            You may not use our branding without permission.
          </p>
        </Section>

        <Section title="9. Disclaimers">
          <p>
            The service is provided &ldquo;as is&rdquo; and &ldquo;as
            available&rdquo;, without warranties of any kind. We do not warrant
            that listings are accurate, complete, or uninterrupted. Always
            confirm details directly with the organiser before relying on them.
          </p>
        </Section>

        <Section title="10. Limitation of liability">
          <p>
            To the fullest extent permitted by law, The Ubudian and its team will
            not be liable for any indirect, incidental, or consequential damages,
            or for any loss arising from your attendance at or booking of any
            event or tour listed on the platform. Nothing in these Terms limits
            liability that cannot be limited under applicable law.
          </p>
        </Section>

        <Section title="11. Changes to these Terms">
          <p>
            We may update these Terms from time to time. When we do, we will
            revise the &ldquo;Last updated&rdquo; date above. Continued use of
            the service after changes means you accept the updated Terms.
          </p>
        </Section>

        <Section title="12. Governing law">
          <p>
            These Terms are governed by the laws of the Republic of Indonesia,
            without regard to conflict-of-law principles.
          </p>
        </Section>

        <Section title="13. Contact">
          <p>
            Questions about these Terms? Email{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-primary underline underline-offset-4 hover:text-primary/80"
            >
              {CONTACT_EMAIL}
            </a>{" "}
            or visit our{" "}
            <Link
              href="/about"
              className="text-primary underline underline-offset-4 hover:text-primary/80"
            >
              About &amp; Contact
            </Link>{" "}
            page.
          </p>
        </Section>
      </article>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="font-serif text-2xl font-bold text-brand-deep-green dark:text-brand-off-white">
        {title}
      </h2>
      <div className="mt-4 space-y-4 leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}
