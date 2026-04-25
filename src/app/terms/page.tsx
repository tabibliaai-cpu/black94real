import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service - Black94",
  description: "Black94 Terms of Service. Please read these terms carefully before using our service.",
};

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-[#07060b] text-[#e8f0dc]">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-[#a3d977] mb-2">Terms of Service</h1>
        <p className="text-[#94a3b8] text-sm mb-10">Last updated: April 25, 2026</p>

        <Section title="1. Acceptance of Terms">
          <p>
            By downloading, installing, or using the Black94 mobile application and website
            (collectively, the &quot;Service&quot;), you agree to be bound by these Terms of Service
            (&quot;Terms&quot;). If you do not agree to these Terms, please do not use the Service.
            These Terms constitute a legally binding agreement between you and Black94.
          </p>
        </Section>

        <Section title="2. Description of Service">
          <p>
            Black94 is a social media platform that allows users to create profiles, post
            content, send messages, follow other users, and interact with a community. The
            Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind.
          </p>
        </Section>

        <Section title="3. User Accounts">
          <ul className="list-disc pl-6 space-y-2">
            <li>
              You must sign in using a Google account to use the Service. You are responsible
              for maintaining the confidentiality of your Google account credentials.
            </li>
            <li>
              You must be at least 13 years old to create an account and use the Service.
            </li>
            <li>
              You agree to provide accurate, current, and complete information during
              registration and to keep your profile information up to date.
            </li>
            <li>
              You are responsible for all activities that occur under your account.
            </li>
          </ul>
        </Section>

        <Section title="4. User Content">
          <p>
            You retain ownership of the content you post on Black94. However, by posting
            content, you grant Black94 a worldwide, non-exclusive, royalty-free license to use,
            reproduce, and distribute your content within the Service for the purpose of
            operating and improving the platform.
          </p>
          <p>You agree not to post content that:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Is unlawful, harmful, threatening, abusive, or harassing</li>
            <li>Contains hate speech or promotes discrimination</li>
            <li>Infringes on the intellectual property rights of others</li>
            <li>Contains false, misleading, or deceptive information</li>
            <li>Promotes illegal activities or violates any applicable law</li>
            <li>Contains malware, viruses, or harmful code</li>
            <li>Is spam or unsolicited advertising</li>
          </ul>
        </Section>

        <Section title="5. Acceptable Use">
          <p>You agree to use the Service in a manner that:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Complies with all applicable laws and regulations</li>
            <li>Respects the rights and privacy of other users</li>
            <li>Does not interfere with or disrupt the Service</li>
            <li>Does not attempt to gain unauthorized access to any part of the Service</li>
            <li>Does not use automated tools or bots without prior permission</li>
          </ul>
        </Section>

        <Section title="6. Privacy">
          <p>
            Your use of the Service is also governed by our{" "}
            <a href="/privacy-policy" className="text-[#a3d977] hover:underline">
              Privacy Policy
            </a>
            , which describes how we collect, use, and protect your personal information. By
            using the Service, you consent to the collection and use of your information as
            described in the Privacy Policy.
          </p>
        </Section>

        <Section title="7. Termination">
          <p>
            We reserve the right to suspend or terminate your account at any time, with or
            without cause, and with or without notice. Upon termination, your right to use the
            Service will immediately cease. Provisions that by their nature should survive
            termination shall remain in effect.
          </p>
        </Section>

        <Section title="8. Disclaimers">
          <p>
            THE SERVICE IS PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; BASIS. TO THE FULLEST
            EXTENT PERMITTED BY LAW, BLACK94 DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED,
            INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
            PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL
            BE UNINTERRUPTED, ERROR-FREE, OR SECURE.
          </p>
        </Section>

        <Section title="9. Limitation of Liability">
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, BLACK94 SHALL NOT BE LIABLE FOR ANY
            INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF
            PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA,
            USE, GOODWILL, OR OTHER INTANGIBLE LOSSES RESULTING FROM YOUR USE OF THE SERVICE.
          </p>
        </Section>

        <Section title="10. Changes to Terms">
          <p>
            We reserve the right to modify or replace these Terms at any time at our sole
            discretion. We will provide notice of significant changes by posting the updated
            Terms on this page with a new &quot;Last updated&quot; date. Your continued use of the
            Service after any such changes constitutes your acceptance of the new Terms.
          </p>
        </Section>

        <Section title="11. Governing Law">
          <p>
            These Terms shall be governed by and construed in accordance with applicable laws,
            without regard to conflict of law principles. Any disputes arising from these
            Terms or the Service shall be resolved through good-faith negotiation or, if
            necessary, through binding arbitration.
          </p>
        </Section>

        <Section title="12. Contact Us">
          <p>
            If you have any questions about these Terms, please contact us at:
          </p>
          <div className="mt-4 rounded-xl border border-[#1e293b] bg-[#111827] p-5">
            <p>
              <strong>Email:</strong>{" "}
              <a href="mailto:contact@black94.app" className="text-[#a3d977] hover:underline">
                contact@black94.app
              </a>
            </p>
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10 border-b border-[#1e293b] pb-8">
      <h2 className="text-xl font-semibold text-[#a3d977] mb-4">{title}</h2>
      <div className="space-y-3 text-[#cbd5e1] text-[15px] leading-relaxed">{children}</div>
    </section>
  );
}
