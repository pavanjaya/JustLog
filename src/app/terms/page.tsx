import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — JustLog",
};

export default function TermsPage() {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
          <p className="text-sm text-gray-500">Last updated: June 18, 2025 · Effective: June 18, 2025</p>
        </div>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700 leading-relaxed">

          <section>
            <p>
              These Terms of Service ("Terms") govern your use of JustLog, a personal finance journaling application
              ("the App") operated by Pavan Jaya ("we", "us", "our"), India. By creating an account or using the App,
              you agree to be bound by these Terms.
            </p>
            <p className="mt-3">
              If you do not agree with any part of these Terms, you must not use the App.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. What JustLog Is</h2>
            <p>
              JustLog is a personal finance journal. It lets you log income and expenses by typing natural language,
              which is parsed using AI. JustLog is <strong>not</strong> a bank, payment processor, financial advisor,
              or investment platform. It does not connect to any financial institution on your behalf.
            </p>
            <p className="mt-3">
              Nothing in the App constitutes financial, tax, investment, or legal advice.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Eligibility</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>You must be at least 13 years old to use JustLog</li>
              <li>If you are under 18, you represent that your parent or legal guardian has consented to these Terms</li>
              <li>You must provide accurate account information</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Your Account</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>You are responsible for keeping your account credentials secure</li>
              <li>You are responsible for all activity that occurs under your account</li>
              <li>Notify us immediately at <a href="mailto:jangidpavan@gmail.com" style={{ color: "#C831FF" }}>jangidpavan@gmail.com</a> if you suspect unauthorised access</li>
              <li>We reserve the right to suspend or terminate accounts that violate these Terms</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 space-y-2 mt-3">
              <li>Use the App for any unlawful purpose or in violation of any Indian law</li>
              <li>Attempt to reverse engineer, decompile, or extract source code</li>
              <li>Use automated tools to scrape or extract data from the App</li>
              <li>Attempt to gain unauthorised access to other users' data</li>
              <li>Use the App to store data belonging to other people without their consent</li>
              <li>Upload content that is defamatory, obscene, or violates any third-party rights</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Subscription and Payments</h2>
            <p>
              JustLog may offer paid subscription plans. If you subscribe:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-3">
              <li>Payments are processed by Stripe. We do not store your payment card details</li>
              <li>Subscriptions auto-renew unless cancelled before the renewal date</li>
              <li>You can cancel at any time from Settings. Access continues until the end of the billing period</li>
              <li>Refunds are handled on a case-by-case basis — contact us within 7 days of a charge</li>
              <li>Prices are in INR and inclusive of applicable GST</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Your Data</h2>
            <p>
              You own all the data you enter into JustLog. We do not claim any ownership over your financial journal entries.
              By using the App, you grant us a limited licence to store, process, and display your data solely for the
              purpose of providing the service to you.
            </p>
            <p className="mt-3">
              You can export or delete your data at any time from Settings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. AI Processing</h2>
            <p>
              Text you type in JustLog is sent to Anthropic's Claude API to parse transaction details. By using the App,
              you consent to this processing. Anthropic's use of this data is governed by their{" "}
              <a href="https://www.anthropic.com/privacy" style={{ color: "#C831FF" }} target="_blank" rel="noopener">Privacy Policy</a>.
            </p>
            <p className="mt-3">
              AI-parsed transaction details (amount, category, description) may not always be accurate.
              You are responsible for reviewing and correcting entries.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Disclaimer of Warranties</h2>
            <p>
              The App is provided "as is" and "as available" without warranties of any kind, express or implied.
              We do not warrant that:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-3">
              <li>The App will be uninterrupted, error-free, or secure</li>
              <li>AI-parsed data will be accurate or complete</li>
              <li>The App will meet your specific requirements</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, JustLog and its operators shall not be liable for any indirect,
              incidental, special, consequential, or punitive damages, including loss of data, financial loss, or loss
              of profits arising from your use of the App.
            </p>
            <p className="mt-3">
              Our total liability to you for any claim shall not exceed the amount you paid us in the 3 months
              preceding the claim, or ₹500, whichever is higher.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Termination</h2>
            <p>
              You may stop using the App and delete your account at any time from Settings.
              We may suspend or terminate your account if you violate these Terms, with or without notice.
              Upon termination, your right to use the App ceases and your data will be deleted within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Governing Law & Dispute Resolution</h2>
            <p>
              These Terms are governed by the laws of India. Any disputes arising out of or relating to these Terms
              shall be subject to the exclusive jurisdiction of the courts of India. We encourage you to contact us
              first to resolve any disputes amicably.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">12. Changes to Terms</h2>
            <p>
              We may revise these Terms at any time. We will notify you of material changes via email or an in-app
              notice at least 7 days before the new Terms take effect. Continued use of the App after changes
              constitutes acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">13. Contact</h2>
            <p>
              For questions about these Terms, contact us at{" "}
              <a href="mailto:jangidpavan@gmail.com" style={{ color: "#C831FF" }}>jangidpavan@gmail.com</a>.
            </p>
          </section>

        </div>

        <div className="mt-12 pt-6 border-t border-gray-100 flex gap-4 text-sm" style={{ color: "#C831FF" }}>
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/">Back to App</Link>
        </div>
      </div>
    </div>
  );
}
