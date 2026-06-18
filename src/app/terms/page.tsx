import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — JustLog",
};

export default function TermsPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#fafafa", fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif" }}>

      {/* Top nav */}
      <div style={{ background: "#fff", borderBottom: "1px solid #f0f0f0", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="#C831FF" fillOpacity="0.1"/>
              <path d="M17 6L7 18h9l-1 8 10-12h-9l1-8z" stroke="#C831FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#C831FF", letterSpacing: "-0.3px" }}>JustLog</span>
          </Link>
          <Link href="/privacy" style={{ fontSize: 13, fontWeight: 500, color: "#888", textDecoration: "none" }}>Privacy Policy →</Link>
        </div>
      </div>

      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, rgba(200,49,255,0.06) 0%, rgba(200,49,255,0.02) 100%)", borderBottom: "1px solid rgba(200,49,255,0.1)", padding: "48px 24px 40px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(200,49,255,0.08)", borderRadius: 20, padding: "4px 12px", marginBottom: 16 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#C831FF" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
            </svg>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#C831FF", letterSpacing: "0.04em" }}>TERMS OF SERVICE</span>
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: "#111", letterSpacing: "-0.8px", margin: "0 0 8px" }}>Simple, fair terms.</h1>
          <p style={{ fontSize: 16, color: "#666", margin: "0 0 16px", lineHeight: 1.6 }}>You own your data. We just help you log it.</p>
          <p style={{ fontSize: 13, color: "#aaa" }}>Last updated: June 18, 2025 · Effective: June 18, 2025</p>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "40px 24px 80px" }}>

        <Section>
          <p style={body}>These Terms of Service ("Terms") govern your use of JustLog, operated by Pavan Jaya ("we", "us", "our"), India. By creating an account or using the App, you agree to be bound by these Terms.</p>
        </Section>

        <Section title="1. What JustLog Is">
          <p style={body}>JustLog is a personal finance journal. It lets you log income and expenses by typing natural language, parsed using AI. JustLog is <b>not</b> a bank, payment processor, financial advisor, or investment platform. Nothing in the App constitutes financial, tax, investment, or legal advice.</p>
        </Section>

        <Section title="2. Eligibility">
          <List items={[
            "You must be at least 13 years old to use JustLog",
            "If you are under 18, your parent or legal guardian must have consented to these Terms",
            "You must provide accurate account information",
          ]} />
        </Section>

        <Section title="3. Your Account">
          <List items={[
            "You are responsible for keeping your credentials secure",
            "You are responsible for all activity under your account",
            "Notify us immediately at jangidpavan@gmail.com if you suspect unauthorised access",
            "We may suspend accounts that violate these Terms",
          ]} />
        </Section>

        <Section title="4. Acceptable Use">
          <p style={{ ...body, marginBottom: 10 }}>You agree not to:</p>
          <List items={[
            "Use the App for any unlawful purpose or in violation of Indian law",
            "Attempt to reverse engineer or extract source code",
            "Use automated tools to scrape data from the App",
            "Attempt to access other users' data",
            "Upload defamatory, obscene, or rights-violating content",
          ]} />
        </Section>

        <Section title="5. Subscription and Payments">
          <List items={[
            "Payments processed by Stripe — we never store your card details",
            "Subscriptions auto-renew unless cancelled before renewal date",
            "Cancel anytime from Settings — access continues until end of billing period",
            "Refund requests handled within 7 days of a charge — contact us",
            "Prices in INR, inclusive of applicable GST",
          ]} />
        </Section>

        <Section title="6. Your Data">
          <p style={body}>You own all the data you enter into JustLog. We claim no ownership over your financial journal entries. By using the App, you grant us a limited licence to store, process, and display your data solely to provide the service to you.</p>
          <p style={{ ...body, marginTop: 12 }}>You can export or delete your data at any time from Settings.</p>
        </Section>

        <Section title="7. AI Processing">
          <p style={body}>Text you type is sent to Anthropic's Claude API to parse transaction details. By using the App, you consent to this processing. AI-parsed details may not always be accurate — you are responsible for reviewing and correcting entries.</p>
        </Section>

        <Section title="8. Disclaimer of Warranties">
          <p style={body}>The App is provided "as is" without warranties of any kind. We do not warrant that the App will be uninterrupted, error-free, or that AI-parsed data will be accurate.</p>
        </Section>

        <Section title="9. Limitation of Liability">
          <p style={body}>To the maximum extent permitted by law, JustLog shall not be liable for indirect, incidental, or consequential damages. Our total liability shall not exceed the amount you paid us in the 3 months preceding the claim, or ₹500, whichever is higher.</p>
        </Section>

        <Section title="10. Governing Law">
          <p style={body}>These Terms are governed by the laws of India. Disputes shall be subject to the exclusive jurisdiction of courts in India.</p>
        </Section>

        <Section title="11. Contact">
          <p style={body}>For questions about these Terms, email <a href="mailto:jangidpavan@gmail.com" style={{ color: "#C831FF", textDecoration: "none", fontWeight: 500 }}>jangidpavan@gmail.com</a>.</p>
        </Section>

        {/* Footer */}
        <div style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <span style={{ fontSize: 13, color: "#bbb" }}>© 2025 JustLog</span>
          <div style={{ display: "flex", gap: 20 }}>
            <Link href="/privacy" style={{ fontSize: 13, color: "#888", textDecoration: "none" }}>Privacy Policy</Link>
            <Link href="/" style={{ fontSize: 13, color: "#C831FF", textDecoration: "none", fontWeight: 500 }}>Open App →</Link>
          </div>
        </div>

      </div>
    </div>
  );
}

const body: React.CSSProperties = { fontSize: 15, color: "#444", lineHeight: 1.7, margin: 0 };

function Section({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 36 }}>
      {title && <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111", letterSpacing: "-0.3px", margin: "0 0 14px" }}>{title}</h2>}
      {children}
    </div>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6 }}>
      {items.map((item) => <li key={item} style={{ fontSize: 14, color: "#555", lineHeight: 1.6 }}>{item}</li>)}
    </ul>
  );
}
