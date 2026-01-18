import { Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import OnboardingDetails from "./pages/OnboardingDetails";
import AuditLog from "./pages/AuditLog";

export default function App() {
  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", padding: 16 }}>
      <header style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
            <div style={{ fontWeight: 900, fontSize: 20 }}>Automated onboarding — Zero Touch</div>
            <div style={{ fontSize: 13, opacity: 0.75 }}>
              From offer signed to Day 1 readiness — without manual coordination.
            </div>
          </Link>

          <div style={{ fontSize: 14, opacity: 0.9, marginTop: 8, maxWidth: 980, lineHeight: 1.45 }}>
            This demo simulates what happens after a new hire signs an offer. The system executes deterministic onboarding
            actions automatically, and escalates to HR only when ambiguity is detected.
          </div>
        </div>

        <a href="https://jeremybrunet.com" target="_blank" rel="noreferrer" style={{ fontSize: 14 }}>
          jeremybrunet.com
        </a>
      </header>
      <main style={{ flex: 1, minHeight: 0 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/onboarding/:runId" element={<OnboardingDetails />} />
          <Route path="/audit/:runId" element={<AuditLog />} />
        </Routes>
      </main>

      <footer style={{ fontSize: 12, opacity: 0.7, marginTop: 10 }}>
        Demo — Serverless APIs (Vercel) + Activepieces + Supabase.
      </footer>
    </div>
  );
}