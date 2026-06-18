import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — JustLog",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Header */}
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium mb-10" style={{ color: "#C831FF" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Back to JustLog
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-sm text-gray-500">Last updated: June 18, 2025 · Effective: June 18, 2025</p>
        </div>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700 leading-relaxed">

          <section>
            <p>
              JustLog ("we", "us", or "our") is a personal finance journaling application operated by Pavan Jaya, India.
              This Privacy Policy explains how we collect, use, store, and protect your information when you use JustLog
              ("the App"). By using the App, you agree to the terms of this Policy.
            </p>
            <p className="mt-3">
              This Policy is published in compliance with the <strong>Information Technology Act, 2000</strong> and the{" "}
              <strong>Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011</strong> (SPDI Rules).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Information We Collect</h2>
            <h3 className="font-semibold text-gray-800 mb-2">1.1 Account Information</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Email address (used for sign-in)</li>
              <li>Name and profile photo (if you sign in via Google)</li>
            </ul>
            <h3 className="font-semibold text-gray-800 mt-4 mb-2">1.2 Financial Journal Data (Sensitive Personal Data)</h3>
            <p>
              Under the SPDI Rules, financial information constitutes sensitive personal data. We collect:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Transaction descriptions and amounts you manually type</li>
              <li>Transaction categories (e.g. Food, Salary, Transport)</li>
              <li>Dates and times of logged entries</li>
              <li>Space/workspace names you create</li>
            </ul>
            <p className="mt-3 text-sm bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <strong>Important:</strong> JustLog is a personal journal. We do not connect to your bank accounts, payment cards, or any financial institution. All data is entered manually by you.
            </p>
            <h3 className="font-semibold text-gray-800 mt-4 mb-2">1.3 Technical Data</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Device type and browser (for app compatibility)</li>
              <li>Usage analytics (page views, feature usage — anonymised)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>To provide and operate the JustLog service</li>
              <li>To process your text entries using AI (Claude by Anthropic) to parse transactions — your text is sent to Anthropic's API and is subject to their privacy policy</li>
              <li>To sync your data across devices via your account</li>
              <li>To send transactional emails (account confirmation, password reset)</li>
              <li>To improve the App based on anonymised usage patterns</li>
            </ul>
            <p className="mt-3">We do <strong>not</strong> sell, rent, or share your personal data with third parties for marketing purposes.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Data Storage and Security</h2>
            <p>Your data is stored on <strong>Supabase</strong> (hosted on AWS infrastructure). We implement the following security measures:</p>
            <ul className="list-disc pl-5 space-y-2 mt-3">
              <li><strong>Encryption in transit:</strong> All data is transmitted over HTTPS/TLS</li>
              <li><strong>Encryption at rest:</strong> Database storage is encrypted by Supabase/AWS</li>
              <li><strong>Row-level security:</strong> Your data is isolated — no other user can access your entries</li>
              <li><strong>Authentication:</strong> Secure token-based auth via Supabase Auth</li>
            </ul>
            <p className="mt-3">
              In accordance with SPDI Rule 8, we have implemented reasonable security practices and procedures commensurate with the sensitivity of the information held.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Third-Party Services</h2>
            <div className="space-y-3">
              <div className="border border-gray-100 rounded-lg p-4">
                <div className="font-semibold text-gray-800">Supabase</div>
                <div className="text-sm mt-1">Database, authentication, and storage. Your account and transaction data is stored here.</div>
              </div>
              <div className="border border-gray-100 rounded-lg p-4">
                <div className="font-semibold text-gray-800">Anthropic (Claude API)</div>
                <div className="text-sm mt-1">Parses your typed text into structured transactions. Text you enter is sent to Anthropic's API. Anthropic does not train on API data by default. <a href="https://www.anthropic.com/privacy" className="underline" style={{ color: "#C831FF" }} target="_blank" rel="noopener">Anthropic Privacy Policy</a></div>
              </div>
              <div className="border border-gray-100 rounded-lg p-4">
                <div className="font-semibold text-gray-800">Vercel</div>
                <div className="text-sm mt-1">App hosting and delivery. Processes request metadata (IP addresses, device info) for routing.</div>
              </div>
              <div className="border border-gray-100 rounded-lg p-4">
                <div className="font-semibold text-gray-800">Stripe (future)</div>
                <div className="text-sm mt-1">Payment processing for subscriptions. We never store your payment card details — Stripe handles this entirely.</div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Your Rights (SPDI Rules, IT Act)</h2>
            <p>As a user, you have the right to:</p>
            <ul className="list-disc pl-5 space-y-2 mt-3">
              <li><strong>Access:</strong> Request a copy of all data we hold about you</li>
              <li><strong>Correction:</strong> Correct inaccurate personal information</li>
              <li><strong>Deletion:</strong> Delete your account and all associated data permanently. You can do this from Settings → Manage Spaces → Clear All, or by emailing us</li>
              <li><strong>Withdraw consent:</strong> Stop using the App at any time. Deletion of your account constitutes withdrawal of consent</li>
              <li><strong>Grievance redressal:</strong> Contact our Grievance Officer (details below) for any privacy concerns</li>
            </ul>
            <p className="mt-3">
              We will respond to all requests within <strong>30 days</strong> as required under SPDI Rule 5(7).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Data Retention</h2>
            <p>
              We retain your data for as long as your account is active. If you delete your account, all personal data is permanently deleted within <strong>30 days</strong>.
              Anonymised, aggregated analytics data may be retained indefinitely.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Children's Privacy</h2>
            <p>
              JustLog is not intended for users under 13 years of age. We do not knowingly collect data from children. If you believe a child has provided us personal data, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of material changes via email or an in-app notice at least 7 days before the changes take effect.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Grievance Officer</h2>
            <p>
              In accordance with the Information Technology Act, 2000 and SPDI Rules, the name and contact details of the Grievance Officer are:
            </p>
            <div className="mt-3 border border-gray-100 rounded-lg p-4 space-y-1">
              <div><strong>Name:</strong> Pavan Jaya</div>
              <div><strong>Email:</strong> <a href="mailto:jangidpavan@gmail.com" style={{ color: "#C831FF" }}>jangidpavan@gmail.com</a></div>
              <div><strong>Address:</strong> India</div>
              <div><strong>Response time:</strong> Within 30 days of receiving the grievance</div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Contact Us</h2>
            <p>
              For any privacy-related questions, data requests, or concerns, email us at{" "}
              <a href="mailto:jangidpavan@gmail.com" style={{ color: "#C831FF" }}>jangidpavan@gmail.com</a>.
            </p>
          </section>

        </div>

        <div className="mt-12 pt-6 border-t border-gray-100 flex gap-4 text-sm" style={{ color: "#C831FF" }}>
          <Link href="/terms">Terms of Service</Link>
          <Link href="/">Back to App</Link>
        </div>
      </div>
    </div>
  );
}
