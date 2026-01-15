import { Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import RunLog from "./pages/RunLog";

export default function App() {
  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: 24, fontFamily: "system-ui, -apple-system, Segoe UI, Roboto" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
          <div style={{ fontWeight: 800 }}>Zero-Touch Onboarding Engine</div>
          <div style={{ fontSize: 14, opacity: 0.75 }}>From signal → outcome, with full auditability.</div>
        </Link>
        <a href="https://jeremybrunet.com" target="_blank" rel="noreferrer" style={{ fontSize: 14 }}>
          jeremybrunet.com
        </a>
      </header>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/runs/:runId" element={<RunLog />} />
      </Routes>

      <footer style={{ marginTop: 40, fontSize: 12, opacity: 0.7 }}>
        Demo app — serverless APIs + Activepieces + Supabase.
      </footer>
    </div>
  );
}