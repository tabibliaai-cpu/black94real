import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - Black94",
  description: "Black94 Privacy Policy. Learn how we collect, use, and protect your data.",
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#07060b] text-[#e8f0dc]">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-[#a3d977] mb-2">Privacy Policy</h1>
        <p className="text-[#94a3b8] text-sm mb-10">Last updated: April 25, 2026</p>

        <Section title="1. Introduction">
          <p>
            Welcome to Black94 (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;). We respect your privacy and are
            committed to protecting your personal data. This Privacy Policy explains how we
            collect, use, disclose, and safeguard your information when you use our mobile
            application and website (collectively, the &quot;Service&quot;).
          </p>
          <p>
            By downloading, installing, or using the Service, you agree to the collection and
            use of information in accordance with this Privacy Policy. If you do not agree with
            the terms of this Policy, please do not use the Service.
          </p>
        </Section>

        <Section title="2. Information We Collect">
          <p>We collect the following types of information to provide and improve our services:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Account Information:</strong> When you sign in with Google, we collect your
              display name, email address, and profile photo from your Google account. We do not
              collect your Google password.
            </li>
            <li>
              <strong>User-Provided Content:</strong> Any posts, comments, messages, photos, or
              other content you create and share within the Service.
            </li>
            <li>
              <strong>Profile Information:</strong> Display name, bio, and profile image that you
              choose to set within the Service.
            </li>
            <li>
              <strong>Usage Data:</strong> Information about how you use the Service, including
              features accessed, interactions, and time spent.
            </li>
            <li>
              <strong>Device Information:</strong> Device model, operating system version, unique
              device identifiers (for crash reporting and performance optimization only).
            </li>
          </ul>
        </Section>

        <Section title="3. How We Use Your Information">
          <p>We use the information we collect for the following purposes:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>To create and manage your account and authenticate your identity</li>
            <li>To provide, maintain, and improve the Service&apos;s features and functionality</li>
            <li>To enable you to create posts, send messages, and interact with other users</li>
            <li>To personalize your experience and deliver relevant content</li>
            <li>To send you notifications about activity related to your account</li>
            <li>To monitor and analyze usage patterns to improve the Service</li>
            <li>To detect, prevent, and address technical issues and security threats</li>
            <li>To comply with legal obligations</li>
          </ul>
        </Section>

        <Section title="4. Information Sharing and Disclosure">
          <p>
            We do not sell, trade, or rent your personal information to third parties. We may
            share your information in the following limited circumstances:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Public Content:</strong> Posts and comments you make public are visible to
              other users of the Service.
            </li>
            <li>
              <strong>Google Sign-In:</strong> We use Google&apos;s authentication service solely for
              account creation and login. Your Google credentials are processed by Google and
              are not stored on our servers.
            </li>
            <li>
              <strong>Firebase Services:</strong> We use Google Firebase for real-time database,
              authentication, and analytics. Your data is stored on Google&apos;s secure
              infrastructure.
            </li>
            <li>
              <strong>Legal Requirements:</strong> We may disclose information if required by law,
              regulation, or legal process.
            </li>
          </ul>
        </Section>

        <Section title="5. Data Storage and Security">
          <p>
            Your data is stored securely using Google Firebase (Firestore Database and Firebase
            Authentication). We implement appropriate technical and organizational measures to
            protect your personal data against unauthorized access, alteration, disclosure, or
            destruction. However, no method of transmission over the Internet or electronic
            storage is 100% secure, and we cannot guarantee absolute security.
          </p>
        </Section>

        <Section title="6. Your Rights and Choices">
          <p>You have the following rights regarding your personal data:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Access:</strong> You can view and update your profile information at any
              time from within the App&apos;s Settings screen.
            </li>
            <li>
              <strong>Deletion:</strong> You may request deletion of your account and associated
              data by contacting us at the email address provided below.
            </li>
            <li>
              <strong>Data Portability:</strong> Upon request, we can provide you with a copy of
              your personal data.
            </li>
            <li>
              <strong>Opt-Out:</strong> You may sign out and delete the App at any time. You can
              also revoke app permissions through your device settings.
            </li>
          </ul>
        </Section>

        <Section title="7. Children&apos;s Privacy">
          <p>
            The Service is not intended for use by children under the age of 13. We do not
            knowingly collect personal information from children under 13. If we become aware
            that we have collected data from a child under 13, we will take steps to delete
            that information promptly.
          </p>
        </Section>

        <Section title="8. Third-Party Services">
          <p>The Service integrates with the following third-party services:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Google Sign-In:</strong> For user authentication.</li>
            <li><strong>Firebase (Google):</strong> For database, authentication, and hosting.</li>
            <li><strong>Google Play Services:</strong> Required for app functionality on Android devices.</li>
          </ul>
        </Section>

        <Section title="9. Changes to This Privacy Policy">
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any
            changes by posting the new Privacy Policy on this page and updating the &quot;Last
            updated&quot; date. You are advised to review this Privacy Policy periodically for any
            changes.
          </p>
        </Section>

        <Section title="10. Contact Us">
          <p>If you have any questions, concerns, or requests regarding this Privacy Policy, please contact us at:</p>
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
