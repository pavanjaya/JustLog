import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — JustLog",
};

export default function PrivacyPage() {
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
          <Link href="/terms" style={{ fontSize: 13, fontWeight: 500, color: "#888", textDecoration: "none" }}>Terms of Service →</Link>
        </div>
      </div>

      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, rgba(200,49,255,0.06) 0%, rgba(200,49,255,0.02) 100%)", borderBottom: "1px solid rgba(200,49,255,0.1)", padding: "48px 24px 40px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(200,49,255,0.08)", borderRadius: 20, padding: "4px 12px", marginBottom: 16 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#C831FF" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#C831FF", letterSpacing: "0.04em" }}>PRIVACY POLICY</span>
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: "#111", letterSpacing: "-0.8px", margin: "0 0 8px" }}>Your privacy matters.</h1>
          <p style={{ fontSize: 16, color: "#666", margin: "0 0 16px", lineHeight: 1.6 }}>We keep your financial data private, secure, and fully under your control.</p>
          <p style={{ fontSize: 13, color: "#aaa" }}>Last updated: June 23, 2025 · Effective: June 23, 2025</p>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "40px 24px 80px" }}>

        <Section>
          <p style={body}>JustLog ("we", "us", or "our") is a personal finance journaling application operated by Pavan Jaya, India. This Privacy Policy explains how we collect, use, store, and protect your information. By using the App, you agree to the terms of this Policy.</p>
          <p style={{ ...body, marginTop: 12 }}>This Policy is published in compliance with the <b>Information Technology Act, 2000</b> and the <b>IT (SPDI) Rules, 2011</b>.</p>
        </Section>

        <Section title="1. Information We Collect">
          <Sub>1.1 Account Information</Sub>
          <List items={["Email address (used for sign-in)", "Name and profile photo (if you sign in via Google)"]} />
          <Sub>1.2 Financial Journal Data (Sensitive Personal Data)</Sub>
          <Note>JustLog is a personal journal. We do not connect to your bank accounts, payment cards, or any financial institution. All data is entered manually by you.</Note>
          <List items={["Transaction descriptions and amounts you manually type", "Transaction categories (e.g. Food, Salary, Transport)", "Dates and times of logged entries", "Space/workspace names you create"]} />
          <Sub>1.3 Technical Data</Sub>
          <List items={["Device type and browser (for app compatibility)"]} />
        </Section>

        <Section title="2. How We Use Your Information">
          <List items={[
            "To provide and operate the JustLog service",
            "To process your text using AI (Google Gemini) to parse transactions — your input text is sent to Google's API momentarily and is not stored or used for training",
            "To sync your data across devices",
            "To send transactional emails (account confirmation, password reset)",
            "To improve the App based on anonymised usage patterns",
          ]} />
          <p style={{ ...body, marginTop: 12 }}>We do <b>not</b> sell, rent, or share your personal data with third parties for marketing purposes.</p>
        </Section>

        <Section title="3. Data Storage and Security">
          <p style={body}>Your data is stored on <b>Supabase</b> (AWS infrastructure). Security measures include:</p>
          <List items={[
            "Encryption in transit: All data transmitted over HTTPS/TLS",
            "Encryption at rest: Database storage encrypted by Supabase/AWS",
            "Row-level security: Your data is isolated — no other user can access your entries",
            "Secure token-based authentication via Supabase Auth",
          ]} />
        </Section>

        <Section title="4. Third-Party Services">
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
            {[
              { name: "Supabase", desc: "Database, authentication, and storage. Your account and transaction data is stored here." },
              { name: "Google Gemini API", desc: "Parses your typed text into structured transactions. Your input is sent to Google's API momentarily. Google does not use API data for model training by default." },
              { name: "Razorpay", desc: "Payment processing for subscriptions (India). We never store your payment card details — all payment data is handled securely by Razorpay." },
              { name: "Stripe", desc: "Payment processing for international subscriptions. We never store your payment card details." },
              { name: "Vercel", desc: "App hosting and delivery. Processes request metadata for routing." },
            ].map(({ name, desc }) => (
              <div key={name} style={{ background: "#fff", border: "1px solid #f0f0f0", borderRadius: 12, padding: "14px 16px" }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#111", marginBottom: 4 }}>{name}</div>
                <div style={{ fontSize: 13, color: "#666", lineHeight: 1.5 }}>{desc}</div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="5. Your Rights">
          <List items={[
            "Access: Request a copy of all data we hold about you",
            "Correction: Correct inaccurate personal information",
            "Deletion: Delete your account and all data — from Settings or by emailing us",
            "Withdraw consent: Stop using the App at any time",
            "Grievance redressal: Contact our Grievance Officer below",
          ]} />
          <p style={{ ...body, marginTop: 12 }}>We respond to all requests within <b>30 days</b> as required under SPDI Rule 5(7).</p>
        </Section>

        <Section title="6. Administrative Access">
          <p style={body}>As the operator of JustLog, we have administrative access to the database for maintenance, security, and bug resolution purposes. This access is:</p>
          <List items={[
            "Used only when necessary — such as investigating a reported issue or ensuring system integrity",
            "Never used to read, browse, or monitor individual user entries or financial data",
            "Subject to the same confidentiality obligations as this Privacy Policy",
          ]} />
          <p style={{ ...body, marginTop: 12 }}>Your transaction data is isolated per account using Row Level Security (RLS). No other user — or any unauthorised party — can access your entries through the app.</p>
        </Section>

        <Section title="7. Data Retention">
          <p style={body}>We retain your data as long as your account is active. If you delete your account, all personal data is permanently deleted within <b>30 days</b>.</p>
        </Section>

        <Section title="8. Children's Privacy">
          <p style={body}>JustLog is not intended for users under 13 years of age. We do not knowingly collect data from children.</p>
        </Section>

        <Section title="9. Changes to This Policy">
          <p style={body}>We may update this Privacy Policy from time to time. We will notify you of significant changes via email or an in-app notice. Continued use of the App after changes constitutes acceptance of the updated Policy.</p>
        </Section>

        <Section title="10. Grievance Officer">
          <p style={{ ...body, marginBottom: 12 }}>In accordance with the IT Act, 2000 and SPDI Rules:</p>
          <div style={{ background: "#fff", border: "1.5px solid rgba(200,49,255,0.15)", borderRadius: 14, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
            {[["Name", "Pavan Jaya"], ["Email", "jangidpavan@gmail.com"], ["Address", "India"], ["Response time", "Within 30 days"]].map(([k, v]) => (
              <div key={k} style={{ display: "flex", gap: 12, fontSize: 14 }}>
                <span style={{ color: "#aaa", minWidth: 110 }}>{k}</span>
                <span style={{ color: "#111", fontWeight: 500 }}>{k === "Email" ? <a href={`mailto:${v}`} style={{ color: "#C831FF", textDecoration: "none" }}>{v}</a> : v}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="11. Contact Us">
          <p style={body}>For any privacy questions, email <a href="mailto:jangidpavan@gmail.com" style={{ color: "#C831FF", textDecoration: "none", fontWeight: 500 }}>jangidpavan@gmail.com</a>.</p>
        </Section>

        {/* Footer */}
        <div style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <span style={{ fontSize: 13, color: "#bbb" }}>© 2025 JustLog</span>
          <div style={{ display: "flex", gap: 20 }}>
            <Link href="/terms" style={{ fontSize: 13, color: "#888", textDecoration: "none" }}>Terms of Service</Link>
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

function Sub({ children }: { children: React.ReactNode }) {
  return <h3 style={{ fontSize: 14, fontWeight: 600, color: "#333", margin: "16px 0 6px" }}>{children}</h3>;
}

function List({ items }: { items: string[] }) {
  return (
    <ul style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6 }}>
      {items.map((item) => <li key={item} style={{ fontSize: 14, color: "#555", lineHeight: 1.6 }}>{item}</li>)}
    </ul>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 10, padding: "10px 14px", margin: "10px 0", fontSize: 13, color: "#92400E", lineHeight: 1.5 }}>
      ⚡ {children}
    </div>
  );
}
