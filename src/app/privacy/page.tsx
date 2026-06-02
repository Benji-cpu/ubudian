import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/layout/page-hero";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How The Ubudian collects, uses, and protects your personal information.",
};

const LAST_UPDATED = "2 June 2026";
const CONTACT_EMAIL = "hello@theubudian.life";

export default function PrivacyPage() {
  return (
    <div>
      <PageHero
        variant="cream"
        title="Privacy Policy"
        subtitle={`Last updated: ${LAST_UPDATED}`}
      />

      <article className="mx-auto max-w-3xl space-y-12 px-4 py-16 sm:px-6">
        <Section title="Who we are">
          <p>
            The Ubudian (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;)
            is a community media platform for Ubud, Bali — events, stories,
            tours, and a weekly newsletter, published at{" "}
            <a
              href="https://theubudian.life"
              className="text-primary underline underline-offset-4 hover:text-primary/80"
            >
              theubudian.life
            </a>
            . This policy explains what personal information we collect when you
            use the site, how we use it, and the choices you have.
          </p>
        </Section>

        <Section title="Information we collect">
          <p>We only collect what we need to run the service:</p>
          <ul className="mt-4 list-disc space-y-3 pl-6">
            <li>
              <strong>Account information.</strong> If you sign in with Google,
              we receive your name, email address, and profile picture from your
              Google account. We do not see or store your Google password.
            </li>
            <li>
              <strong>Quiz responses.</strong> If you take the Ubud Spirit Quiz,
              we store your answers and the resulting archetype so we can
              personalise event recommendations for you.
            </li>
            <li>
              <strong>Saved events.</strong> Events you save are stored against
              your account so you can find them again.
            </li>
            <li>
              <strong>Newsletter subscription.</strong> If you subscribe, we
              store your email address to send you our weekly newsletter.
            </li>
            <li>
              <strong>Bookings and payments.</strong> If you book a tour or take
              out a membership, we record the booking and its status. Card
              payments are processed by Stripe — we never see or store your full
              card number.
            </li>
            <li>
              <strong>Submissions.</strong> If you submit an event, we keep the
              details you provide and a contact email so we can review and
              publish it.
            </li>
            <li>
              <strong>Technical data.</strong> Like most websites, our hosting
              provider logs basic technical information (such as IP address and
              browser type) for security and reliability.
            </li>
          </ul>
        </Section>

        <Section title="How we use your information">
          <ul className="list-disc space-y-3 pl-6">
            <li>To provide and personalise the service — including event recommendations based on your quiz archetype and saved events.</li>
            <li>To send you the weekly newsletter you signed up for.</li>
            <li>To process tour bookings and membership subscriptions.</li>
            <li>To review and publish events you submit.</li>
            <li>To keep the platform secure, prevent abuse, and fix problems.</li>
            <li>To respond to you when you get in touch.</li>
          </ul>
          <p className="mt-4">
            We do <strong>not</strong> sell your personal information, and we do
            not use it for advertising profiling.
          </p>
        </Section>

        <Section title="Services we share data with">
          <p>
            We use a small number of trusted providers to operate the platform.
            They only process your data on our behalf, for the purposes above:
          </p>
          <ul className="mt-4 list-disc space-y-3 pl-6">
            <li>
              <strong>Supabase</strong> — authentication, database, and file
              storage.
            </li>
            <li>
              <strong>Google</strong> — sign-in (OAuth), when you choose to use
              it.
            </li>
            <li>
              <strong>Stripe</strong> — payment processing for bookings and
              memberships.
            </li>
            <li>
              <strong>Beehiiv</strong> — newsletter delivery.
            </li>
            <li>
              <strong>Resend</strong> — transactional and notification emails.
            </li>
            <li>
              <strong>Vercel</strong> — website hosting and delivery.
            </li>
          </ul>
          <p className="mt-4">
            Some of these providers are based outside Indonesia, which means
            your information may be processed in other countries. We may also
            disclose information if required by law.
          </p>
        </Section>

        <Section title="Cookies">
          <p>
            We use cookies that are necessary for the site to work — chiefly to
            keep you signed in. We do not use third-party advertising cookies.
          </p>
        </Section>

        <Section title="How long we keep it">
          <p>
            We keep your information for as long as your account is active or as
            needed to provide the service. If you ask us to delete your account,
            we will remove your personal information, except where we are
            required to keep certain records (for example, payment records for
            accounting and legal reasons).
          </p>
        </Section>

        <Section title="Your choices and rights">
          <ul className="list-disc space-y-3 pl-6">
            <li>
              <strong>Newsletter.</strong> You can unsubscribe at any time using
              the link in any newsletter email.
            </li>
            <li>
              <strong>Access and deletion.</strong> You can ask us for a copy of
              the personal information we hold about you, or ask us to correct or
              delete it.
            </li>
            <li>
              <strong>Account.</strong> You can request that we close your
              account and remove your associated data.
            </li>
          </ul>
          <p className="mt-4">
            To make any of these requests, email us at{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-primary underline underline-offset-4 hover:text-primary/80"
            >
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </Section>

        <Section title="Children">
          <p>
            The Ubudian is intended for adults. We do not knowingly collect
            personal information from children under 16. If you believe a child
            has provided us with personal information, please contact us and we
            will delete it.
          </p>
        </Section>

        <Section title="Changes to this policy">
          <p>
            We may update this policy from time to time. When we do, we will
            revise the &ldquo;Last updated&rdquo; date at the top of this page.
          </p>
        </Section>

        <Section title="Contact us">
          <p>
            Questions about this policy or your data? Email{" "}
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
