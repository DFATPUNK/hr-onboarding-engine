import { Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import OnboardingDetails from "./pages/OnboardingDetails";
import AuditLog from "./pages/AuditLog";

export default function App() {
  return (
    <div style={{ maxWidth: "100vw", margin: 0, padding: 24, boxSizing: "border-box", fontFamily: "system-ui, -apple-system, Segoe UI, Roboto" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
          <div style={{ fontWeight: 900 }}>Automated Onboarding — Zero Touch</div>
          <div style={{ fontSize: 14, opacity: 0.75 }}>
            From offer signed to Day 1 readiness — without manual coordination.
          </div>
        </Link>
        <a href="https://jeremybrunet.com" target="_blank" rel="noreferrer" style={{ fontSize: 14 }}>
          jeremybrunet.com
        </a>
      </header>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/onboarding/:runId" element={<OnboardingDetails />} />
        <Route path="/audit/:runId" element={<AuditLog />} />
      </Routes>

      <footer style={{ marginTop: 40, fontSize: 12, opacity: 0.7 }}>
        Demo — Serverless APIs (Vercel) + Activepieces + Supabase.
      </footer>
    </div>
  );
}